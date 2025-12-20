/**
 * useJobScreenPagination.js
 *
 * Centralized pagination logic for the JobScreen.
 *
 * Responsibilities:
 * - Manage current page and pageSize for server-side pagination.
 * - Expose derived metadata: hasPrevious, hasNext, item range, etc.
 * - Provide handlers for changing pages from the UI.
 *
 * This hook does NOT fetch data. It is meant to be composed with useJobSearch
 * (or any other data hook) and consumed by useJobScreen / JobScreen.jsx.
 */

import { useCallback, useMemo, useState } from "react";

const logger = {
    info: (...args) => console.log("[useJobScreenPagination]", ...args),
    error: (...args) => console.error("[useJobScreenPagination]", ...args),
};

/**
 * useJobScreenPagination
 *
 * @param {{
 *   initialPage?: number,
 *   initialPageSize?: number,
 *   totalItems?: number | null,
 *   totalPagesFromServer?: number | null,
 * }} options
 *
 * - totalItems / totalPagesFromServer are optional and can be updated from the outside.
 *   This hook will:
 *   - Prefer totalPagesFromServer if provided.
 *   - Otherwise derive totalPages from totalItems & pageSize.
 */
export const useJobScreenPagination = ({
                                           initialPage = 1,
                                           initialPageSize = 25,
                                           totalItems = null,
                                           totalPagesFromServer = null,
                                       } = {}) => {
    /** @type {[number, Function]} */
    const [page, setPage] = useState(initialPage);

    /** @type {[number, Function]} */
    const [pageSize, setPageSize] = useState(initialPageSize);

    /**
     * totalPages
     * - Prefer server-provided total pages; fallback to derived value.
     */
    const totalPages = useMemo(() => {
        if (typeof totalPagesFromServer === "number" && totalPagesFromServer > 0) {
            return totalPagesFromServer;
        }

        if (typeof totalItems === "number" && totalItems > 0) {
            return Math.max(1, Math.ceil(totalItems / pageSize));
        }

        return 1;
    }, [totalPagesFromServer, totalItems, pageSize]);

    /**
     * currentPage
     * - Page number clamped to a valid range.
     */
    const currentPage = useMemo(() => {
        if (page < 1) return 1;
        if (page > totalPages) return totalPages;
        return page;
    }, [page, totalPages]);

    const hasPrevious = currentPage > 1;
    const hasNext = currentPage < totalPages;

    /**
     * itemStart / itemEnd
     * - 1-based item range for the current page, given totalItems (if provided).
     *   Safe defaults when totalItems is null/unknown.
     */
    const itemStart = useMemo(() => {
        if (!totalItems || totalItems === 0) return 0;
        return (currentPage - 1) * pageSize + 1;
    }, [currentPage, pageSize, totalItems]);

    const itemEnd = useMemo(() => {
        if (!totalItems || totalItems === 0) return 0;
        return Math.min(currentPage * pageSize, totalItems);
    }, [currentPage, pageSize, totalItems]);

    /**
     * handlePageChange
     * - Safely update the page, clamped to [1, totalPages].
     */
    const handlePageChange = useCallback(
        (nextPage) => {
            if (typeof nextPage !== "number" || Number.isNaN(nextPage)) return;

            const clamped =
                nextPage < 1 ? 1 : nextPage > totalPages ? totalPages : nextPage;

            logger.info("handlePageChange", {
                requested: nextPage,
                clamped,
                totalPages,
            });

            setPage(clamped);
        },
        [totalPages],
    );

    /**
     * handleNext
     * - Move to next page if exists.
     */
    const handleNext = useCallback(() => {
        if (!hasNext) return;
        handlePageChange(currentPage + 1);
    }, [hasNext, currentPage, handlePageChange]);

    /**
     * handlePrevious
     * - Move to previous page if exists.
     */
    const handlePrevious = useCallback(() => {
        if (!hasPrevious) return;
        handlePageChange(currentPage - 1);
    }, [hasPrevious, currentPage, handlePageChange]);

    /**
     * resetPagination
     * - Reset page and pageSize back to initial values.
     */
    const resetPagination = useCallback(() => {
        logger.info("resetPagination", {
            initialPage,
            initialPageSize,
        });
        setPage(initialPage);
        setPageSize(initialPageSize);
    }, [initialPage, initialPageSize]);

    return {
        // state
        page: currentPage,
        pageSize,

        // setters
        setPage: handlePageChange,
        setPageSize,

        // meta
        totalPages,
        hasPrevious,
        hasNext,
        itemStart,
        itemEnd,

        // handlers
        handlePageChange,
        handleNext,
        handlePrevious,
        resetPagination,
    };
};

export default useJobScreenPagination;