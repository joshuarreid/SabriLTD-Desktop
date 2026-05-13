/**
 * useItemSearchPagination.js
 *
 * Centralized pagination logic for ItemBrowser (Meilisearch-backed).
 * Mirrors the proven behavior of useJobScreenPagination, but is purpose-built
 * for Item Search API responses:
 *  - ItemSearchResponse: { hitsCount, totalHits, page, size }
 *
 * Key goals:
 * - Treat server totals as source of truth when present
 * - Clamp page safely within [1, totalPages]
 * - Provide consistent pager metadata (hasNext/hasPrevious/itemStart/itemEnd)
 * - Keep logic pure/testable and colocated in hooks/ (Bulletproof React)
 */

import { useCallback, useEffect, useMemo, useState } from "react";

type PreferPageSource = "server" | "requested";

export interface UseItemSearchPaginationOptions {
    initialPage?: number;
    initialPageSize?: number;
    totalHits?: number | null;
    serverPage?: number | null;
    serverSize?: number | null;
    preferPageSource?: PreferPageSource;
}

export interface UseItemSearchPaginationReturn {
    page: number;
    pageSize: number;

    requestedPage: number;
    setRequestedPage: (page: number) => void;

    // Backwards-compatible aliases used across UI
    setPage: (page: number) => void;
    setPageSize: (size: number) => void;

    totalPages: number;
    totalItems: number;
    hasPrevious: boolean;
    hasNext: boolean;
    itemStart: number;
    itemEnd: number;

    handleNext: () => void;
    handlePrevious: () => void;
    resetPagination: () => void;
}

/**
 * logger for useItemSearchPagination.
 *
 * @constant
 * @type {{info: Function, error: Function}}
 */
const logger = {
    info: (...args) => console.log("[useItemSearchPagination]", ...args),
    error: (...args) => console.error("[useItemSearchPagination]", ...args),
};

/**
 * computeTotalPages
 * Computes total pages using server totals and page size.
 *
 * @function computeTotalPages
 * @param {number|null} totalHits - Total hits from server.
 * @param {number} pageSize - Page size (results per page).
 * @returns {number} Total pages (min 1).
 */
const computeTotalPages = (totalHits: number | null, pageSize: number): number => {
    if (typeof totalHits !== "number" || totalHits <= 0) return 1;
    if (typeof pageSize !== "number" || pageSize <= 0) return 1;
    return Math.max(1, Math.ceil(totalHits / pageSize));
};

/**
 * clampPage
 * Clamps a page number into the valid range.
 *
 * @function clampPage
 * @param {number} page
 * @param {number} totalPages
 * @returns {number}
 */
const clampPage = (page: number, totalPages: number): number => {
    const safeTotalPages =
        typeof totalPages === "number" && totalPages > 0 ? totalPages : 1;

    let value = typeof page === "number" && !Number.isNaN(page) ? page : 1;
    if (value < 1) value = 1;
    if (value > safeTotalPages) value = safeTotalPages;
    return value;
};

/**
 * useItemSearchPagination
 *
 * Notes:
 * - Keep "requestedPage" separate from "serverPage" so callers can show
 *   accurate UI even if server clamps or corrects page.
 * - By default, we display the server page when it is present.
 *
 * @function useItemSearchPagination
 * @param {object} [options]
 * @param {number} [options.initialPage=1] - Initial requested page.
 * @param {number} [options.initialPageSize=25] - Initial page size.
 * @param {number|null} [options.totalHits=null] - Total hits from server.
 * @param {number|null} [options.serverPage=null] - Page echoed by server response (1-based).
 * @param {number|null} [options.serverSize=null] - Size echoed by server response.
 * @param {"server"|"requested"} [options.preferPageSource="server"] - Which page number to expose as `page`.
 * @returns {{
 *   page: number,
 *   pageSize: number,
 *   requestedPage: number,s
 *   setRequestedPage: Function,
 *   setPageSize: Function,
 *   totalPages: number,
 *   totalItems: number,
 *   hasPrevious: boolean,
 *   hasNext: boolean,
 *   itemStart: number,
 *   itemEnd: number,
 *   handleNext: Function,
 *   handlePrevious: Function,
 *   resetPagination: Function,
 * }}
 */
