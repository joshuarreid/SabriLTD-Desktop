/**
 * useJobScreen.js
 *
 * Orchestration hook for JobScreen.
 *
 * Rules:
 * - First non-"all" filter (company, client or status) becomes the PRIMARY GLOBAL FILTER.
 * - While that primary filter is active:
 *   - Changes to that SAME filter (e.g., Active -> Closed, Coca Cola -> Fiserv)
 *     remain GLOBAL and re-query the server.
 *   - Other filters are LOCAL ONLY.
 * - If you CLEAR the primary filter (set it back to "all"),
 *   we UNDO that global narrowing and go back to the base/globalSearch list.
 * - Status options are static and come from useJobFilters.
 * - Client options for dropdown come from useJobFilters (unique clients in current baseJobs),
 *   optionally scoped by company via getJobClients.
 */

import { useEffect, useMemo, useState } from "react";
import {
    useJobFilters,
    DEFAULT_PAGE_SIZE,
    DEFAULT_SORT_KEY,
} from "./useJobFilters";
import { useJobSearch } from "./useJobSearch";
import { useJobScreenPagination } from "./useJobScreenPagination";
import { getAllJobs, getJobClients, searchJobs } from "../../../api/job/job";

const logger = {
    info: (...args) => console.log("[useJobScreen]", ...args),
    error: (...args) => console.error("[useJobScreen]", ...args),
};

/**
 * useJobScreen
 * Orchestration hook for JobScreen state management and side effects.
 *
 * @function useJobScreen
 * @param {object} params
 * @param {Function} params.navigate - React Router navigate function for route transitions.
 * @returns {object} View model for JobScreen rendering and interactions.
 */
