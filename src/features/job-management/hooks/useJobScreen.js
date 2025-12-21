/**
 * useJobScreen.js
 *
 * Orchestration hook for JobScreen.
 *
 * Responsibilities:
 * - Manage global search (always server-side via searchJobs when query present).
 * - Manage global vs local filters per business rules:
 *   * First non-"all" company/status uses getAllJobs (global).
 *   * First non-"all" client uses searchJobs (global).
 *   * After initial global, other filters are local-only, except:
 *       - company+status combo triggers another global getAllJobs.
 *       - client options for company/global come from getJobClients(companyId).
 * - Manage baseJobs for local filtering via useJobFilters.
 * - Integrate server-side pagination via useJobScreenPagination.
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

    // Global search query: when non-empty, we always use searchJobs for the base list.
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
        }
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
        search: filters.search,         // local (unused by global search)
        searchInput: filters.searchInput,
        sortKey,
        companyFilter,
        clientFilter,
        statusFilter,

        // setters
        setSearch: filters.setSearch,   // still used for local filter text if you want
        setSearchInput: filters.setSearchInput,
        setSortKey: handleSetSortKey,
        setCompanyFilter: handleCompanyFilterChange,
        setClientFilter: handleClientFilterChange,
        setStatusFilter: handleStatusFilterChange,

        // GLOBAL search setter (called from JobScreen on Enter)
        setGlobalSearchQuery,

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