/**
 * useJobScreen.js
 *
 * Orchestration hook for JobScreen.
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

export const useJobScreen = () => {
    logger.info("useJobScreen render start");

    // ---- Global UI state ----
    const [companyFilter, setCompanyFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");
    const [clientFilter, setClientFilter] = useState("all");
    const [sortKey, setSortKey] = useState(DEFAULT_SORT_KEY);

    // Global search query: when non-empty, use searchJobs in useJobSearch.
    const [globalSearchQuery, setGlobalSearchQuery] = useState("");

    // Track global filter behavior (company/status/client-based) on top of global search.
    const [hasGlobalFilters, setHasGlobalFilters] = useState(false);
    const [initialGlobalFilterSource, setInitialGlobalFilterSource] =
        useState("none"); // 'none' | 'company' | 'status' | 'client' | 'company-status'

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

    // ---- Base jobs snapshot used for local filters (after global APIs) ----
    const [baseJobs, setBaseJobs] = useState([]);

    // If we don't have company/status/client global filters, baseJobs mirror baseListJobs.
    useEffect(() => {
        if (!hasGlobalFilters) {
            logger.info("useJobScreen syncing baseJobs from baseListJobs", {
                count: baseListJobs.length,
            });
            setBaseJobs(baseListJobs);
        }
    }, [baseListJobs, hasGlobalFilters]);

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

    // ---- Helpers for global company/status/client API calls ----
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

        logger.info("applyGlobalCompanyStatusFilter called", {
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
        setHasGlobalFilters(true);

        if (cFilter !== "all" && sFilter !== "all") {
            setInitialGlobalFilterSource("company-status");
        } else if (cFilter !== "all") {
            setInitialGlobalFilterSource("company");
        } else if (sFilter !== "all") {
            setInitialGlobalFilterSource("status");
        }

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

        logger.info("applyGlobalClientSearch (filter) called", {
            clientName: trimmedClient,
            params,
        });

        const response = await searchJobs(params);
        const jobsArray = Array.isArray(response?.data) ? response.data : [];

        logger.info("applyGlobalClientSearch (filter) success", {
            count: jobsArray.length,
            meta: response?.meta,
        });

        setBaseJobs(jobsArray);
        setHasGlobalFilters(true);
        setInitialGlobalFilterSource("client");

        return response;
    };

    // ---- Scoped client options when initial global is company(/status) ----
    const [scopedClients, setScopedClients] = useState([]);

    useEffect(() => {
        const shouldScopeClients =
            hasGlobalFilters &&
            (initialGlobalFilterSource === "company" ||
                initialGlobalFilterSource === "company-status") &&
            companyFilter !== "all";

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
    }, [hasGlobalFilters, initialGlobalFilterSource, companyFilter]);

    const scopedClientOptions = useMemo(() => {
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

    // ---- Sort key handler ----
    const handleSetSortKey = (value) => {
        logger.info("useJobScreen handleSetSortKey", { value });
        setSortKey(value);
        filters.setSortKey(value);
        filters.setPage(1);
        handlePageChange(1);
    };

    // ---- Company filter handler ----
    const handleCompanyFilterChange = async (value) => {
        const normalized = value || "all";
        logger.info("useJobScreen handleCompanyFilterChange", {
            normalized,
            hasGlobalFilters,
            initialGlobalFilterSource,
        });

        setCompanyFilter(normalized);
        filters.setCompanyFilter(normalized);
        filters.setPage(1);
        handlePageChange(1);

        const isCompanyActive = normalized !== "all";

        if (!hasGlobalFilters && isCompanyActive) {
            await applyGlobalCompanyStatusFilter({
                companyFilter: normalized,
                statusFilter: "all",
            });
            return;
        }

        // Edge case: initial status, then company added → company-status
        if (
            hasGlobalFilters &&
            initialGlobalFilterSource === "status" &&
            isCompanyActive &&
            filters.statusFilter !== "all"
        ) {
            await applyGlobalCompanyStatusFilter({
                companyFilter: normalized,
                statusFilter: filters.statusFilter,
            });
        }
    };

    // ---- Status filter handler ----
    const handleStatusFilterChange = async (value) => {
        const normalized = value || "all";
        logger.info("useJobScreen handleStatusFilterChange", {
            normalized,
            hasGlobalFilters,
            initialGlobalFilterSource,
        });

        setStatusFilter(normalized);
        filters.setStatusFilter(normalized);
        filters.setPage(1);
        handlePageChange(1);

        const isStatusActive = normalized !== "all";

        // Helper: is status the ONLY active filter (no company, no client, no global search)?
        const isStatusOnlyFilter =
            companyFilter === "all" &&
            clientFilter === "all" &&
            (globalSearchQuery || "").trim() === "";

        // Case 1: first time status is used and it's not "all" -> global getAllJobs(status=...)
        if (!hasGlobalFilters && isStatusActive) {
            await applyGlobalCompanyStatusFilter({
                companyFilter: "all",
                statusFilter: normalized,
            });
            return;
        }

        // Edge case: initial company, then status added → company-status
        if (
            hasGlobalFilters &&
            initialGlobalFilterSource === "company" &&
            isStatusActive &&
            companyFilter !== "all"
        ) {
            await applyGlobalCompanyStatusFilter({
                companyFilter,
                statusFilter: normalized,
            });
            return;
        }

        // NEW: If status was the only filter, and we go back to "all",
        // issue a global getAllJobs with no status to restore the full set.
        if (
            hasGlobalFilters &&
            initialGlobalFilterSource === "status" &&
            !isStatusActive &&
            isStatusOnlyFilter
        ) {
            logger.info(
                "useJobScreen clearing global status filter (back to all, status-only case)",
            );
            await applyGlobalCompanyStatusFilter({
                companyFilter: "all",
                statusFilter: "all",
            });
            // applyGlobalCompanyStatusFilter will reset initialGlobalFilterSource appropriately
            return;
        }

        // Otherwise: going back to "all" is local-only (no extra server call)
    };

    // ---- Client filter handler (global only on first use) ----
    const handleClientFilterChange = async (value) => {
        const normalized = value || "all";
        logger.info("useJobScreen handleClientFilterChange", {
            normalized,
            hasGlobalFilters,
            initialGlobalFilterSource,
        });

        setClientFilter(normalized);
        filters.setClientFilter(normalized);
        filters.setPage(1);
        handlePageChange(1);

        const isClientActive = normalized !== "all";

        if (!hasGlobalFilters && isClientActive) {
            await applyGlobalClientSearch(normalized);
            return;
        }

        // After global filters exist, client filter is local-only.
    };

    // ---- Company/client options ----
    const companyOptions = useMemo(
        () => companyOptionsFromServer || filters.companyOptions,
        [companyOptionsFromServer, filters.companyOptions],
    );

    const clientOptions = useMemo(() => {
        if (Array.isArray(scopedClientOptions) && scopedClientOptions.length > 0) {
            return scopedClientOptions;
        }
        return filters.clientOptions;
    }, [scopedClientOptions, filters.clientOptions]);

    // ---- Reset all filters + search + pagination ----
    const handleResetFilters = () => {
        logger.info("useJobScreen handleResetFilters");
        filters.handleResetFilters();
        setCompanyFilter("all");
        setStatusFilter("all");
        setClientFilter("all");
        setSortKey(DEFAULT_SORT_KEY);
        setGlobalSearchQuery("");

        setHasGlobalFilters(false);
        setInitialGlobalFilterSource("none");
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
        setCompanyFilter("all");
        setStatusFilter("all");
        setClientFilter("all");

        // Reset only filter-related local state (not search/searchInput)
        filters.setCompanyFilter("all");
        filters.setClientFilter("all");
        filters.setStatusFilter("all");
        filters.setSortKey(DEFAULT_SORT_KEY);
        filters.setPage(1);
        filters.setPageSize(DEFAULT_PAGE_SIZE);

        // Reset global filter tracking
        setHasGlobalFilters(false);
        setInitialGlobalFilterSource("none");
        setScopedClients([]);
        setBaseJobs([]); // let useJobSearch repopulate baseJobs from baseListJobs

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
    };
};

export default useJobScreen;