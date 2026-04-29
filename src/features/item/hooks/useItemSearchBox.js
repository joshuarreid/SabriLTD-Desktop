/**
 * useItemSearchBox.js
 *
 * Reusable orchestration hook for ItemSearchBox.
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
 * @returns {object} View model for ItemSearchBox rendering and interactions.
 */

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { itemKeys } from "../api/ItemQueryKeys.ts";
import { searchItems } from "../api/item.ts";
import { useItemSearchPagination } from "./useItemSearchPagination.js";

/**
 * Logger for useItemSearchBox.
 *
 * @constant
 * @type {{info: Function, error: Function}}
 */
const logger = {
    info: (...args) => console.log("[useItemSearchBox]", ...args),
    error: (...args) => console.error("[useItemSearchBox]", ...args),
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
const buildSortExpression = (field, order) => {
    if (!field) return null;
    return `${field}:${order || "asc"}`;
};

/**
 * normalizeItemSearchResponse
 * Ensures the client always receives a safe, API-shaped object.
 *
 * @function normalizeItemSearchResponse
 * @param {any} raw
 * @returns {{
 *   hits: Array<object>,
 *   hitsCount: number,
 *   totalHits: number,
 *   page: number,
 *   size: number,
 *   sort: string|null,
 *   includeArchived: boolean|null,
 * }}
 */
const normalizeItemSearchResponse = (raw) => {
    const hits = Array.isArray(raw?.hits) ? raw.hits : [];

    const hitsCount =
        typeof raw?.hitsCount === "number"
            ? raw.hitsCount
            : hits.length;

    const totalHits =
        typeof raw?.totalHits === "number"
            ? raw.totalHits
            : hitsCount;

    const page =
        typeof raw?.page === "number" && raw.page > 0
            ? raw.page
            : 1;

    const size =
        typeof raw?.size === "number" && raw.size > 0
            ? raw.size
            : hits.length || 0;

    const sort = typeof raw?.sort === "string" ? raw.sort : null;

    const includeArchived =
        typeof raw?.includeArchived === "boolean"
            ? raw.includeArchived
            : null;

    return {
        hits,
        hitsCount,
        totalHits,
        page,
        size,
        sort,
        includeArchived,
    };
};

export const useItemSearchBox = ({
                                     fixedFilters = null,
                                     pageSize: initialPageSize = 25,
                                     sortField = "name",
                                     sortOrder = "asc",
                                     placeholder = "Search inventory…",
                                     includeArchived = false,
                                 } = {}) => {
    logger.info("useItemSearchBox initialized", {
        fixedFilters,
        initialPageSize,
        sortField,
        sortOrder,
        includeArchived,
    });

    const [searchInput, setSearchInput] = useState("");
    const [committedQuery, setCommittedQuery] = useState("");

    /**
     * serverMeta
     * Must be state so pagination can recompute when the API response changes.
     *
     * @type {[{totalHits:number|null,page:number|null,size:number|null}, Function]}
     */
    const [serverMeta, setServerMeta] = useState(() => ({
        totalHits: null,
        page: null,
        size: null,
    }));

    /**
     * debounceRef
     *
     * @type {React.MutableRefObject<any>}
     */
    const debounceRef = useRef(null);

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
        (e) => {
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
        (e) => {
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

    /**
     * searchParams
     * Must match ItemSearchRequest.
     *
     * @type {object}
     */
    const searchParams = useMemo(() => {
        const params = {
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
    } = useQuery({
        queryKey: itemKeys.search(searchParams),
        queryFn: async () => {
            logger.info("searchItems queryFn called", {
                query: searchParams.query,
                hasFilters: Boolean(searchParams.filters),
                page: searchParams.page,
                size: searchParams.size,
                sort: searchParams.sort,
                includeArchived: searchParams.includeArchived ?? false,
            });

            const response = await searchItems(searchParams);

            if (
                response?.status !== "OK" &&
                response?.status !== "success" &&
                response?.status !== 200
            ) {
                logger.error("searchItems unexpected response status", response);
                throw new Error(
                    response?.errors?.length
                        ? response.errors.map((e) => e.message).join(", ")
                        : "Search failed",
                );
            }

            const normalized = normalizeItemSearchResponse(response?.data);

            logger.info("searchItems response normalized", {
                requestedPage: pagination.requestedPage,
                requestedSize: pagination.pageSize,
                responsePage: normalized.page,
                responseSize: normalized.size,
                hitsCount: normalized.hitsCount,
                totalHits: normalized.totalHits,
                includeArchived: normalized.includeArchived,
            });

            return normalized;
        },
        keepPreviousData: true,
    });

    /**
     * Sync server meta from the latest response.
     */
    useEffect(() => {
        if (!searchResult) return;

        const nextMeta = {
            totalHits: typeof searchResult.totalHits === "number" ? searchResult.totalHits : null,
            page: typeof searchResult.page === "number" ? searchResult.page : null,
            size: typeof searchResult.size === "number" ? searchResult.size : null,
        };

        logger.info("serverMeta updated from ItemSearchResponse", nextMeta);
        setServerMeta(nextMeta);
    }, [searchResult]);

    const items = useMemo(() => searchResult?.hits ?? [], [searchResult?.hits]);

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

        // pagination (canonical)
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

export default useItemSearchBox;
