/**
 * useJobScreen.js
 *
 * Data-fetching and global filter/search orchestration for the JobScreen.
 */

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
    getAllJobs,
    getJobCompanies,
    getJobClients,
    searchJobs,
} from "../../../api/job/job";
import { jobKeys } from "../../../api/job/jobQueryKeys";
import {
    useJobFilterAndSearch,
    DEFAULT_SORT_KEY,
    DEFAULT_PAGE_SIZE,
} from "./useJobFilterAndSearch";

const logger = {
    info: (...args) => console.log("[useJobScreen]", ...args),
    error: (...args) => console.error("[useJobScreen]", ...args),
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
 * buildGlobalJobParams
 * - Helper that converts current filter/search/sort state into API params
 *   for getAllJobs or searchJobs.
 *
 * @function buildGlobalJobParams
 * @param {{
 *   companyFilter: string,
 *   statusFilter: string,
 *   clientFilter: string,
 *   page: number,
 *   pageSize: number,
 *   sortKey: string
 * }} state
 * @returns {Object} params object for job list/search APIs
 */
const buildGlobalJobParams = ({
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
 * useJobScreen
 * - Top-level hook for the JobScreen route with global vs local filter orchestration.
 *
 * @function useJobScreen
 * @returns {object}
 */
export const useJobScreen = () => {
    logger.info("useJobScreen initialized");

    const [baseJobs, setBaseJobs] = useState([]);
    const [hasGlobalFilters, setHasGlobalFilters] = useState(false);
    const [initialGlobalFilterSource, setInitialGlobalFilterSource] =
        useState("none");

    // --- Initial unfiltered jobs load ---
    const {
        data: initialJobsResponse,
        isPending: isPendingInitialJobs,
        isError: isErrorInitialJobs,
        error: errorInitialJobs,
    } = useQuery({
        queryKey: jobKeys.lists(),
        queryFn: async () => {
            logger.info("useJobScreen initial jobs queryFn called");
            const response = await getAllJobs();
            const jobsArray = Array.isArray(response?.data) ? response.data : [];
            logger.info("useJobScreen initial jobs queryFn success", {
                count: jobsArray.length,
            });
            return jobsArray;
        },
    });

    // --- Companies for dropdown ---
    const {
        data: uniqueCompanies = [],
        isError: isErrorCompanies,
        error: errorCompanies,
    } = useQuery({
        queryKey: jobKeys.companies(),
        queryFn: async () => {
            logger.info("useJobScreen uniqueCompanies queryFn called");
            const companies = await getJobCompanies();
            logger.info("useJobScreen uniqueCompanies queryFn success", {
                count: Array.isArray(companies) ? companies.length : 0,
            });
            return companies;
        },
    });

    // Keep baseJobs in sync with initial unfiltered load until a global filter is applied
    useEffect(() => {
        if (!hasGlobalFilters && Array.isArray(initialJobsResponse)) {
            logger.info("useJobScreen syncing baseJobs from initialJobsResponse", {
                count: initialJobsResponse.length,
            });
            setBaseJobs(initialJobsResponse);
        }
    }, [initialJobsResponse, hasGlobalFilters]);

    const jobs = useMemo(() => {
        const arr = Array.isArray(baseJobs) ? baseJobs : [];
        logger.info("useJobScreen using baseJobs as jobs source", {
            count: arr.length,
        });
        return arr;
    }, [baseJobs]);

    // Local client-side filter/search/sort/pagination
    const filterAndSearch = useJobFilterAndSearch(jobs, {
        initialSortKey: DEFAULT_SORT_KEY,
        initialPageSize: DEFAULT_PAGE_SIZE,
    });

    const {
        companyFilter,
        statusFilter,
        clientFilter,
        sortKey,
        page,
        pageSize,
    } = filterAndSearch;

    const isPending = isPendingInitialJobs;
    const isError = Boolean(isErrorInitialJobs || isErrorCompanies);
    const error = errorInitialJobs || errorCompanies;

    // --- Global filter helpers (unchanged from previous version) ---
    const applyGlobalCompanyStatusFilter = async () => {
        logger.info("useJobScreen applyGlobalCompanyStatusFilter called", {
            companyFilter,
            statusFilter,
            page,
            pageSize,
            sortKey,
        });

        const params = buildGlobalJobParams({
            companyFilter,
            statusFilter,
            clientFilter: "all",
            page,
            pageSize,
            sortKey,
        });

        try {
            const response = await getAllJobs(params);
            const jobsArray = Array.isArray(response?.data) ? response.data : [];
            logger.info(
                "useJobScreen applyGlobalCompanyStatusFilter success",
                {
                    count: jobsArray.length,
                    params,
                },
            );
            setBaseJobs(jobsArray);
            setHasGlobalFilters(true);

            if (companyFilter !== "all" && statusFilter !== "all") {
                setInitialGlobalFilterSource("company-status");
            } else if (companyFilter !== "all") {
                setInitialGlobalFilterSource("company");
            } else if (statusFilter !== "all") {
                setInitialGlobalFilterSource("status");
            }
        } catch (err) {
            logger.error(
                "useJobScreen applyGlobalCompanyStatusFilter failed",
                err,
            );
        }
    };

    const applyGlobalClientSearch = async (clientName) => {
        const trimmedClient = clientName?.trim();
        if (!trimmedClient) return;

        logger.info("useJobScreen applyGlobalClientSearch called", {
            clientName: trimmedClient,
            page,
            pageSize,
            sortKey,
        });

        const { sortField, sortOrder } = deriveApiSortParams(sortKey);

        const params = {
            q: trimmedClient,
            page,
            size: pageSize,
        };
        if (sortField) {
            params.sortField = sortField;
            params.sortOrder = sortOrder;
        }

        try {
            const response = await searchJobs(params);
            const jobsArray = Array.isArray(response?.data) ? response.data : [];
            logger.info("useJobScreen applyGlobalClientSearch success", {
                count: jobsArray.length,
                params,
            });
            setBaseJobs(jobsArray);
            setHasGlobalFilters(true);
            setInitialGlobalFilterSource("client");
        } catch (err) {
            logger.error("useJobScreen applyGlobalClientSearch failed", err);
        }
    };

    // Global behavior for company + status initial / edge cases
    useEffect(() => {
        const isCompanyActive = companyFilter !== "all";
        const isStatusActive = statusFilter !== "all";

        if (!isCompanyActive && !isStatusActive) {
            return;
        }

        if (!hasGlobalFilters) {
            logger.info(
                "useJobScreen initial global company/status filter detected",
                {
                    companyFilter,
                    statusFilter,
                },
            );
            applyGlobalCompanyStatusFilter();
            return;
        }

        const fromCompany =
            initialGlobalFilterSource === "company" && isStatusActive;
        const fromStatus =
            initialGlobalFilterSource === "status" && isCompanyActive;

        if (fromCompany || fromStatus) {
            logger.info(
                "useJobScreen edge global requery (company+status) triggered",
                {
                    initialGlobalFilterSource,
                    companyFilter,
                    statusFilter,
                },
            );
            applyGlobalCompanyStatusFilter();
        }
    }, [
        companyFilter,
        statusFilter,
        hasGlobalFilters,
        initialGlobalFilterSource,
    ]);

    // Global behavior for initial client filter
    useEffect(() => {
        if (hasGlobalFilters) return;
        if (clientFilter === "all") return;

        logger.info("useJobScreen initial global client filter detected", {
            clientFilter,
        });
        applyGlobalClientSearch(clientFilter);
    }, [clientFilter, hasGlobalFilters]);

    // Scoped clients when company filter + global filters are active
    const {
        data: scopedClients = [],
        isError: isErrorScopedClients,
        error: errorScopedClients,
    } = useQuery({
        queryKey: jobKeys.clientsList(
            companyFilter !== "all" && hasGlobalFilters
                ? { companyId: Number(companyFilter) }
                : {},
        ),
        queryFn: async () => {
            if (companyFilter === "all" || !hasGlobalFilters) {
                logger.info(
                    "useJobScreen scoped clients queryFn skipped (no company/global)",
                    {
                        companyFilter,
                        hasGlobalFilters,
                    },
                );
                return [];
            }

            const companyId = Number(companyFilter);
            logger.info("useJobScreen scoped clients queryFn called", {
                companyId,
            });

            const clients = await getJobClients({ companyId });

            logger.info("useJobScreen scoped clients queryFn success", {
                count: Array.isArray(clients) ? clients.length : 0,
                companyId,
            });

            return clients;
        },
        enabled: companyFilter !== "all" && hasGlobalFilters,
    });

    if (isErrorScopedClients) {
        logger.error(
            "useJobScreen scoped clients query encountered an error",
            errorScopedClients,
        );
    }

    const companyOptions = useMemo(() => {
        if (!Array.isArray(uniqueCompanies) || uniqueCompanies.length === 0) {
            return [{ value: "all", label: "All Companies" }];
        }

        const sorted = [...uniqueCompanies].sort((a, b) =>
            String(a.companyName || "").localeCompare(String(b.companyName || "")),
        );

        return [
            { value: "all", label: "All Companies" },
            ...sorted.map((company) => ({
                value: String(company.companyId),
                label: company.companyName,
            })),
        ];
    }, [uniqueCompanies]);

    const clientOptions = useMemo(() => {
        if (
            hasGlobalFilters &&
            companyFilter !== "all" &&
            Array.isArray(scopedClients) &&
            scopedClients.length > 0
        ) {
            const sorted = [...scopedClients].sort((a, b) =>
                String(a.clientName || "").localeCompare(
                    String(b.clientName || ""),
                ),
            );

            const options = [
                { value: "all", label: "All" },
                ...sorted.map((client) => ({
                    value: client.clientName,
                    label: client.clientName,
                })),
            ];

            logger.info(
                "useJobScreen clientOptions using scopedClients from API",
                {
                    companyFilter,
                    count: options.length,
                },
            );
            return options;
        }

        logger.info(
            "useJobScreen clientOptions using local clientOptions from filter hook",
            {
                count: filterAndSearch.clientOptions.length,
            },
        );
        return filterAndSearch.clientOptions;
    }, [
        hasGlobalFilters,
        companyFilter,
        scopedClients,
        filterAndSearch.clientOptions,
    ]);

    /**
     * handleResetAll
     * - Resets global + local filter state and restores baseJobs to initial list.
     *
     * @function handleResetAll
     * @returns {void}
     */
    const handleResetAll = () => {
        logger.info("useJobScreen handleResetAll called");

        // Reset local filter/search/sort/page state
        filterAndSearch.handleResetFilters();

        // Reset global flags so next filter interaction can trigger
        // a fresh global query again.
        setHasGlobalFilters(false);
        setInitialGlobalFilterSource("none");

        // Restore baseJobs to the initial unfiltered jobs set
        if (Array.isArray(initialJobsResponse)) {
            logger.info("useJobScreen handleResetAll restoring baseJobs", {
                count: initialJobsResponse.length,
            });
            setBaseJobs(initialJobsResponse);
        } else {
            setBaseJobs([]);
        }
    };

    return {
        jobs: filterAndSearch.jobs,

        isPending,
        isError,
        error,

        search: filterAndSearch.search,
        searchInput: filterAndSearch.searchInput,
        sortKey: filterAndSearch.sortKey,
        companyFilter: filterAndSearch.companyFilter,
        clientFilter: filterAndSearch.clientFilter,
        statusFilter: filterAndSearch.statusFilter,
        page: filterAndSearch.page,
        pageSize: filterAndSearch.pageSize,

        setSearch: filterAndSearch.setSearch,
        setSearchInput: filterAndSearch.setSearchInput,
        setSortKey: filterAndSearch.setSortKey,
        setCompanyFilter: filterAndSearch.setCompanyFilter,
        setClientFilter: filterAndSearch.setClientFilter,
        setStatusFilter: filterAndSearch.setStatusFilter,
        setPage: filterAndSearch.setPage,
        setPageSize: filterAndSearch.setPageSize,

        // Use the new reset (global + local)
        handleResetFilters: handleResetAll,

        sortOptionsForDropdown: filterAndSearch.sortOptionsForDropdown,
        companyOptions,
        clientOptions,
        statusOptions: filterAndSearch.statusOptions,

        filteredAndSortedJobs: filterAndSearch.filteredAndSortedJobs,
        paginatedJobs: filterAndSearch.paginatedJobs,

        totalJobs: filterAndSearch.totalJobs,
        totalPages: filterAndSearch.totalPages,
        currentPage: filterAndSearch.currentPage,
    };
};

export default useJobScreen;