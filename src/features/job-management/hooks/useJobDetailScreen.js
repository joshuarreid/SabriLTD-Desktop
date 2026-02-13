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
 * fetchItemsForJob
 * Calls searchItems with job.name as query.
 *
 * @async
 * @function fetchItemsForJob
 * @param {string} jobName - The job name used as the search query.
 * @param {number} page - 1-based page number (default 1).
 * @param {number} pageSize - Results per page.
 * @returns {Promise<{items: Array, total: number, meta: object, raw: object}>}
 * @throws {Error} If request or response is invalid.
 */
const fetchItemsForJob = async (jobName, page, pageSize) => {
    logger.info("fetchItemsForJob called", { jobName, page, pageSize });

    if (!jobName) throw new Error("jobName is required to search items for this job");

    const params = {
        query: jobName,
        page,
        size: pageSize,
    };

    const response = await searchItems(params);
    // Accept both success/OK/200 as valid
    if (
        response?.status !== "OK" &&
        response?.status !== "success" &&
        response?.status !== 200
    ) {
        logger.error("fetchItemsForJob error response", response);
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
 * Fetches a job by id, then item search by job name.
 *
 * @param {object} params
 * @param {string|number|null} params.jobId
 * @returns {object}
 */
const useJobDetailScreen = ({ jobId }) => {
    /**
     * @type {[number, Function]}
     */
    const [page, setPage] = useState(1);
    /**
     * @type {[number, Function]}
     */
    const [pageSize, setPageSize] = useState(20);

    // Fetch job details by id (for name)
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

    // Fetch items using the job name as the Meilisearch query
    const {
        data: itemSearchResult,
        isPending: isPending,
        isError: isError,
        error,
        refetch,
    } = useQuery({
        queryKey: itemKeys.search({ jobName: job?.name, page, pageSize }),
        queryFn: () => fetchItemsForJob(job?.name, page, pageSize),
        enabled: !!job?.name,
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
     */
    const handleNext = useCallback(() => {
        if (page < totalPages) setPage(p => p + 1);
    }, [page, totalPages]);

    /**
     * Go to previous page of items.
     */
    const handlePrevious = useCallback(() => {
        if (page > 1) setPage(p => p - 1);
    }, [page]);

    logger.info("useJobDetailScreen state", {
        jobId,
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