/**
 * useJobScreen.js
 *
 * Data-fetching and global filter/search orchestration for the JobScreen.
 *
 * Responsibilities:
 * - Load the base jobs collection from the Job API (getAllJobs / searchJobs).
 * - Load the unique companies list (GET /api/jobs/companies) for the Company dropdown.
 * - Load the unique clients list (GET /api/jobs/clients), optionally scoped by companyId.
 * - Decide when filters are global vs local, per JobScreen product rules.
 * - Delegate all local filter/search/sort/pagination behavior to useJobFilterAndSearch.
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

/**
 * logger for useJobScreen hook.
 *
 * @constant
 * @type {{info: Function, error: Function}}
 */
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
 * Global rules:
 * - If the initial filter is Company -> call getAllJobs({ companyId })
 * - If the initial filter is Status  -> call getAllJobs({ status })
 * - If the initial filter is Client -> call searchJobs({ q: clientName })
 * - After the initial global filter is applied, remaining dropdowns become local
 *   (filter the in-memory job list only), except:
 *   - Edge: if initial is company and then status is added (or vice versa),
 *     do another global getAllJobs with both params.
 *   - Edge: when company filter is active after a global search, the Client
 *     dropdown uses GET /api/jobs/clients?companyId=... to populate options.
 *   - Edge: if Client was the initial global filter and is then cleared via
 *     the dropdown Clear button, perform a full global reset back to the
 *     initial unfiltered jobs collection.
 *
 * @function useJobScreen
 * @returns {object} Aggregated JobScreen state, options, and derived lists.
 */
