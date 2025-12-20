/**
 * useJobSearch.js
 *
 * Encapsulates all job API calls and server-side pagination/sorting logic.
 *
 * Responsibilities:
 * - Fetch jobs from the Job API (getAllJobs / searchJobs) with page/pageSize.
 * - Map local sortKey into API sortField/sortOrder.
 * - Apply server-side company/status/client filters.
 * - Optionally fetch company & client metadata for dropdowns.
 */

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
    getAllJobs,
    getJobCompanies,
    getJobClients,
    searchJobs,
} from "../../../api/job/job";
import { jobKeys } from "../../../api/job/jobQueryKeys";

const logger = {
    info: (...args) => console.log("[useJobSearch]", ...args),
    error: (...args) => console.error("[useJobSearch]", ...args),
};

/**
 * deriveApiSortParams
 * - Maps the local sortKey into API sortField/sortOrder for server calls.
 *
 * @function deriveApiSortParams
 * @param {string} sortKey
 * @returns {{ sortField: string|null, sortOrder: 'asc'|'desc' }}
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
 * buildJobParams
 * - Helper that converts current filter/search/sort state into API params.
 *
 * @function buildJobParams
 */
const buildJobParams = ({
                            companyFilter,
                            statusFilter,
                            clientFilter,
                            page,
                            pageSize,
                            sortKey,
                        }) => {
    const { sortField, sortOrder } = deriveApiSortParams(sortKey);

    const params = {
        page,
        size: pageSize,
    };

    if (sortField) {
        params.sortField = sortField;
        params.sortOrder = sortOrder;
    }

    if (companyFilter !== "all") {
        params.companyId = Number(companyFilter);
    }

    if (statusFilter !== "all") {
        params.status = statusFilter;
    }

    if (clientFilter !== "all") {
        params.client = clientFilter;
    }

    return params;
};

/**
 * useJobSearch
 * - Primary server-side data hook for the JobScreen.
 *
 * @param {{
 *   companyFilter: string,
 *   statusFilter: string,
 *   clientFilter: string,
 *   sortKey: string,
 *   page: number,
 *   pageSize: number,
 *   clientSearchMode?: boolean, // optional: if true, use searchJobs(q=clientFilter)
 * }} options
 */
export const useJobSearch = ({
                                 companyFilter,
                                 statusFilter,
                                 clientFilter,
                                 sortKey,
                                 page,
                                 pageSize,
                                 clientSearchMode = false,
                             }) => {
    logger.info("useJobSearch initialized", {
        companyFilter,
        statusFilter,
        clientFilter,
        sortKey,
        page,
        pageSize,
        clientSearchMode,
    });

    // --- Jobs list (server-side pagination) ---
    const {
        data: jobsResponse,
        isPending: isPendingJobs,
        isError: isErrorJobs,
        error: errorJobs,
    } = useQuery({
        queryKey: jobKeys.list({
            page,
            size: pageSize,
            companyFilter,
            statusFilter,
            clientFilter: clientSearchMode ? "all" : clientFilter,
            sortKey,
            clientSearchMode,
        }),
        queryFn: async () => {
            const params = buildJobParams({
                companyFilter,
                statusFilter,
                clientFilter: clientSearchMode ? "all" : clientFilter,
                page,
                pageSize,
                sortKey,
            });

            logger.info("useJobSearch jobs queryFn called", {
                clientSearchMode,
                params,
            });

            let response;
            if (clientSearchMode && clientFilter !== "all") {
                // Global client search mode uses searchJobs with q
                const trimmedClient = clientFilter.trim();
                const { sortField, sortOrder } = deriveApiSortParams(sortKey);

                const searchParams = {
                    q: trimmedClient,
                    page,
                    size: pageSize,
                };
                if (sortField) {
                    searchParams.sortField = sortField;
                    searchParams.sortOrder = sortOrder;
                }

                logger.info("useJobSearch using searchJobs", { searchParams });
                response = await searchJobs(searchParams);
            } else {
                logger.info("useJobSearch using getAllJobs", { params });
                response = await getAllJobs(params);
            }

            const jobsArray = Array.isArray(response?.data)
                ? response.data
                : [];
            logger.info("useJobSearch jobs queryFn success", {
                count: jobsArray.length,
                meta: response?.meta,
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

    // --- Scoped clients list (optional) ---
    const {
        data: scopedClients = [],
        isError: isErrorScopedClients,
        error: errorScopedClients,
    } = useQuery({
        queryKey: jobKeys.clientsList(
            companyFilter !== "all" ? { companyId: Number(companyFilter) } : {},
        ),
        queryFn: async () => {
            if (companyFilter === "all") {
                logger.info(
                    "useJobSearch scoped clients queryFn skipped (no company)",
                    {
                        companyFilter,
                    },
                );
                return [];
            }

            const companyId = Number(companyFilter);
            logger.info("useJobSearch scoped clients queryFn called", {
                companyId,
            });

            const clients = await getJobClients({ companyId });

            logger.info("useJobSearch scoped clients queryFn success", {
                count: Array.isArray(clients) ? clients.length : 0,
                companyId,
            });

            return clients;
        },
        enabled: companyFilter !== "all",
    });

    if (isErrorScopedClients) {
        logger.error(
            "useJobSearch scoped clients query encountered an error",
            errorScopedClients,
        );
    }

    const clientOptionsFromServer = useMemo(() => {
        if (!Array.isArray(scopedClients) || scopedClients.length === 0) {
            return null;
        }

        const sorted = [...scopedClients].sort((a, b) =>
            String(a.clientName || "").localeCompare(
                String(b.clientName || ""),
            ),
        );

        return [
            { value: "all", label: "All" },
            ...sorted.map((client) => ({
                value: client.clientName,
                label: client.clientName,
            })),
        ];
    }, [scopedClients]);

    const isError = Boolean(
        isErrorJobs || isErrorCompanies || isErrorScopedClients,
    );
    const error = errorJobs || errorCompanies || errorScopedClients;
    const isPending = isPendingJobs;

    return {
        // jobs + server meta
        jobs,
        totalJobs,
        totalPages,
        currentPage,

        // loading / error
        isPending,
        isError,
        error,

        // server-driven options
        companyOptionsFromServer,
        clientOptionsFromServer,

        // raw response/meta if needed
        jobsResponse,
        serverMeta,
    };
};

export default useJobSearch;