/**
 * useJobSearch.js
 *
 * Encapsulates job API calls and base server-side pagination/sorting logic.
 *
 * Responsibilities:
 * - Fetch jobs from the Job API with page/pageSize.
 * - When globalSearchQuery is set, use searchJobs(q=...) instead of getAllJobs.
 * - Expose base jobs and metadata; all global re-queries with filters are
 *   orchestrated in useJobScreen.
 */

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
    getAllJobs,
    getJobCompanies,
    searchJobs,
} from "../../../api/job/job.js";
import { jobKeys } from "../../../api/job/jobQueryKeys.js";

const logger = {
    info: (...args) => console.log("[useJobSearch]", ...args),
    error: (...args) => console.error("[useJobSearch]", ...args),
};

/**
 * deriveApiSortParams
 * - Maps the local sortKey into API sortField/sortOrder for server calls.
 */
const deriveApiSortParams = (sortKey) => {
    if (!sortKey) return { sortField: null, sortOrder: "asc" };

    const [field, dirRaw] = String(sortKey).split("-");
    const sortOrder = dirRaw === "asc" ? "asc" : "desc";

    if (field === "date") {
        return { sortField: "dateAdded", sortOrder };
    }
    if (field === "modified") {
        return { sortField: "dateUpdated", sortOrder };
    }

    return { sortField: "name", sortOrder };
};

/**
 * useJobSearch
 *
 * @param {{
 *   page: number,
 *   pageSize: number,
 *   sortKey: string,
 *   globalSearchQuery?: string,
 * }} options
 */
export const useJobSearch = ({
                                 page,
                                 pageSize,
                                 sortKey,
                                 globalSearchQuery = "",
                             }) => {
    logger.info("useJobSearch initialized", {
        page,
        pageSize,
        sortKey,
        globalSearchQuery,
    });

    const trimmedQuery = globalSearchQuery.trim();
    const isGlobalSearchActive = trimmedQuery.length > 0;

    // --- Jobs list (base or global search) ---
    const {
        data: jobsResponse,
        isPending: isPendingJobs,
        isError: isErrorJobs,
        error: errorJobs,
    } = useQuery({
        queryKey: jobKeys.list({
            page,
            size: pageSize,
            sortKey,
            globalSearchQuery: trimmedQuery || null,
        }),
        queryFn: async () => {
            const { sortField, sortOrder } = deriveApiSortParams(sortKey);

            // Build base params shared by both endpoints
            const baseParams = {
                page,
                size: pageSize,
            };
            if (sortField) {
                baseParams.sortField = sortField;
                baseParams.sortOrder = sortOrder;
            }

            let response;
            if (isGlobalSearchActive) {
                const searchParams = {
                    ...baseParams,
                    q: trimmedQuery,
                };
                logger.info("useJobSearch using searchJobs (global)", {
                    searchParams,
                });
                response = await searchJobs(searchParams);
            } else {
                logger.info("useJobSearch using getAllJobs (base)", {
                    params: baseParams,
                });
                response = await getAllJobs(baseParams);
            }

            const jobsArray = Array.isArray(response?.data)
                ? response.data
                : [];
            logger.info("useJobSearch jobs queryFn success", {
                count: jobsArray.length,
                meta: response?.meta,
                isGlobalSearchActive,
            });
            return response;
        },
        keepPreviousData: true,
    });

    const jobs = useMemo(
        () => (Array.isArray(jobsResponse?.data) ? jobsResponse.data : []),
        [jobsResponse],
    );

    const serverMeta = jobsResponse?.meta || null;
    const totalJobs =
        typeof serverMeta?.totalRecords === "number"
            ? serverMeta.totalRecords
            : jobs.length;
    const totalPages =
        typeof serverMeta?.totalPages === "number"
            ? serverMeta.totalPages
            : 1;
    const currentPage = serverMeta?.page ?? page;

    // --- Companies list for dropdown ---
    const {
        data: uniqueCompanies = [],
        isError: isErrorCompanies,
        error: errorCompanies,
    } = useQuery({
        queryKey: jobKeys.companies(),
        queryFn: async () => {
            logger.info("useJobSearch uniqueCompanies queryFn called");
            const companies = await getJobCompanies();
            logger.info("useJobSearch uniqueCompanies queryFn success", {
                count: Array.isArray(companies) ? companies.length : 0,
            });
            return companies;
        },
    });

    const companyOptionsFromServer = useMemo(() => {
        if (!Array.isArray(uniqueCompanies) || uniqueCompanies.length === 0) {
            return [{ value: "all", label: "All Companies" }];
        }

        const sorted = [...uniqueCompanies].sort((a, b) =>
            String(a.companyName || "").localeCompare(
                String(b.companyName || ""),
            ),
        );

        return [
            { value: "all", label: "All Companies" },
            ...sorted.map((company) => ({
                value: String(company.companyId),
                label: company.companyName,
            })),
        ];
    }, [uniqueCompanies]);

    const isError = Boolean(isErrorJobs || isErrorCompanies);
    const error = errorJobs || errorCompanies;
    const isPending = isPendingJobs;

    return {
        // jobs + server meta
        jobs,
        totalJobs,
        totalPages,
        currentPage,
        serverMeta,

        // loading / error
        isPending,
        isError,
        error,

        // options
        companyOptionsFromServer,
    };
};

export default useJobSearch;