export const useItemSearchPagination = ({
    initialPage = 1,
    initialPageSize = 25,
    totalHits = null,
    serverPage = null,
    serverSize = null,
    preferPageSource = "server",
}: UseItemSearchPaginationOptions = {}): UseItemSearchPaginationReturn => {
    const [requestedPage, setRequestedPage] = useState<number>(initialPage);
    const [pageSize, setPageSize] = useState<number>(initialPageSize);

    const totalPages = useMemo(() => {
        const effectiveSize =
            typeof serverSize === "number" && serverSize > 0 ? serverSize : pageSize;

        const value = computeTotalPages(
            typeof totalHits === "number" ? totalHits : null,
            effectiveSize,
        );

        logger.info("compute totalPages", {
            totalHits,
            pageSize,
            serverSize,
            chosen: value,
        });

        return value;
    }, [totalHits, pageSize, serverSize]);

    const effectiveRequestedPage = useMemo(() => {
        const value = clampPage(requestedPage, totalPages);
        logger.info("compute effectiveRequestedPage", {
            requestedPage,
            clamped: value,
            totalPages,
        });
        return value;
    }, [requestedPage, totalPages]);

    const effectiveServerPage = useMemo(() => {
        if (typeof serverPage !== "number" || serverPage <= 0) return null;
        const value = clampPage(serverPage, totalPages);
        logger.info("compute effectiveServerPage", {
            serverPage,
            clamped: value,
            totalPages,
        });
        return value;
    }, [serverPage, totalPages]);

    const page = useMemo(() => {
        const useServer =
            preferPageSource === "server" && effectiveServerPage != null;

        const value = useServer ? effectiveServerPage : effectiveRequestedPage;

        logger.info("compute page", {
            preferPageSource,
            effectiveServerPage,
            effectiveRequestedPage,
            chosen: value,
        });

        return value;
    }, [preferPageSource, effectiveServerPage, effectiveRequestedPage]);

    const totalItems = useMemo(() => {
        const value = typeof totalHits === "number" && totalHits >= 0 ? totalHits : 0;
        logger.info("compute totalItems", { totalHits, chosen: value });
        return value;
    }, [totalHits]);

    const hasPrevious = page > 1;
    const hasNext = page < totalPages;

    const itemStart = useMemo(() => {
        if (!totalItems || totalItems === 0) return 0;
        const start = (page - 1) * pageSize + 1;
        logger.info("compute itemStart", { totalItems, page, pageSize, start });
        return start;
    }, [page, pageSize, totalItems]);

    const itemEnd = useMemo(() => {
        if (!totalItems || totalItems === 0) return 0;
        const end = Math.min(page * pageSize, totalItems);
        logger.info("compute itemEnd", { totalItems, page, pageSize, end });
        return end;
    }, [page, pageSize, totalItems]);

    const handlePageChange = useCallback(
        (nextPage: number) => {
            if (typeof nextPage !== "number" || Number.isNaN(nextPage)) return;

            const clamped = clampPage(nextPage, totalPages);

            logger.info("handlePageChange", {
                requested: nextPage,
                clamped,
                totalPages,
            });

            setRequestedPage(clamped);
        },
        [totalPages],
    );

    const handleNext = useCallback(() => {
        logger.info("handleNext clicked", { hasNext, page, totalPages });
        if (!hasNext) return;
        handlePageChange(page + 1);
    }, [hasNext, page, totalPages, handlePageChange]);

    const handlePrevious = useCallback(() => {
        logger.info("handlePrevious clicked", { hasPrevious, page, totalPages });
        if (!hasPrevious) return;
        handlePageChange(page - 1);
    }, [hasPrevious, page, totalPages, handlePageChange]);

    const resetPagination = useCallback(() => {
        logger.info("resetPagination", { initialPage, initialPageSize });
        setRequestedPage(initialPage);
        setPageSize(initialPageSize);
    }, [initialPage, initialPageSize]);

    useEffect(() => {
        const clamped = clampPage(requestedPage, totalPages);
        if (clamped !== requestedPage) {
            logger.info("requestedPage clamped after totalPages change", {
                requestedPage,
                clamped,
                totalPages,
            });
            setRequestedPage(clamped);
        }
    }, [requestedPage, totalPages]);

    useEffect(() => {
        logger.info("state snapshot", {
            requestedPage,
            page,
            pageSize,
            serverPage,
            serverSize,
            totalItems,
            totalPages,
            itemStart,
            itemEnd,
            hasPrevious,
            hasNext,
        });
    }, [
        requestedPage,
        page,
        pageSize,
        serverPage,
        serverSize,
        totalItems,
        totalPages,
        itemStart,
        itemEnd,
        hasPrevious,
        hasNext,
    ]);

    return {
        page,
        pageSize,

        requestedPage,
        setRequestedPage: handlePageChange,

        setPage: handlePageChange,
        setPageSize,

        totalPages,
        totalItems,
        hasPrevious,
        hasNext,
        itemStart,
        itemEnd,

        handleNext,
        handlePrevious,
        resetPagination,
    };
};

export default useItemSearchPagination;

