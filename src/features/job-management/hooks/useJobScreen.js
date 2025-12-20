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
 * - Delegate all *local* search/sort over the current page to useJobFilterAndSearch.
 *
 * NOTE:
 * - Pagination is server-side: page/pageSize are passed to the API and
 *   result counts (totalRecords/totalPages) come from response.meta.
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
 * Server-side pagination rules:
 * - page / pageSize are always sent to the API.
 * - totalRecords / totalPages come from the latest API meta.
 * - Local hook only paginates within the current page result set (page = 1, pageSize = jobs.length).
 */
export const useJobScreen = () => {
    logger.info("useJobScreen initialized");

    // --- Global pagination state (server-side) ---
    /** @type {[number, Function]} */
    const [serverPage, setServerPage] = useState(1);
    /** @type {[number, Function]} */
    const [serverPageSize, setServerPageSize] = useState(DEFAULT_PAGE_SIZE);

    /**
     * baseJobs
     * - Local copy of jobs that reflect the latest "global" query results.
     *
     * @type {[Array, Function]}
     */
    const [baseJobs, setBaseJobs] = useState([]);

    /**
     * hasGlobalFilters
     * - Tracks whether any global filter (company/status/client) has been
     *   applied yet.
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

    // --- Initial unfiltered jobs load WITH server-side pagination ---
    const {
        data: initialJobsResponse,
        isPending: isPendingInitialJobs,
        isError: isErrorInitialJobs,
        error: errorInitialJobs,
    } = useQuery({
        queryKey: jobKeys.list({
            page: serverPage,
            size: serverPageSize,
        }),
        queryFn: async () => {
            logger.info("useJobScreen initial jobs queryFn called", {
                page: serverPage,
                size: serverPageSize,
            });
            const response = await getAllJobs({
                page: serverPage,
                size: serverPageSize,
            });
            const jobsArray = Array.isArray(response?.data)
                ? response.data
                : [];
            logger.info("useJobScreen initial jobs queryFn success", {
                count: jobsArray.length,
                meta: response?.meta,
            });
            return response;
        },
        keepPreviousData: true,
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

    /**
     * Effect: synchronize baseJobs from the jobs query
     * (unfiltered or filtered) any time we get a new page.
     */
    useEffect(() => {
        const jobsArray = Array.isArray(initialJobsResponse?.data)
            ? initialJobsResponse.data
            : [];
        logger.info("useJobScreen syncing baseJobs from latest jobsResponse", {
            count: jobsArray.length,
        });
        setBaseJobs(jobsArray);
    }, [initialJobsResponse]);

    /**
     * jobs
     * - Raw jobs array for the current server page that will be fed
     *   into the local filter/search hook.
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
     * - For server-side pagination, we:
     *   - Treat the "page" inside this hook as always 1.
     *   - Set local pageSize to jobs.length so it shows the full current page.
     */
    const filterAndSearch = useJobFilterAndSearch(jobs, {
        initialSortKey: DEFAULT_SORT_KEY,
        initialPageSize: jobs.length || DEFAULT_PAGE_SIZE,
    });

    const {
        companyFilter,
        statusFilter,
        clientFilter,
        sortKey,
        // local page/pageSize ignored for server pagination
    } = filterAndSearch;

    /**
     * Server-side pagination meta from API.
     */
    const serverMeta = initialJobsResponse?.meta || null;
    const totalJobs =
        typeof serverMeta?.totalRecords === "number"
            ? serverMeta.totalRecords
            : filterAndSearch.totalJobs;
    const totalPages =
        typeof serverMeta?.totalPages === "number"
            ? serverMeta.totalPages
            : filterAndSearch.totalPages;
    const currentPage = serverMeta?.page ?? serverPage;

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
     *   and updates baseJobs + global flags + server-side meta.
     *
     * NOTE:
     * - Uses serverPage/serverPageSize for server pagination.
     */
    const applyGlobalCompanyStatusFilter = async () => {
        logger.info("useJobScreen applyGlobalCompanyStatusFilter called", {
            companyFilter,
            statusFilter,
            page: serverPage,
            pageSize: serverPageSize,
            sortKey,
        });

        const params = buildGlobalJobParams({
            companyFilter,
            statusFilter,
            clientFilter: "all",
            page: serverPage,
            pageSize: serverPageSize,
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
                    meta: response?.meta,
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
            page: serverPage,
            pageSize: serverPageSize,
            sortKey,
        });

        const { sortField, sortOrder } = deriveApiSortParams(sortKey);

        const params = {
            q: trimmedClient,
            page: serverPage,
            size: serverPageSize,
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
                meta: response?.meta,
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
        // applyGlobalCompanyStatusFilter intentionally excluded
    ]);

    /**
     * Effect: global behavior for initial client filter.
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
     * Scoped clients query for company+global filters.
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
     * - Client filter dropdown options (scoped or local).
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

        filterAndSearch.handleResetFilters();
        setHasGlobalFilters(false);
        setInitialGlobalFilterSource("none");

        // Reset server pagination back to first page
        setServerPage(1);
        setServerPageSize(DEFAULT_PAGE_SIZE);

        if (Array.isArray(initialJobsResponse?.data)) {
            logger.info("useJobScreen handleResetAll restoring baseJobs", {
                count: initialJobsResponse.data.length,
            });
            setBaseJobs(initialJobsResponse.data);
        } else {
            setBaseJobs([]);
        }
    };

    /**
     * Effect: when client was the initial global filter and is cleared back to "all",
     * perform a full global reset.
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

        // server-side pagination state + setter
        page: currentPage,
        pageSize: serverPageSize,
        setPage: setServerPage,
        setPageSize: setServerPageSize,

        setSearch: filterAndSearch.setSearch,
        setSearchInput: filterAndSearch.setSearchInput,
        setSortKey: filterAndSearch.setSortKey,
        setCompanyFilter: filterAndSearch.setCompanyFilter,
        setClientFilter: filterAndSearch.setClientFilter,
        setStatusFilter: filterAndSearch.setStatusFilter,

        handleResetFilters: handleResetAll,

        sortOptionsForDropdown: filterAndSearch.sortOptionsForDropdown,
        companyOptions,
        clientOptions,
        statusOptions: filterAndSearch.statusOptions,

        // NOTE: filteredAndSortedJobs/paginatedJobs are local to the current server page
        filteredAndSortedJobs: filterAndSearch.filteredAndSortedJobs,
        paginatedJobs: filterAndSearch.paginatedJobs,

        totalJobs,
        totalPages,
        currentPage,
    };
};

export default useJobScreen;