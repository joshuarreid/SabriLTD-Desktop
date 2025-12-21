/**
 * useJobScreenPagination.js
 *
 * Centralized pagination logic for the JobScreen.
 */

import { useCallback, useMemo, useState, useEffect } from "react";

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
 */
export const useJobScreenPagination = ({
                                           initialPage = 1,
                                           initialPageSize = 25,
                                           totalItems = null,
                                           totalPagesFromServer = null,
                                       } = {}) => {
    const [page, setPage] = useState(initialPage);
    const [pageSize, setPageSize] = useState(initialPageSize);

    // Log incoming props every render
    useEffect(() => {
        logger.info("props changed", {
            initialPage,
            initialPageSize,
            totalItems,
            totalPagesFromServer,
        });
    }, [initialPage, initialPageSize, totalItems, totalPagesFromServer]);

    const totalPages = useMemo(() => {
        const fromServer =
            typeof totalPagesFromServer === "number" && totalPagesFromServer > 0
                ? totalPagesFromServer
                : null;

        const fromItems =
            typeof totalItems === "number" && totalItems > 0
                ? Math.max(1, Math.ceil(totalItems / pageSize))
                : null;

        const value = fromServer ?? fromItems ?? 1;

        logger.info("compute totalPages", {
            totalPagesFromServer,
            totalItems,
            pageSize,
            chosen: value,
        });

        return value;
    }, [totalPagesFromServer, totalItems, pageSize]);

    const currentPage = useMemo(() => {
        let value = page;
        if (value < 1) value = 1;
        if (value > totalPages) value = totalPages;

        logger.info("compute currentPage", { raw: page, clamped: value, totalPages });

        return value;
    }, [page, totalPages]);

    const hasPrevious = currentPage > 1;
    const hasNext = currentPage < totalPages;

    const itemStart = useMemo(() => {
        if (!totalItems || totalItems === 0) return 0;
        const start = (currentPage - 1) * pageSize + 1;
        logger.info("compute itemStart", { totalItems, currentPage, pageSize, start });
        return start;
    }, [currentPage, pageSize, totalItems]);

    const itemEnd = useMemo(() => {
        if (!totalItems || totalItems === 0) return 0;
        const end = Math.min(currentPage * pageSize, totalItems);
        logger.info("compute itemEnd", { totalItems, currentPage, pageSize, end });
        return end;
    }, [currentPage, pageSize, totalItems]);

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

    const handleNext = useCallback(() => {
        logger.info("handleNext clicked", { hasNext, currentPage, totalPages });
        if (!hasNext) return;
        handlePageChange(currentPage + 1);
    }, [hasNext, currentPage, totalPages, handlePageChange]);

    const handlePrevious = useCallback(() => {
        logger.info("handlePrevious clicked", { hasPrevious, currentPage, totalPages });
        if (!hasPrevious) return;
        handlePageChange(currentPage - 1);
    }, [hasPrevious, currentPage, totalPages, handlePageChange]);

    const resetPagination = useCallback(() => {
        logger.info("resetPagination", {
            initialPage,
            initialPageSize,
        });
        setPage(initialPage);
        setPageSize(initialPageSize);
    }, [initialPage, initialPageSize]);

    useEffect(() => {
        logger.info("state snapshot", {
            page,
            pageSize,
            currentPage,
            totalPages,
            totalItems,
            itemStart,
            itemEnd,
        });
    }, [page, pageSize, currentPage, totalPages, totalItems, itemStart, itemEnd]);

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