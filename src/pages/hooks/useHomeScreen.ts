/**
 * useHomeScreen
 * Hook for HomeScreen that:
 * - Fetches paginated item previews via useItemCardGrid (Meilisearch search).
 * - Eagerly caches full item details for all items on the current page using
 *   the canonical itemKeys.details pattern (so ViewItemModal can reuse cache).
 * - Manages local search input state for the dashboard.
 *
 * @function useHomeScreen
 * @returns {UseHomeScreenResult}
 */
import { useState, useCallback, ChangeEvent } from "react";
import { useQueries } from "@tanstack/react-query";
import useItemCardGrid from "../../features/item/hooks/useItemCardGrid";
import itemKeys from "../api/item/ItemQueryKeys";
import { getItemDetails } from "../api/item/item";

/**
 * Logger for useHomeScreen.
 * @constant
 * @type {{info: Function, error: Function}}
 */
const logger: { info: (...args: any[]) => void; error: (...args: any[]) => void } = {
    info: (...args: any[]) => console.log("[useHomeScreen]", ...args),
    error: (...args: any[]) => console.error("[useHomeScreen]", ...args),
};

/**
 * Type for an item preview (from useItemCardGrid).
 */
interface ItemPreview {
    itemId?: string | number;
    id?: string | number;
    [key: string]: any;
}

/**
 * Return type for useHomeScreen.
 */
export interface UseHomeScreenResult {
    items: ItemPreview[];
    isPending: boolean;
    isError: boolean;
    error: any;
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
    search: string;
    handleSearchChange: (e: ChangeEvent<HTMLInputElement>) => void;
}

export const useHomeScreen = (): UseHomeScreenResult => {
    logger.info("useHomeScreen initialized");

    const [search, setSearch] = useState<string>("");

    /**
     * Handles changes to the search input.
     * @function handleSearchChange
     * @param {React.ChangeEvent<HTMLInputElement>} e
     * @returns {void}
     */
    const handleSearchChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        setSearch(e.target.value);
    }, []);

    // Paginated item previews (Meilisearch hits) for the dashboard grid.
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

    // Eagerly load and cache item details for all items on the current page.
    useQueries({
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

export default useHomeScreen;