import { useState, useMemo, useCallback, useEffect } from "react";
import { useSearchItems } from "./useItems";

/**
 * logger for useItemCardGrid hook.
 */
const logger = {
    info: (...args: unknown[]) => console.log("[useItemCardGrid]", ...args),
    error: (...args: unknown[]) => console.error("[useItemCardGrid]", ...args),
};

type Primitive = string | number | boolean;
type FilterValue = Primitive | Primitive[] | null | undefined;
type FixedFilters = Record<string, FilterValue>;

type SortOrder = "asc" | "desc";

type ItemHit = Record<string, unknown> & {
    id?: string | number;
    itemId?: string | number;
};

export interface UseItemCardGridOptions {
    fixedFilters?: FixedFilters;
    query?: string;
    initialPage?: number;
    pageSize?: number;
    sortField?: string;
    sortOrder?: SortOrder;
    includeArchived?: boolean;
}

export interface UseItemCardGridReturn {
    items: ItemHit[];
    isPending: boolean;
    isError: boolean;
    error: unknown;
    page: number;
    setPage: (page: number) => void;
    pageSize: number;
    setPageSize: (size: number) => void;
    totalPages: number;
    totalItems: number;
    itemStart: number;
    itemEnd: number;
    hasPrevious: boolean;
    hasNext: boolean;
    handleNext: () => void;
    handlePrevious: () => void;
    refetch: () => void;
}

/**
 * Converts fixed filters (object) to Meilisearch filters string if needed.
 * E.g.: { jobId: 123, status: "Active" } => "jobIds = 123 AND status = 'Active'"
 */
function buildFiltersString(filters: FixedFilters = {}): string {
    const filterParts = Object.entries(filters)
        .filter(([, value]) => value !== undefined && value !== null && value !== "")
        .map(([key, value]) => {
            if (typeof value === "string") {
                return `${key} = '${value}'`;
            }
            if (Array.isArray(value)) {
                return value.length > 0
                    ? `(${value
                        .map((v) => `${key} = ${typeof v === "string" ? `'${v}'` : v}`)
                        .join(" OR ")})`
                    : "";
            }
            return `${key} = ${value}`;
        })
        .filter(Boolean);

    return filterParts.length > 0 ? filterParts.join(" AND ") : "";
}

/**
 * useItemCardGrid
 * Provides paginated, always-filtered items for ItemCardGrid using the
 * Meilisearch-backed POST /api/item/search endpoint.
 */
export const useItemCardGrid = ({
    fixedFilters = {},
    query = "",
    initialPage = 1,
    pageSize: defaultPageSize = 15,
    sortField = "name",
    sortOrder = "asc",
    includeArchived,
}: UseItemCardGridOptions = {}): UseItemCardGridReturn => {
    // --- Pagination state
    const [page, setPage] = useState<number>(initialPage);
    const [pageSize, setPageSize] = useState<number>(defaultPageSize);

    // --- Convert sorting to Meilisearch format: field:order (e.g., name:asc)
    const sortKey = useMemo<string | undefined>(() => {
        if (!sortField) return undefined;
        return `${sortField}:${sortOrder}`;
    }, [sortField, sortOrder]);

    // --- Build Meilisearch-compatible filters string
    const filtersString = useMemo(() => buildFiltersString(fixedFilters), [fixedFilters]);

    // --- Compose POST /api/item/search payload
    const searchPayload = useMemo<Record<string, unknown>>(() => {
        const payload: Record<string, unknown> = {
            query,
            filters: filtersString,
            page,
            size: pageSize,
            sort: sortKey,
        };

        if (typeof includeArchived === "boolean") {
            payload.includeArchived = includeArchived;
        }

        return payload;
    }, [query, filtersString, page, pageSize, sortKey, includeArchived]);

    // --- Query (centralized in useItems)
    const {
        data: dataNormalized,
        isPending,
        isError,
        error,
        refetch,
    } = useSearchItems(searchPayload);

    // dataNormalized is the normalized {hits,hitsCount,totalHits,page,size,...}
    const rawHits = useMemo<ItemHit[]>(() => {
        const hits = (dataNormalized as any)?.hits;
        return Array.isArray(hits) ? (hits as ItemHit[]) : [];
    }, [dataNormalized]);

    const items = useMemo<ItemHit[]>(() => {
        return rawHits.map((hit) => {
            const normalizedId =
                typeof (hit as any).itemId === "number" || typeof (hit as any).itemId === "string"
                    ? (hit as any).itemId
                    : (hit as any).id;

            return {
                ...hit,
                id: normalizedId,
                itemId: normalizedId,
            };
        });
    }, [rawHits]);

    const totalItems = useMemo(() => {
        const totalHits = (dataNormalized as any)?.totalHits;
        return typeof totalHits === "number" ? totalHits : 0;
    }, [dataNormalized]);

    const serverSize = useMemo(() => {
        const size = (dataNormalized as any)?.size;
        return typeof size === "number" && size > 0 ? size : pageSize;
    }, [dataNormalized, pageSize]);

    const totalPages = useMemo(() => {
        return serverSize > 0 ? Math.max(1, Math.ceil(totalItems / serverSize)) : 1;
    }, [totalItems, serverSize]);

    const currentPage = useMemo(() => {
        const p = (dataNormalized as any)?.page;
        return typeof p === "number" && p > 0 ? p : page;
    }, [dataNormalized, page]);

    const hasPrevious = currentPage > 1;
    const hasNext = currentPage < totalPages;

    const itemStart = totalItems > 0 ? (currentPage - 1) * pageSize + 1 : 0;
    const itemEnd = totalItems > 0 ? Math.min(currentPage * pageSize, totalItems) : 0;

    const handleNext = useCallback(() => {
        if (hasNext) setPage(currentPage + 1);
    }, [hasNext, currentPage]);

    const handlePrevious = useCallback(() => {
        if (hasPrevious) setPage(currentPage - 1);
    }, [hasPrevious, currentPage]);

    useEffect(() => {
        logger.info("useItemCardGrid pagination snapshot", {
            page,
            pageSize,
            totalPages,
            totalItems,
            filtersString,
        });
    }, [page, pageSize, totalPages, totalItems, filtersString]);

    return {
        items,
        isPending,
        isError,
        error,
        page: currentPage,
        setPage,
        pageSize,
        setPageSize,
        totalPages,
        totalItems,
        itemStart,
        itemEnd,
        hasPrevious,
        hasNext,
        handleNext,
        handlePrevious,
        refetch,
    };
};

export default useItemCardGrid;