import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { getJobById } from "../../../api/job/job";
import { searchItems } from "../../../api/item/item";
import { getCompanyById } from "../../../api/company/company";
import { getUserById } from "../../../api/user/user";
import { jobKeys } from "../../../api/job/jobQueryKeys";
import { itemKeys } from "../../../api/item/ItemQueryKeys";
import { companyKeys } from "../../../api/company/companyQueryKeys";
import { userKeys } from "../../../api/user/userQueryKeys";

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

    let filters = `jobs.jobId = ${jobId}`;
    if (condition) {
        const cond = condition.replace(/'/g, "\\'");
        filters += ` AND condition = '${cond}'`;
    }

    const params = {
        filters,
        page,
        size: pageSize,
    };

    const response = await searchItems(params);

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
 * Fetches job details by id, company name for companyId (with canonical queryKey),
 * user name for updatedBy (with canonical queryKey), and items for job.
 *
 * @param {object} params
 * @param {string|number|null} params.jobId - The job to show details for.
 * @param {string} [params.condition] - Optional condition filter.
 * @returns {object} Result state for JobDetailScreen UI (companyName/userName loading and error states).
 */
const useJobDetailScreen = ({ jobId, condition }) => {
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);

    // Fetch job details using a canonical query key
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

    // Fetch company using canonical query key
    const {
        data: companyData,
        isPending: isCompanyPending,
        isError: isCompanyError,
        error: companyErrorObj,
    } = useQuery({
        queryKey: job && job.companyId ? companyKeys.detail(job.companyId) : ["company", "none"],
        queryFn: () => job && job.companyId ? getCompanyById(job.companyId) : Promise.resolve(undefined),
        enabled: !!(job && job.companyId),
        retry: false,
    });

    /**
     * Canonical company name logic for field display.
     */
    let companyName = "-";
    let companyError = null;
    let companyLoading = false;
    if (job && job.companyId) {
        if (isCompanyPending) {
            companyLoading = true;
            companyName = "Loading...";
        } else if (isCompanyError) {
            companyError = "Could not load company";
            companyName = "-";
        } else if (companyData && companyData.name) {
            companyName = companyData.name;
        }
    } else if (job && !job.companyId) {
        companyName = "-";
    }

    // Fetch user for updatedBy using canonical query key
    const {
        data: userData,
        isPending: isUserPending,
        isError: isUserError,
        error: userErrorObj,
    } = useQuery({
        queryKey: job && job.updatedBy ? userKeys.detail(job.updatedBy) : ["user", "none"],
        queryFn: () => job && job.updatedBy ? getUserById(job.updatedBy) : Promise.resolve(undefined),
        enabled: !!(job && job.updatedBy),
        retry: false,
    });

    /**
     * Canonical user name logic for field display.
     */
    let userName = "-";
    let userError = null;
    let userLoading = false;
    if (job && job.updatedBy) {
        if (isUserPending) {
            userLoading = true;
            userName = "Loading...";
        } else if (isUserError) {
            userError = "Could not load user";
            userName = "-";
        } else if (userData && userData.name) {
            userName = userData.name;
        }
    } else if (job && !job.updatedBy) {
        userName = "-";
    }

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
        companyName,
        companyLoading,
        companyError,
        userName,
        userLoading,
        userError,
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
        companyName,
        companyLoading,
        companyError,
        userName,
        userLoading,
        userError,
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