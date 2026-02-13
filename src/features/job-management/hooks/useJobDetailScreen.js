import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { getJobById } from "../../../api/job/job";
import { searchItems } from "../../../api/item/item";
import { jobKeys } from "../../../api/job/jobQueryKeys";
import { itemKeys } from "../../../api/item/ItemQueryKeys";

/**
 * Logger for useJobDetailScreen.
 * @constant
 */
const logger = {
    info: (...args) => console.log("[useJobDetailScreen]", ...args),
    error: (...args) => console.error("[useJobDetailScreen]", ...args),
};

/**
 * Fetches items filtered by jobId using Meilisearch filterable attributes.
 * @async
 * @function fetchItemsForJob
 * @param {number|string} jobId - The jobId to filter items by.
 * @param {number} page - 1-based page number (default 1).
 * @param {number} pageSize - Results per page.
 * @param {string} [condition] - Optional condition name (filter for item condition).
 * @returns {Promise<{items: Array, total: number, meta: object, raw: object}>}
 * @throws {Error} If the request fails or search API responds with unexpected status.
 */
const fetchItemsForJob = async (jobId, page, pageSize, condition) => {
    logger.info("fetchItemsForJob called", { jobId, page, pageSize, condition });

    if (!jobId) throw new Error("jobId is required to search items for this job");

    // Build robust, Meilisearch-compatible filter string
    let filters = `jobs.jobId = ${jobId}`;
    if (condition) {
        // Escape single quotes in case a condition name is complex
        const cond = condition.replace(/'/g, "\\'");
        filters += ` AND condition = '${cond}'`;
    }

    const params = {
        filters,
        page,
        size: pageSize,
    };

    const response = await searchItems(params);

    // Accept both "OK" and "success" as valid status
    if (
        response?.status !== "OK" &&
        response?.status !== "success" &&
        response?.status !== 200
    ) {
        logger.error("[useJobDetailScreen] fetchItemsForJob error response", response);
        throw new Error(
            response?.errors && response.errors.length
                ? response.errors.map(e => e.message).join(", ")
                : "Failed to fetch items for job"
        );
    }

    return {
        items: response?.data?.hits ?? [],
        total: response?.data?.totalHits ?? 0,
        meta: response?.data ?? {},
        raw: response,
    };
};

/**
 * useJobDetailScreen
 * - Fetches job details by id and lists items related to that job using Meilisearch filterable attributes.
 *
 * @param {object} params
 * @param {string|number|null} params.jobId - The job to show details for.
 * @param {string} [params.condition] - Optional condition filter.
 * @returns {object} Result state for JobDetailScreen UI.
 */
const useJobDetailScreen = ({ jobId, condition }) => {
    /**
     * @type {[number, Function]}
     */
    const [page, setPage] = useState(1);
    /**
     * @type {[number, Function]}
     */
    const [pageSize, setPageSize] = useState(20);

    // Fetch job details
    const {
        data: job,
        isPending: isJobPending,
        isError: isJobError,
        error: jobError,
        refetch: refetchJob,
    } = useQuery({
        queryKey: jobKeys.detail(jobId),
        queryFn: () => getJobById(jobId),
        enabled: !!jobId,
        retry: false,
    });

    // Fetch items filtered by jobId (and optionally condition)
    const {
        data: itemSearchResult,
        isPending: isPending,
        isError: isError,
        error,
        refetch,
    } = useQuery({
        queryKey: itemKeys.search({ byJobId: jobId, page, pageSize, condition }),
        queryFn: () => fetchItemsForJob(jobId, page, pageSize, condition),
        enabled: !!jobId,
        keepPreviousData: true,
        retry: false,
    });

    const items = itemSearchResult?.items ?? [];
    const totalItems = itemSearchResult?.total ?? 0;
    const totalPages = Math.ceil(totalItems / pageSize) || 1;
    const hasPrevious = page > 1;
    const hasNext = page < totalPages;
    const itemStart = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
    const itemEnd = Math.min(page * pageSize, totalItems);

    /**
     * Go to next page of items.
     * @function
     */
    const handleNext = useCallback(() => {
        if (page < totalPages) setPage((p) => p + 1);
    }, [page, totalPages]);

    /**
     * Go to previous page of items.
     * @function
     */
    const handlePrevious = useCallback(() => {
        if (page > 1) setPage((p) => p - 1);
    }, [page]);

    logger.info("useJobDetailScreen state", {
        jobId,
        condition,
        job,
        itemsCount: items.length,
        totalItems,
        page,
        pageSize,
        totalPages,
        hasPrevious,
        hasNext,
    });

    return {
        job,
        isJobPending,
        isJobError,
        jobError,
        refetchJob,
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
    };
};

export default useJobDetailScreen;