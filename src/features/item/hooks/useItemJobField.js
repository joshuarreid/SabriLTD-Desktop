/**
 * useItemJobField.js
 *
 * Fetches jobs for item-job pill selection.
 * Returns recent jobs (sorted by dateAdded DESC) or search results, using Sabri Inventory Job API.
 * Handles all errors and status states per Bulletproof React conventions.
 * No prop drilling/context dependency. JSDoc and logger for traceability.
 *
 * @module useItemJobField
 * @param {Object} params
 * @param {string} params.search - The current search string
 * @returns {{
 *   jobs: Array<{jobId: number, name: string}>,
 *   loading: boolean,
 *   error: string
 * }}
 */

import { useQuery } from "@tanstack/react-query";
import { getAllJobs, searchJobs } from "../../../api/job/job.js";
import { jobKeys } from "../../../api/job/jobQueryKeys.js";

/**
 * logger for useItemJobField
 * @constant
 */
const logger = {
    info: (...args) => console.log("[useItemJobField]", ...args),
    error: (...args) => console.error("[useItemJobField]", ...args),
};

/**
 * Maps and sorts jobs for pill grid usage.
 * @param {Array<Object>} jobsArray
 * @returns {Array<{jobId: number, name: string}>}
 */
function processJobs(jobsArray) {
    if (!Array.isArray(jobsArray)) return [];
    // Sort by most recent (dateAdded DESC), null-safe
    return [...jobsArray]
        .sort((a, b) => {
            const bDate = b.dateAdded ? new Date(b.dateAdded) : 0;
            const aDate = a.dateAdded ? new Date(a.dateAdded) : 0;
            return bDate - aDate;
        })
        .map((job) => ({
            jobId: job.jobId,
            name: job.name
        }));
}

/**
 * useItemJobField
 * - Fetches recent jobs or searched jobs for item-job pill selector.
 * - Always returns array of up to 12 jobs, mapped & sorted.
 *
 * @param {Object} params
 * @param {string} params.search
 * @returns {{
 *   jobs: Array<{ jobId: number, name: string }>,
 *   loading: boolean,
 *   error: string,
 * }}
 */
export function useItemJobField({ search = "" } = {}) {
    // API config
    const DEFAULT_PAGE_SIZE = 12;
    const JOB_SORT_FIELD = "dateAdded";
    const JOB_SORT_ORDER = "desc";

    const getJobsParams = {
        page: 1,
        size: DEFAULT_PAGE_SIZE,
        sortField: JOB_SORT_FIELD,
        sortOrder: JOB_SORT_ORDER,
    };

    const searchParams = search.trim()
        ? {
            q: search.trim(),
            page: 1,
            size: DEFAULT_PAGE_SIZE,
            sortField: JOB_SORT_FIELD,
            sortOrder: JOB_SORT_ORDER,
        }
        : null;

    // Canonical query key shapes for react-query
    const queryKey = searchParams
        ? jobKeys.search(searchParams)
        : jobKeys.list(getJobsParams);

    /**
     * Query function: uses correct endpoint and, importantly,
     * extracts jobs from response.data (not the whole response).
     * Accepts both OK and success statuses.
     * Only throws for invalid status or non-array data, following useJobSearch.js conventions.
     */
    const queryFn = async () => {
        logger.info("useItemJobField queryFn", {
            isSearch: !!searchParams,
            params: searchParams || getJobsParams,
        });
        try {
            let resp;
            if (searchParams) {
                resp = await searchJobs(searchParams);
            } else {
                resp = await getAllJobs(getJobsParams);
            }
            logger.info("Job API response", resp);

            // Accept both "OK" and "success" status
            if (!(resp?.status === "OK" || resp?.status === "success")) {
                logger.error("Job API response was not OK/success", resp);
                throw new Error(resp?.errors?.[0]?.message || "Unexpected Job API status");
            }
            if (!Array.isArray(resp.data)) {
                logger.error("Job API returned non-array data", resp);
                throw new Error("Job API: missing or malformed jobs list");
            }
            // Return canonical jobs array for consistent mapping
            return resp.data;
        } catch (error) {
            logger.error("Job API call failed", error);
            throw error;
        }
    };

    // Fetch/caching logic via TanStack Query
    const {
        data: jobsRaw,
        isPending,
        isError,
        error,
    } = useQuery({
        queryKey,
        queryFn,
        staleTime: 1000 * 60 * 10, // 10min
        cacheTime: 1000 * 60 * 60, // 1hr
        refetchOnWindowFocus: false,
    });

    // Final pill jobs: mapped, sorted, up to 12
    const jobs = processJobs(jobsRaw || []).slice(0, DEFAULT_PAGE_SIZE);

    return {
        jobs,
        loading: isPending,
        error: isError ? error?.message || "Failed to load jobs" : "",
    };
}

export default useItemJobField;