export const useJobScreen = ({ navigate } = {}) => {
    logger.info("useJobScreen render start");

    /**
     * handleNewJob
     * Navigates to the Job creation route.
     *
     * @function handleNewJob
     * @returns {void}
     */
    const handleNewJob = () => {
        logger.info("handleNewJob clicked");
        if (typeof navigate !== "function") {
            logger.error(
                "handleNewJob requires a navigate function, but none was provided",
            );
            return;
        }

        navigate("/jobs/new");
    };

    // ---- Central filter state (company, status, client) ----
    const [filtersState, setFiltersState] = useState({
        company: "all",
        status: "all",
        client: "all",
    });

    const companyFilter = filtersState.company;
    const statusFilter = filtersState.status;
    const clientFilter = filtersState.client;

    const [sortKey, setSortKey] = useState(DEFAULT_SORT_KEY);

    // Global search query: when non-empty, use searchJobs in useJobSearch.
    const [globalSearchQuery, setGlobalSearchQuery] = useState("");

    // Track whether we've already done a global-filtering call via a filter.
    const [hasGlobalFilterApplied, setHasGlobalFilterApplied] = useState(false);

    // Track WHICH filter triggered (and owns) the global filtering: "company" | "status" | "client"
    const [firstGlobalFilterKey, setFirstGlobalFilterKey] = useState(null);

    // ---- Server pagination (drives API) ----
    const [serverPage, setServerPage] = useState(1);
    const [serverPageSize, setServerPageSize] = useState(DEFAULT_PAGE_SIZE);

    // ---- Base list via useJobSearch (respects globalSearchQuery) ----
    const {
        jobs: baseListJobs,
        totalJobs: baseTotalJobs,
        totalPages: baseTotalPages,
        currentPage: baseCurrentPage,
        isPending,
        isError,
        error,
        companyOptionsFromServer,
        serverMeta,
    } = useJobSearch({
        page: serverPage,
        pageSize: serverPageSize,
        sortKey,
        globalSearchQuery,
    });

    // ---- Base jobs snapshot used for local filters (after global calls) ----
    const [baseJobs, setBaseJobs] = useState([]);

    // Whenever we are *not* in a global-filtered mode, mirror baseListJobs.
    useEffect(() => {
        if (!hasGlobalFilterApplied) {
            logger.info("useJobScreen syncing baseJobs from baseListJobs", {
                count: baseListJobs.length,
            });
            setBaseJobs(baseListJobs);
        }
    }, [baseListJobs, hasGlobalFilterApplied]);

    // ---- Pagination using server meta of base/global list ----
    const pagination = useJobScreenPagination({
        initialPage: baseCurrentPage ?? 1,
        initialPageSize: serverPageSize,
        totalItems: serverMeta?.totalRecords ?? baseTotalJobs,
        totalPagesFromServer: serverMeta?.totalPages ?? baseTotalPages,
    });

    const handlePageChange = (nextPage) => {
        logger.info("useJobScreen handlePageChange (from UI)", {
            nextPage,
        });
        pagination.setPage(nextPage);
        setServerPage(nextPage);
    };

    const handleNextPage = () => {
        if (!pagination.hasNext) return;
        const next = pagination.page + 1;
        logger.info("useJobScreen handleNextPage", {
            current: pagination.page,
            next,
        });
        pagination.handleNext();
        setServerPage(next);
    };

    const handlePreviousPage = () => {
        if (!pagination.hasPrevious) return;
        const prev = pagination.page - 1;
        logger.info("useJobScreen handlePreviousPage", {
            current: pagination.page,
            prev,
        });
        pagination.handlePrevious();
        setServerPage(prev);
    };

    const handleSetPageSize = (nextSize) => {
        logger.info("useJobScreen handleSetPageSize", { nextSize });
        pagination.setPageSize(nextSize);
        setServerPageSize(nextSize);
        setServerPage(1);
    };

    // ---- Local filters over baseJobs ----
    const filters = useJobFilters(baseJobs, {
        initialSortKey: sortKey,
        initialPageSize: baseJobs.length || DEFAULT_PAGE_SIZE,
    });

    // ---- Helpers for global API calls for the primary filter ----
    const deriveApiSortParams = (sortKeyValue) => {
        if (!sortKeyValue) return { sortField: null, sortOrder: "asc" };

        const [field, dirRaw] = String(sortKeyValue).split("-");
        const sortOrder = dirRaw === "asc" ? "asc" : "desc";

        if (field === "date") {
            return { sortField: "dateAdded", sortOrder };
        }
        if (field === "modified") {
            return { sortField: "dateUpdated", sortOrder };
        }

        return { sortField: "name", sortOrder };
    };

    const buildGlobalJobParams = ({
                                      companyFilter: cFilter,
                                      statusFilter: sFilter,
                                      page,
                                      pageSize,
                                      sortKey: sKey,
                                  }) => {
        const { sortField, sortOrder } = deriveApiSortParams(sKey);

        const params = {
            page,
            size: pageSize,
        };

        if (sortField) {
            params.sortField = sortField;
            params.sortOrder = sortOrder;
        }

        if (cFilter !== "all") {
            params.companyId = Number(cFilter);
        }

        if (sFilter !== "all") {
            params.status = sFilter;
        }

        // Client is handled via searchJobs, not here.
        return params;
    };

    const applyGlobalCompanyStatusFilter = async ({
                                                      companyFilter: cFilter,
                                                      statusFilter: sFilter,
                                                  }) => {
        const params = buildGlobalJobParams({
            companyFilter: cFilter,
            statusFilter: sFilter,
            page: serverPage,
            pageSize: serverPageSize,
            sortKey,
        });

        logger.info("applyGlobalCompanyStatusFilter called (global filter)", {
            companyFilter: cFilter,
            statusFilter: sFilter,
            params,
        });

        const response = await getAllJobs(params);
        const jobsArray = Array.isArray(response?.data) ? response.data : [];

        logger.info("applyGlobalCompanyStatusFilter success", {
            count: jobsArray.length,
            meta: response?.meta,
        });

        setBaseJobs(jobsArray);
        setHasGlobalFilterApplied(true);

        return response;
    };

    const applyGlobalClientSearch = async (clientName) => {
        const trimmedClient = clientName?.trim();
        if (!trimmedClient) return null;

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

        logger.info("applyGlobalClientSearch (global filter) called", {
            clientName: trimmedClient,
            params,
        });

        const response = await searchJobs(params);
        const jobsArray = Array.isArray(response?.data) ? response.data : [];

        logger.info("applyGlobalClientSearch (global filter) success", {
            count: jobsArray.length,
            meta: response?.meta,
        });

        setBaseJobs(jobsArray);
        setHasGlobalFilterApplied(true);

        return response;
    };

    // ---- Scoped client options when global is company(/status) ----
    const [scopedClients, setScopedClients] = useState([]);

    useEffect(() => {
        const shouldScopeClients =
            hasGlobalFilterApplied && companyFilter !== "all";

        if (!shouldScopeClients) {
            setScopedClients([]);
            return;
        }

        const companyId = Number(companyFilter);
        logger.info("useJobScreen fetching scoped clients for company", {
            companyId,
        });

        (async () => {
            try {
                const clients = await getJobClients({ companyId });
                logger.info("useJobScreen scoped clients success", {
                    count: Array.isArray(clients) ? clients.length : 0,
                    companyId,
                });
                setScopedClients(Array.isArray(clients) ? clients : []);
            } catch (err) {
                logger.error("useJobScreen scoped clients failed", err);
                setScopedClients([]);
            }
        })();
    }, [hasGlobalFilterApplied, companyFilter]);

    const scopedClientOptions = useMemo(() => {
        if (!Array.isArray(scopedClients) || scopedClients.length === 0) {
            return null;
        }

        const sorted = [...scopedClients].sort((a, b) =>
            String(a.clientName || "").localeCompare(String(b.clientName || "")),
        );

        return [
            { value: "all", label: "All" },
            ...sorted.map((client) => ({
                value: client.clientName,
                label: client.clientName,
            })),
        ];
    }, [scopedClients]);

    // ---- Centralized filter setter ----
    const setFilter = (key, value) => {
        const normalized = value || "all";
        setFiltersState((prev) => ({
            ...prev,
            [key]: normalized,
        }));
        return normalized;
    };

    // ---- Sort key handler (global+local) ----
    const handleSetSortKey = (value) => {
        logger.info("useJobScreen handleSetSortKey", { value });
        setSortKey(value);
        filters.setSortKey(value);
        filters.setPage(1);
        handlePageChange(1);
    };

    // ---- Company filter handler ----
    const handleCompanyFilterChange = async (value) => {
        const normalized = setFilter("company", value);
        logger.info("useJobScreen handleCompanyFilterChange", {
            normalized,
            hasGlobalFilterApplied,
            firstGlobalFilterKey,
        });

        filters.setCompanyFilter(normalized);
        filters.setPage(1);
        handlePageChange(1);

        const isCompanyActive = normalized !== "all";

        // Determine if this filter should act globally:
        const isFirstGlobal = !hasGlobalFilterApplied && isCompanyActive;
        const isPrimaryGlobal =
            hasGlobalFilterApplied &&
            firstGlobalFilterKey === "company" &&
            isCompanyActive;

        // First-time or subsequent change on primary global filter -> GLOBAL call
        if (isFirstGlobal || isPrimaryGlobal) {
            await applyGlobalCompanyStatusFilter({
                companyFilter: normalized,
                statusFilter: "all",
            });
            setFirstGlobalFilterKey("company");
            return;
        }

        // If company was primary global filter and we're clearing it back to "all",
        // undo the global narrowing and go back to base/globalSearch list.
        if (
            hasGlobalFilterApplied &&
            firstGlobalFilterKey === "company" &&
            !isCompanyActive
        ) {
            logger.info(
                "useJobScreen clearing global company filter (back to base/globalSearch)",
            );
            setHasGlobalFilterApplied(false);
            setFirstGlobalFilterKey(null);
            setBaseJobs(baseListJobs);
            return;
        }

        // Otherwise local-only
    };

    // ---- Status filter handler ----
    const handleStatusFilterChange = async (value) => {
        const normalized = setFilter("status", value);
        logger.info("useJobScreen handleStatusFilterChange", {
            normalized,
            hasGlobalFilterApplied,
            firstGlobalFilterKey,
        });

        filters.setStatusFilter(normalized);
        filters.setPage(1);
        handlePageChange(1);

        const isStatusActive = normalized !== "all";

        const isFirstGlobal = !hasGlobalFilterApplied && isStatusActive;
        const isPrimaryGlobal =
            hasGlobalFilterApplied &&
            firstGlobalFilterKey === "status" &&
            isStatusActive;

        if (isFirstGlobal || isPrimaryGlobal) {
            await applyGlobalCompanyStatusFilter({
                companyFilter: "all",
                statusFilter: normalized,
            });
            setFirstGlobalFilterKey("status");
            return;
        }

        if (
            hasGlobalFilterApplied &&
            firstGlobalFilterKey === "status" &&
            !isStatusActive
        ) {
            logger.info(
                "useJobScreen clearing global status filter (back to base/globalSearch)",
            );
            setHasGlobalFilterApplied(false);
            setFirstGlobalFilterKey(null);
            setBaseJobs(baseListJobs);
            return;
        }

        // Otherwise local-only
    };

    // ---- Client filter handler ----
    const handleClientFilterChange = async (value) => {
        const normalized = setFilter("client", value);
        logger.info("useJobScreen handleClientFilterChange", {
            normalized,
            hasGlobalFilterApplied,
            firstGlobalFilterKey,
        });

        filters.setClientFilter(normalized);
        filters.setPage(1);
        handlePageChange(1);

        const isClientActive = normalized !== "all";

        const isFirstGlobal = !hasGlobalFilterApplied && isClientActive;
        const isPrimaryGlobal =
            hasGlobalFilterApplied &&
            firstGlobalFilterKey === "client" &&
            isClientActive;

        if (isFirstGlobal || isPrimaryGlobal) {
            await applyGlobalClientSearch(normalized);
            setFirstGlobalFilterKey("client");
            return;
        }

        if (
            hasGlobalFilterApplied &&
            firstGlobalFilterKey === "client" &&
            !isClientActive
        ) {
            logger.info(
                "useJobScreen clearing global client filter (back to base/globalSearch)",
            );
            setHasGlobalFilterApplied(false);
            setFirstGlobalFilterKey(null);
            setBaseJobs(baseListJobs);
            return;
        }

        // Otherwise local-only
    };

    // ---- Company/client options ----
    const companyOptions = useMemo(
        () => companyOptionsFromServer || filters.companyOptions,
        [companyOptionsFromServer, filters.companyOptions],
    );

    const clientOptions = useMemo(() => {
        if (
            Array.isArray(scopedClientOptions) &&
            scopedClientOptions.length > 0
        ) {
            return scopedClientOptions;
        }
        return filters.clientOptions;
    }, [scopedClientOptions, filters.clientOptions]);

    // ---- Reset all filters + search + pagination ----
    const handleResetFilters = () => {
        logger.info("useJobScreen handleResetFilters");
        filters.handleResetFilters();

        setFiltersState({
            company: "all",
            status: "all",
            client: "all",
        });
        setSortKey(DEFAULT_SORT_KEY);
        setGlobalSearchQuery("");

        setHasGlobalFilterApplied(false);
        setFirstGlobalFilterKey(null);
        setScopedClients([]);
        setBaseJobs(baseListJobs);

        pagination.resetPagination();
        setServerPage(1);
        setServerPageSize(DEFAULT_PAGE_SIZE);
    };

    // ---- Global search API from JobScreen ----
    const applyGlobalSearch = (query) => {
        logger.info("useJobScreen applyGlobalSearch", { query });

        // Clear all filters when a global search is performed, but DO NOT clear searchInput.
        setFiltersState({
            company: "all",
            status: "all",
            client: "all",
        });

        // Reset local filter state
        filters.setCompanyFilter("all");
        filters.setClientFilter("all");
        filters.setStatusFilter("all");
        filters.setSortKey(DEFAULT_SORT_KEY);
        filters.setPage(1);
        filters.setPageSize(DEFAULT_PAGE_SIZE);

        // Reset global filter tracking
        setHasGlobalFilterApplied(false);
        setFirstGlobalFilterKey(null);
        setScopedClients([]);
        setBaseJobs([]); // let useJobSearch repopulate from new global search

        // Set global search query (drives useJobSearch -> searchJobs)
        setGlobalSearchQuery(query || "");

        // Reset pagination to first page
        pagination.resetPagination();
        setServerPage(1);
    };

    // ---- Meta derived values ----
    const totalJobs = serverMeta?.totalRecords ?? baseTotalJobs;
    const totalPages = pagination.totalPages;
    const currentPage = pagination.page;

    return {
        // jobs
        jobs: filters.jobs,
        filteredAndSortedJobs: filters.filteredAndSortedJobs,
        paginatedJobs: filters.paginatedJobs,

        // loading / error
        isPending,
        isError,
        error,

        // search & filters
        search: filters.search,
        searchInput: filters.searchInput,
        sortKey,
        companyFilter,
        clientFilter,
        statusFilter,

        // setters
        setSearch: filters.setSearch,
        setSearchInput: filters.setSearchInput,
        setSortKey: handleSetSortKey,
        setCompanyFilter: handleCompanyFilterChange,
        setClientFilter: handleClientFilterChange,
        setStatusFilter: handleStatusFilterChange,

        // global search entrypoint for JobScreen
        applyGlobalSearch,

        // pagination
        pageSize: pagination.pageSize,
        hasPrevious: pagination.hasPrevious,
        hasNext: pagination.hasNext,
        handlePageChange,
        handleNextPage,
        handlePreviousPage,
        itemStart: pagination.itemStart,
        itemEnd: pagination.itemEnd,

        // dropdown options
        sortOptionsForDropdown: filters.sortOptionsForDropdown,
        companyOptions,
        clientOptions,
        statusOptions: filters.statusOptions,

        // meta
        totalJobs,
        totalPages,
        currentPage,

        // actions
        handleResetFilters,
        handleSetPageSize,
        handleNewJob,
    };
};

export default useJobScreen;