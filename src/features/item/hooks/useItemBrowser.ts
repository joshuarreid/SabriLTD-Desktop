/**
 * useItemBrowser.js
 *
 * Reusable orchestration hook for ItemBrowser.
 * - Owns local search input + committed query state
 * - Fetches paginated item previews via Meilisearch (searchItems)
 * - Uses useItemSearchPagination for canonical pagination meta and clamping
 *
 * API Contract:
 * - ItemSearchRequest: { query, filters, page(1-based), size, sort, includeArchived }
 * - ItemSearchResponse: { hits, hitsCount, totalHits, page, size, sort, includeArchived }
 *
 * @function useItemSearchBox
 * @param {object} [options]
 * @param {string|null} [options.fixedFilters] - Meilisearch filter expression applied on every request.
 * @param {number} [options.pageSize=25] - Results per page.
 * @param {string} [options.sortField="name"] - Default sort field.
 * @param {string} [options.sortOrder="asc"] - Default sort order.
 * @param {string} [options.placeholder="Search inventory…"] - Passed through for UI.
 * @param {boolean} [options.includeArchived=false] - Include archived item in search.
 * @returns {object} View model for ItemBrowser rendering and interactions.
 */

import { useState, useCallback, useMemo, useRef, useEffect, ChangeEvent, KeyboardEvent } from "react";
import { useSearchItems } from "./useItems";
import { useItemSearchPagination } from "./useItemSearchPagination";

/**
 * Logger for useItemBrowser.
 *
 * @constant
 * @type {{info: Function, error: Function}}
 */
const logger = {
    info: (...args) => console.log("[useItemBrowser]", ...args),
    error: (...args) => console.error("[useItemBrowser]", ...args),
};

/**
 * DEBOUNCE_MS
 *
 * @constant
 * @type {number}
 */
const DEBOUNCE_MS = 300;

/**
 * buildSortExpression
 *
 * @function buildSortExpression
 * @param {string} field
 * @param {string} order
 * @returns {string|null}
 */
const buildSortExpression = (field: string, order: string): string | null => {
    if (!field) return null;
    return `${field}:${order || "asc"}`;
};

type ItemHit = Record<string, unknown>;

interface ItemSearchParams {
    query?: string;
    filters?: string;
    page?: number;
    size?: number;
    sort?: string;
    includeArchived?: boolean;
}

interface ItemSearchResponse {
    hits: ItemHit[];
    hitsCount: number;
    totalHits: number;
    page: number;
    size: number;
    sort: string | null;
    includeArchived: boolean | null;
}

interface UseItemBrowserOptions {
    fixedFilters?: string | null;
    pageSize?: number;
    sortField?: string;
    sortOrder?: string;
    placeholder?: string;
    includeArchived?: boolean;
}

interface UseItemBrowserReturn {
    searchInput: string;
    handleSearchChange: (e: ChangeEvent<HTMLInputElement>) => void;
    handleSearchKeyDown: (e: KeyboardEvent<HTMLInputElement>) => void;
    placeholder: string;

    items: ItemHit[];
    isPending: boolean;
    isFetching: boolean;
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
 * useItemBrowser
 *
 * @function useItemBrowser
 * @param {object} [options]
 * @param {string|null} [options.fixedFilters] - Meilisearch filter expression applied on every request.
 * @param {number} [options.pageSize=25] - Results per page.
 * @param {string} [options.sortField="name"] - Default sort field.
 * @param {string} [options.sortOrder="asc"] - Default sort order.
 * @param {string} [options.placeholder="Search inventory…"] - Passed through for UI.
 * @param {boolean} [options.includeArchived=false] - Include archived item in search.
 * @returns {object} View model for ItemBrowser rendering and interactions.
 */
export const useItemBrowser = ({
    fixedFilters = null,
    pageSize: initialPageSize = 25,
    sortField = "name",
    sortOrder = "asc",
    placeholder = "Search inventory…",
    includeArchived = false,
}: UseItemBrowserOptions = {}): UseItemBrowserReturn => {
    logger.info("useItemBrowser initialized", {
        fixedFilters,
        initialPageSize,
        sortField,
        sortOrder,
        includeArchived,
    });

    const [searchInput, setSearchInput] = useState<string>("");
    const [committedQuery, setCommittedQuery] = useState<string>("");

    const [serverMeta, setServerMeta] = useState<{ totalHits: number | null; page: number | null; size: number | null }>(() => ({
        totalHits: null,
        page: null,
        size: null,
    }));

    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    /**
     * pagination
     * Receives server totals from serverMeta (state).
     */
    const pagination = useItemSearchPagination({
        initialPage: 1,
        initialPageSize,
        totalHits: serverMeta.totalHits,
        serverPage: serverMeta.page,
        serverSize: serverMeta.size,
        preferPageSource: "server",
    });

    /**
     * commitQuery
     *
     * @function commitQuery
     * @param {string} query
     * @returns {void}
     */
    const commitQuery = useCallback(
        (query) => {
            const trimmed = (query || "").trim();
            logger.info("commitQuery", { query: trimmed });

            setCommittedQuery(trimmed);

            setServerMeta({
                totalHits: null,
                page: null,
                size: null,
            });

            pagination.resetPagination();
        },
        [pagination],
    );

    /**
     * handleSearchChange
     *
     * @function handleSearchChange
     * @param {React.ChangeEvent<HTMLInputElement>} e
     * @returns {void}
     */
    const handleSearchChange = useCallback(
        (e: ChangeEvent<HTMLInputElement>) => {
            const next = e.target.value;
            setSearchInput(next);

            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }

            debounceRef.current = setTimeout(() => {
                commitQuery(next);
            }, DEBOUNCE_MS);
        },
        [commitQuery],
    );

