/**
 * useItemSearchBox.js
 *
 * Reusable orchestration hook for ItemSearchBox.
 * - Owns local search input + committed query state
 * - Fetches paginated item previews via Meilisearch (searchItems)
 * - Eagerly caches full item details for the current page
 * - Exposes pagination, loading, error, and search handlers
 *
 * @function useItemSearchBox
 * @param {object} [options]
 * @param {object} [options.fixedFilters] - Meilisearch filter expression applied on every request.
 * @param {number} [options.pageSize=25] - Results per page.
 * @param {string} [options.sortField="name"] - Default sort field.
 * @param {string} [options.sortOrder="asc"] - Default sort order.
 * @param {string} [options.placeholder="Search inventory…"] - Passed through for UI.
 * @returns {object} View model for ItemSearchBox rendering and interactions.
 */

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { useQuery, useQueries } from "@tanstack/react-query";
import { itemKeys } from "../../../api/item/ItemQueryKeys";
import { getItemDetails, searchItems } from "../../../api/item/item";

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
 * Delay before committing a search query after the user stops typing.
 *
 * @constant
 * @type {number}
 */
const DEBOUNCE_MS = 300;

/**
 * buildSortExpression
 * Converts field + order into a Meilisearch sort string.
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

export const useItemSearchBox = ({
                                     fixedFilters = null,
                                     pageSize: initialPageSize = 25,
                                     sortField = "name",
                                     sortOrder = "asc",
                                     placeholder = "Search inventory…",
                                 } = {}) => {
    logger.info("useItemSearchBox initialized", {
        fixedFilters,
        initialPageSize,
        sortField,
        sortOrder,
    });

    /**
     * searchInput
     * Live value bound to the text input (updates on every keystroke).
     *
     * @type {[string, Function]}
     */
    const [searchInput, setSearchInput] = useState("");

    /**
     * committedQuery
     * The query string actually sent to the API.
     * Updated on Enter or after debounce.
     *
     * @type {[string, Function]}
     */
    const [committedQuery, setCommittedQuery] = useState("");

    /**
     * page
     * Current 1-based page number.
     *
     * @type {[number, Function]}
     */
    const [page, setPage] = useState(1);

    /**
     * pageSize
     * Results per page.
     *
     * @type {[number, Function]}
     */
    const [pageSize, setPageSize] = useState(initialPageSize);

    /**
     * Debounce timer ref.
     *
     * @type {React.MutableRefObject<any>}
     */
    const debounceRef = useRef(null);

    /**
     * commitQuery
     * Sets the committed query and resets to page 1.
     *
     * @function commitQuery
     * @param {string} query
     * @returns {void}
     */
    const commitQuery = useCallback((query) => {
        const trimmed = (query || "").trim();
        logger.info("commitQuery", { query: trimmed });
        setCommittedQuery(trimmed);
        setPage(1);
    }, []);

    /**
     * handleSearchChange
     * Updates live input and starts debounce timer.
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
     * Commits immediately on Enter (cancels pending debounce).
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

    /**
     * sort
     * Meilisearch sort expression derived from props.
     *
     * @type {string|null}
     */
    const sort = useMemo(
        () => buildSortExpression(sortField, sortOrder),
        [sortField, sortOrder],
    );

    /**
     * searchParams
     * The canonical params object sent to the API, also used as part of the query key.
     *
     * @type {object}
     */
    const searchParams = useMemo(() => {
        const params = {
            query: committedQuery || undefined,
            page,
            size: pageSize,
        };

        if (sort) {
            params.sort = sort;
        }

        if (fixedFilters) {
            params.filters = fixedFilters;
        }

        return params;
    }, [committedQuery, page, pageSize, sort, fixedFilters]);

    /**
     * Main search query via TanStack Query.
     * Uses itemKeys.search for canonical cache key.
     */
    const {
        data: searchResult,
        isPending,
        isError,
        error,
        refetch,
    } = useQuery({
        queryKey: itemKeys.search(searchParams),
        queryFn: async () => {
            logger.info("searchItems queryFn called", searchParams);

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

            return response?.data ?? {};
        },
        keepPreviousData: true,
    });

    /**
     * Derived item list from search result.
     *
     * @type {Array<object>}
     */
    const items = useMemo(() => searchResult?.hits ?? [], [searchResult]);

    /**
     * totalItems
     *
     * @type {number}
     */
    const totalItems = searchResult?.totalHits ?? 0;

    /**
     * totalPages
     *
     * @type {number}
     */
    const totalPages = Math.ceil(totalItems / pageSize) || 1;

    /**
     * Pagination helpers.
     */
    const hasPrevious = page > 1;
    const hasNext = page < totalPages;
    const itemStart = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
    const itemEnd = Math.min(page * pageSize, totalItems);

    /**
     * handleNext
     *
     * @function handleNext
     * @returns {void}
     */
    const handleNext = useCallback(() => {
        if (page < totalPages) {
            logger.info("handleNext", { from: page, to: page + 1 });
            setPage((p) => p + 1);
        }
    }, [page, totalPages]);

    /**
     * handlePrevious
     *
     * @function handlePrevious
     * @returns {void}
     */
    const handlePrevious = useCallback(() => {
        if (page > 1) {
            logger.info("handlePrevious", { from: page, to: page - 1 });
            setPage((p) => p - 1);
        }
    }, [page]);

    /**
     * Eagerly cache full item details for every item on the current page.
     * Uses useQueries so each itemId gets its own cache entry under itemKeys.details(id).
     */
    useQueries({
        queries: (items || [])
            .map((item) => item && (item.itemId ?? item.id))
            .filter((id) => id != null)
            .map((id) => ({
                queryKey: itemKeys.details(id),
                queryFn: async () => {
                    logger.info("Eager detail prefetch for item", { itemId: id });
                    return getItemDetails(id);
                },
                staleTime: 10 * 60 * 1000,
                enabled: true,
            })),
    });

    return {
        // search input
        searchInput,
        handleSearchChange,
        handleSearchKeyDown,
        placeholder,

        // data
        items,
        isPending,
        isError,
        error,

        // pagination
        page,
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

        // actions
        refetch,
    };
};

export default useItemSearchBox;