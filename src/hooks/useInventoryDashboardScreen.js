/**
 * useInventoryDashboardScreen
 * Hook for InventoryDashboardScreen that:
 * - Fetches paginated item previews via useItemCardGrid (Meilisearch search).
 * - Eagerly caches full item details for all items on the current page using
 *   the canonical itemKeys.details pattern (so ViewItemModal can reuse cache).
 * - Manages local search input state for the dashboard.
 *
 * @function useInventoryDashboardScreen
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
 *   refetch: function,
 *   search: string,
 *   handleSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void
 * }}
 */

import { useState, useCallback } from "react";
import { useQueries } from "@tanstack/react-query";
import useItemCardGrid from "../features/itemsearchbox/hooks/useItemCardGrid";
import itemKeys from "../api/item/ItemQueryKeys";
import { getItemDetails } from "../api/item/item";

/**
 * Logger for useInventoryDashboardScreen.
 *
 * @constant
 * @type {{info: Function, error: Function}}
 */
const logger = {
    info: (...args) => console.log("[useInventoryDashboardScreen]", ...args),
    error: (...args) => console.error("[useInventoryDashboardScreen]", ...args),
};

export const useInventoryDashboardScreen = () => {
    logger.info("useInventoryDashboardScreen initialized");

    /**
     * Search string for the dashboard search bar.
     *
     * NOTE: Currently only used for UI; ready to be wired into
     * useItemCardGrid(query) in the future if needed.
     *
     * @type {[string, Function]}
     */
    const [search, setSearch] = useState("");

    /**
     * Handles changes to the search input.
     *
     * @function handleSearchChange
     * @param {React.ChangeEvent<HTMLInputElement>} e
     * @returns {void}
     */
    const handleSearchChange = useCallback((e) => {
        setSearch(e.target.value);
    }, []);

    /**
     * Paginated item previews (Meilisearch hits) for the dashboard grid.
     */
    const {
        items,
        isPending,
        isError,
        error,
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
        refetch,
    } = useItemCardGrid({
        fixedFilters: {},
        initialPage: 1,
        pageSize: 25,
        sortField: "name",
        sortOrder: "asc",
    });

    /**
     * Eagerly load and cache item details for all items on the current page.
     * We use useQueries so each itemId has its own query, keyed by itemKeys.details(itemId),
     * matching the rest of the project (and ViewItemModal).
     */
    useQueries({
        /**
         * Builds a query config for each item in the current page.
         *
         * @returns {Array<import("@tanstack/react-query").UseQueryOptions>}
         */
        queries: (items || [])
            .map((item) => item && (item.itemId ?? item.id))
            .filter((id) => id != null)
            .map((id) => ({
                queryKey: itemKeys.details(id),
                queryFn: async () => {
                    logger.info(
                        "Dashboard eager details fetch (useQueries) for item",
                        { itemId: id },
                    );
                    return getItemDetails(id);
                },
                staleTime: 10 * 60 * 1000, // 10 minutes
                enabled: true,
            })),
    });

    return {
        items,
        isPending,
        isError,
        error,
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
        refetch,
        search,
        handleSearchChange,
    };
};

export default useInventoryDashboardScreen;