    /**
     * handleSearchKeyDown
     *
     * @function handleSearchKeyDown
     * @param {React.KeyboardEvent<HTMLInputElement>} e
     * @returns {void}
     */
    const handleSearchKeyDown = useCallback(
        (e: KeyboardEvent<HTMLInputElement>) => {
            if (e.key === "Enter") {
                e.preventDefault();

                if (debounceRef.current) {
                    clearTimeout(debounceRef.current);
                    debounceRef.current = null;
                }

                commitQuery(searchInput);
            }
        },
        [searchInput, commitQuery],
    );

    /**
     * Cleanup debounce on unmount.
     *
     * @effect
     */
    useEffect(() => {
        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
        };
    }, []);

    const sort = useMemo(
        () => buildSortExpression(sortField, sortOrder),
        [sortField, sortOrder],
    );

    const searchParams: ItemSearchParams = useMemo(() => {
        const params: ItemSearchParams = {
            query: committedQuery || undefined,
            filters: fixedFilters || undefined,
            page: pagination.requestedPage,
            size: pagination.pageSize,
            sort: sort || undefined,
            includeArchived: includeArchived || undefined,
        };

        logger.info("searchParams built", {
            query: params.query,
            hasFilters: Boolean(params.filters),
            page: params.page,
            size: params.size,
            sort: params.sort,
            includeArchived: params.includeArchived ?? false,
        });

        return params;
    }, [
        committedQuery,
        fixedFilters,
        pagination.requestedPage,
        pagination.pageSize,
        sort,
        includeArchived,
    ]);

    const {
        data: searchResult,
        isPending,
        isFetching,
        isError,
        error,
        refetch,
    } = useSearchItems(searchParams as Record<string, unknown>);

    /**
     * Sync server meta from the latest response.
     */
    useEffect(() => {
        if (!searchResult) return;

        const typed = searchResult as unknown as ItemSearchResponse;

        const nextMeta = {
            totalHits: typeof typed.totalHits === "number" ? typed.totalHits : null,
            page: typeof typed.page === "number" ? typed.page : null,
            size: typeof typed.size === "number" ? typed.size : null,
        };

        logger.info("serverMeta updated from ItemSearchResponse", nextMeta);
        setServerMeta(nextMeta);
    }, [searchResult]);

    const items = useMemo<ItemHit[]>(() => {
        const typed = searchResult as unknown as ItemSearchResponse | undefined;
        return typed?.hits ?? [];
    }, [searchResult]);

    return {
        // search input
        searchInput,
        handleSearchChange,
        handleSearchKeyDown,
        placeholder,

        // data
        items,
        isPending,
        isFetching,
        isError,
        error,

        // pagination
        page: pagination.page,
        setPage: pagination.setPage,
        pageSize: pagination.pageSize,
        setPageSize: pagination.setPageSize,
        totalPages: pagination.totalPages,
        totalItems: pagination.totalItems,
        itemStart: pagination.itemStart,
        itemEnd: pagination.itemEnd,
        hasPrevious: pagination.hasPrevious,
        hasNext: pagination.hasNext,
        handleNext: pagination.handleNext,
        handlePrevious: pagination.handlePrevious,

        // actions
        refetch,
    };
};

export default useItemBrowser;
