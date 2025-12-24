import { useQuery } from "@tanstack/react-query";
import { useState, useMemo, useCallback, useEffect } from "react";
import {getAllItems} from "../../../api/item/item";
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
 * useItemCardGrid
 * Provides paginated, always-filtered items for ItemCardGrid.
 *
 * @function useItemCardGrid
 * @param {Object} [options]
 * @param {Object} [options.fixedFilters={}] - Filters always applied to all API requests (e.g. { jobId, status, archived }).
 * @param {number} [options.initialPage=1] - Initial page number.
 * @param {number} [options.pageSize=15] - Items per page.
 * @param {string} [options.sortField="name"] - Sort field.
 * @param {"asc"|"desc"} [options.sortOrder="asc"] - Sort order.
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
                                    initialPage = 1,
                                    pageSize: defaultPageSize = 15,
                                    sortField = "name",
                                    sortOrder = "asc",
                                } = {}) => {
    // --- Pagination state ---
    const [page, setPage] = useState(initialPage);
    const [pageSize, setPageSize] = useState(defaultPageSize);

    // --- Query key includes fixedFilters, page, pageSize, sort ---
    const queryKey = useMemo(
        () => itemKeys.list({ ...fixedFilters, page, size: pageSize, sortField, sortOrder }),
        [fixedFilters, page, pageSize, sortField, sortOrder]
    );

    // --- Main API query ---
    const {
        data: itemsResponse,
        isPending,
        isError,
        error,
        refetch,
    } = useQuery({
        queryKey,
        queryFn: async () => {
            logger.info("API query called", {
                fixedFilters,
                page,
                pageSize,
                sortField,
                sortOrder,
            });
            const res = await getAllItems({
                ...fixedFilters,
                page,
                size: pageSize,
                sortField,
                sortOrder,
            });
            logger.info("API success", {
                count: Array.isArray(res?.data) ? res.data.length : 0,
                meta: res?.meta,
            });
            return res;
        },
        keepPreviousData: true,
    });

    // --- Server meta ---
    const meta = itemsResponse?.meta || {};
    const items = itemsResponse?.data || [];
    const totalItems = typeof meta.totalRecords === "number" ? meta.totalRecords : 0;
    const totalPages = typeof meta.totalPages === "number" ? meta.totalPages : 1;
    const currentPage = typeof meta.page === "number" ? meta.page : page;

    const hasPrevious = currentPage > 1;
    const hasNext = currentPage < totalPages;
    const itemStart = totalItems > 0 ? (currentPage - 1) * pageSize + 1 : 0;
    const itemEnd = totalItems > 0 ? Math.min(currentPage * pageSize, totalItems) : 0;

    // --- Pagination event handlers ---
    const handleNext = useCallback(() => {
        if (hasNext) setPage(currentPage + 1);
    }, [hasNext, currentPage]);

    const handlePrevious = useCallback(() => {
        if (hasPrevious) setPage(currentPage - 1);
    }, [hasPrevious, currentPage]);

    useEffect(() => {
        logger.info("Pagination:", {
            page,
            pageSize,
            totalPages,
            totalItems,
        });
    }, [page, pageSize, totalPages, totalItems]);

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