export const useJobScreen = () => {
    logger.info("useJobScreen initialized");

    /**
     * baseJobs
     * - Local copy of jobs that reflect the latest "global" query results.
     *   Once any global filter is applied, baseJobs is overwritten by the
     *   results of that global call and then used for all local filtering.
     *
     * @type {[Array, Function]}
     */
    const [baseJobs, setBaseJobs] = useState([]);

    /**
     * hasGlobalFilters
     * - Tracks whether any global filter (company/status/client) has been
     *   applied yet. Before this is true, filters may trigger global refetches.
     *   After it becomes true, filters are local-only (except the company+status
     *   edge case).
     *
     * @type {[boolean, Function]}
     */
    const [hasGlobalFilters, setHasGlobalFilters] = useState(false);

    /**
     * initialGlobalFilterSource
     * - Records which dimension first triggered a global filter:
     *   'none' | 'company' | 'status' | 'client' | 'company-status'
     *
     * @type {[string, Function]}
     */
    const [initialGlobalFilterSource, setInitialGlobalFilterSource] =
        useState("none");

    /**
     * initialJobsQuery
     * - Initial unfiltered jobs collection (default Get Jobs).
     * - Used as the "starting" dataset before any global filters are applied,
     *   and as the reset dataset when clearing filters globally.
     */
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

    /**
     * uniqueCompaniesQuery
     * - Loads the de-duplicated list of companies that have at least one job.
     * - Used to populate the Company dropdown with human-readable names.
     */
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

    /**
     * Effect: synchronize baseJobs from the initial jobs query
     * until a global filter has been applied.
     */
    useEffect(() => {
        if (!hasGlobalFilters && Array.isArray(initialJobsResponse)) {
            logger.info("useJobScreen syncing baseJobs from initialJobsResponse", {
                count: initialJobsResponse.length,
            });
            setBaseJobs(initialJobsResponse);
        }
    }, [initialJobsResponse, hasGlobalFilters]);

    /**
     * jobs
     * - Raw jobs array that will be fed into the local filter/search hook.
     *
     * @type {Array}
     */
    const jobs = useMemo(() => {
        const arr = Array.isArray(baseJobs) ? baseJobs : [];
        logger.info("useJobScreen using baseJobs as jobs source", {
            count: arr.length,
        });
        return arr;
    }, [baseJobs]);

    /**
     * filterAndSearch
     * - Local UI state and derived collections driven by useJobFilterAndSearch.
     * - This hook is pure client-side: it does not perform any data fetching.
     */
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

    /**
     * isPending
     * - Top-level pending flag for the screen.
     *
     * @type {boolean}
     */
    const isPending = isPendingInitialJobs;

    /**
     * Combined error state from jobs & unique companies queries.
     */
    const isError = Boolean(isErrorInitialJobs || isErrorCompanies);
    const error = errorInitialJobs || errorCompanies;

    /**
     * applyGlobalCompanyStatusFilter
     * - Executes a global getAllJobs call using current company/status filters
     *   and updates baseJobs + global flags.
     *
     * @async
     * @function applyGlobalCompanyStatusFilter
     * @returns {Promise<void>}
     */
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

    /**
     * applyGlobalClientSearch
     * - Executes a global searchJobs call using the current clientFilter as q.
     *   (Design choice: q = client name; server-side search returns jobs where
     *    name/description/client match this text.)
     *
     * @async
     * @function applyGlobalClientSearch
     * @param {string} clientName
     * @returns {Promise<void>}
     */
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

    /**
     * Effect: global behavior for company & status initial / edge cases.
     *
     * Rules:
     * - If hasGlobalFilters is false and either company or status is set (not "all"):
     *   -> perform a global getAllJobs call.
     * - Edge: if initial filter was company and status is then set (or vice versa),
     *   and both are active, perform a second global getAllJobs with both params.
     */
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

    /**
     * Effect: global behavior for initial client filter.
     *
     * Rules:
     * - If hasGlobalFilters is false and clientFilter is set (not "all"):
     *   -> perform a global searchJobs with q = clientFilter.
     * - After that, further client filter changes are local-only.
     */
    useEffect(() => {
        if (hasGlobalFilters) return;
        if (clientFilter === "all") return;

        logger.info("useJobScreen initial global client filter detected", {
            clientFilter,
        });
        applyGlobalClientSearch(clientFilter);
    }, [clientFilter, hasGlobalFilters]);

    /**
     * Scoped clients query:
     * - Active only when we already have global filters AND a specific company selected.
     * - Fetches unique clients for that company via GET /api/jobs/clients?companyId=...
     *
     * This powers the edge case:
     *   - After the initial filter is set to company, the client filter should use
     *     /clients API with the filtered company as a parameter to get the new
     *     unique list of clients for that company.
     */
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

    /**
     * companyOptions
     * - Company filter dropdown options built from UniqueCompanyResponse list.
     *   Uses companyId as the value and companyName as the label.
     *
     * @type {Array<{value:string,label:string}>}
     */
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

    /**
     * clientOptions
     * - Client filter dropdown options.
     *
     * Rules:
     * - If we have global filters AND a company filter is active, prefer the
     *   API-backed unique client list for that company (scopedClients).
     * - Otherwise, fall back to local unique clients from useJobFilterAndSearch.
     *
     * @type {Array<{value:string,label:string}>}
     */
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

    /**
     * Effect: when client was the initial global filter and is cleared back to "all",
     * perform a full global reset (clear global filters + restore initial jobs).
     *
     * Edge case covered:
     *  - User uses Client as the first/only filter (global searchJobs)
     *  - Then clicks "Clear" inside the Client dropdown
     */
    useEffect(() => {
        const clientWasInitialGlobal =
            initialGlobalFilterSource === "client" && hasGlobalFilters;

        if (!clientWasInitialGlobal) return;

        if (clientFilter === "all") {
            logger.info(
                "useJobScreen client filtered globally then cleared; performing global reset",
                {
                    initialGlobalFilterSource,
                    hasGlobalFilters,
                },
            );
            handleResetAll();
        }
    }, [clientFilter, initialGlobalFilterSource, hasGlobalFilters]);

    // --- Public API: merge query layer with local filter/search layer ---

    return {
        // base jobs from server (before local filters)
        jobs: filterAndSearch.jobs,

        // network state
        isPending,
        isError,
        error,

        // state from filter/search hook
        search: filterAndSearch.search,
        searchInput: filterAndSearch.searchInput,
        sortKey: filterAndSearch.sortKey,
        companyFilter: filterAndSearch.companyFilter,
        clientFilter: filterAndSearch.clientFilter,
        statusFilter: filterAndSearch.statusFilter,
        page: filterAndSearch.page,
        pageSize: filterAndSearch.pageSize,

        // setters / actions from filter/search hook
        setSearch: filterAndSearch.setSearch,
        setSearchInput: filterAndSearch.setSearchInput,
        setSortKey: filterAndSearch.setSortKey,
        setCompanyFilter: filterAndSearch.setCompanyFilter,
        setClientFilter: filterAndSearch.setClientFilter,
        setStatusFilter: filterAndSearch.setStatusFilter,
        setPage: filterAndSearch.setPage,
        setPageSize: filterAndSearch.setPageSize,

        // Use the combined reset (global + local)
        handleResetFilters: handleResetAll,

        // dropdown options (companyOptions overridden with API-backed names,
        // clientOptions optionally overridden with /clients?companyId= list)
        sortOptionsForDropdown: filterAndSearch.sortOptionsForDropdown,
        companyOptions,
        clientOptions,
        statusOptions: filterAndSearch.statusOptions,

        // derived collections
        filteredAndSortedJobs: filterAndSearch.filteredAndSortedJobs,
        paginatedJobs: filterAndSearch.paginatedJobs,

        // pagination meta
        totalJobs: filterAndSearch.totalJobs,
        totalPages: filterAndSearch.totalPages,
        currentPage: filterAndSearch.currentPage,
    };
};

export default useJobScreen;