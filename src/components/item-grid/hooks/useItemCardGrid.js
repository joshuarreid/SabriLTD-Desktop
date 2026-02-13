import { useQuery } from "@tanstack/react-query";
import { useState, useMemo, useCallback, useEffect } from "react";
import { searchItems } from "../../../api/item/item";
import itemKeys from "../../../api/item/ItemQueryKeys";

/**
 * logger for useItemCardGrid hook.
 *
 * @constant
 * @type {{info: Function, error: Function}}
 */
const logger = {
    info: (...args) => console.log("[useItemCardGrid]", ...args),
    error: (...args) => console.error("[useItemCardGrid]", ...args),
};

/**
 * Converts fixed filters (object) to Meilisearch filters string if needed.
 * E.g.: { jobId: 123, status: "Active" } => "jobIds = 123 AND status = 'Active'"
 *
 * @param {object} filters
 * @returns {string} Meilisearch filters string
 */
function buildFiltersString(filters = {}) {
    const filterParts = Object.entries(filters)
        .filter(([key, value]) => value !== undefined && value !== null && value !== "")
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
 * Meilisearch-backed POST /api/items/search endpoint.
 *
 * @function useItemCardGrid
 * @param {Object} [options]
 * @param {Object} [options.fixedFilters={}] - Filters always applied to all API requests (e.g. { jobId, status, archived }).
 * @param {string} [options.query=""] - Optional search string.
 * @param {number} [options.initialPage=1] - Initial page number.
 * @param {number} [options.pageSize=15] - Items per page.
 * @param {string} [options.sortField="name"] - Sort field.
 * @param {"asc"|"desc"} [options.sortOrder="asc"] - Sort order.
 * @param {boolean} [options.includeArchived] - (optional) Pass true to override default and show archived.
 * @returns {{
 *   items: Array,
 *   isPending: boolean,
 *   isError: boolean,
 *   error: any,
 *   page: number,
 *   setPage: function,
 *   pageSize: number,
 *   setPageSize: function,
 *   totalPages: number,
 *   totalItems: number,
 *   itemStart: number,
 *   itemEnd: number,
 *   hasPrevious: boolean,
 *   hasNext: boolean,
 *   handleNext: function,
 *   handlePrevious: function,
 *   refetch: function
 * }}
 */
export const useItemCardGrid = ({
                                    fixedFilters = {},
                                    query = "",
                                    initialPage = 1,
                                    pageSize: defaultPageSize = 15,
                                    sortField = "name",
                                    sortOrder = "asc",
                                    includeArchived,
                                } = {}) => {
    // --- Pagination state
    const [page, setPage] = useState(initialPage);
    const [pageSize, setPageSize] = useState(defaultPageSize);

    // --- Convert sorting to Meilisearch format: field:order (e.g., name:asc)
    const sortKey = useMemo(() => {
        if (!sortField) return undefined;
        return `${sortField}:${sortOrder}`;
    }, [sortField, sortOrder]);

    // --- Build Meilisearch-compatible filters string
    const filtersString = useMemo(
        () => buildFiltersString(fixedFilters),
        [fixedFilters],
    );

    // --- Compose POST /api/items/search payload
    const searchPayload = useMemo(() => {
        const payload = {
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

    // --- Query key
    const queryKey = useMemo(
        () => itemKeys.search(searchPayload),
        [searchPayload],
    );

    /**
     * Fetches items via POST /api/items/search (Meilisearch).
     */
    const {
        data: searchResponse,
        isPending,
        isError,
        error,
        refetch,
    } = useQuery({
        queryKey,
        queryFn: async () => {
            logger.info("useItemCardGrid API query called", searchPayload);
            try {
                const res = await searchItems(searchPayload);
                logger.info("useItemCardGrid API success", {
                    hitsCount: res?.data?.hitsCount,
                    totalHits: res?.data?.totalHits,
                    page: res?.data?.page,
                    size: res?.data?.size,
                    sort: res?.data?.sort,
                    includeArchived: res?.data?.includeArchived,
                });
                return res;
            } catch (apiError) {
                logger.error(
                    "useItemCardGrid searchItems failed (API)",
                    apiError,
                );
                throw apiError;
            }
        },
        keepPreviousData: true,
    });

    // --- Response parsing
    const data = searchResponse?.data || {};

    /**
     * rawItems
     * Raw Meilisearch hits array, typically:
     * { id, name, condition, photoUrl, tags, ... }.
     *
     * @type {Array}
     */
    const rawItems = Array.isArray(data.hits) ? data.hits : [];

    /**
     * items
     * Normalized array where every item has both `id` and `itemId`.
     * This keeps downstream components agnostic of Meilisearch's "id" naming.
     *
     * @type {Array}
     */
    const items = rawItems.map((hit) => {
        const normalizedId =
            typeof hit.itemId === "number" || typeof hit.itemId === "string"
                ? hit.itemId
                : hit.id;
        return {
            ...hit,
            id: normalizedId,
            itemId: normalizedId,
        };
    });

    const totalItems =
        typeof data.totalHits === "number" ? data.totalHits : 0;
    const totalPages =
        typeof data.size === "number" && data.size > 0
            ? Math.max(1, Math.ceil(totalItems / data.size))
            : 1;
    const currentPage =
        typeof data.page === "number" ? data.page : page;

    const hasPrevious = currentPage > 1;
    const hasNext = currentPage < totalPages;
    const itemStart =
        totalItems > 0 ? (currentPage - 1) * pageSize + 1 : 0;
    const itemEnd =
        totalItems > 0 ? Math.min(currentPage * pageSize, totalItems) : 0;

    /**
     * Pagination handlers.
     */
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