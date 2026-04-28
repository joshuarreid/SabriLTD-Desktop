/**
 * useJobSearchBox.js
 *
 * Reusable orchestration hook for JobSearchBox.
 * Encapsulates all search, filter, sort, pagination, and create-job-modal state
 * that was previously in useJobScreen.
 *
 * Designed to be consumed by JobSearchBox (or any screen that needs a job search + grid).
 *
 * Rules (unchanged from useJobScreen):
 * - First non-"all" filter (company, client or status) becomes the PRIMARY GLOBAL FILTER.
 * - While that primary filter is active, changes to the same filter remain GLOBAL.
 * - Other filters are LOCAL ONLY.
 * - Clearing the primary filter undoes the global narrowing.
 * - Status options are static and come from useJobFilters.
 * - Client options come from useJobFilters, optionally scoped by company via getJobClients.
 *
 * @function useJobSearchBox
 * @param {object} [options]
 * @param {string} [options.placeholder="Search jobs"] - Search bar placeholder.
 * @returns {object} Full view model for JobSearchBox rendering.
 */

import { useEffect, useMemo, useState } from "react";
import useCreateJobModal from "./useCreateJobModal.ts";
import {DEFAULT_PAGE_SIZE, DEFAULT_SORT_KEY, useJobFilters} from "./useJobFilters.ts";
import useJobSearch from "./useJobSearch.ts";
import useJobScreenPagination from "./useJobScreenPagination.ts";
import {getAllJobs, getJobClients, searchJobs} from "../api/job.ts";


/**
 * Logger for useJobSearchBox.
 *
 * @constant
 * @type {{info: Function, error: Function}}
 */
const logger = {
    info: (...args) => console.log("[useJobSearchBox]", ...args),
    error: (...args) => console.error("[useJobSearchBox]", ...args),
};

export const useJobSearchBox = ({ placeholder = "Search jobs" } = {}) => {
    logger.info("useJobSearchBox render start");

    /**
     * Create job modal orchestration (open/close/mutation).
     */
    const createJobModal = useCreateJobModal();

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

    /**
     * Global search query: when non-empty, use searchJobs in useJobSearch.
     *
     * @type {[string, Function]}
     */
    const [globalSearchQuery, setGlobalSearchQuery] = useState("");

    /**
     * Track whether we've already done a global-filtering call via a filter.
     *
     * @type {[boolean, Function]}
     */
    const [hasGlobalFilterApplied, setHasGlobalFilterApplied] = useState(false);

    /**
     * Track WHICH filter triggered (and owns) the global filtering.
     *
     * @type {["company"|"status"|"client"|null, Function]}
     */
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

    /**
     * Whenever we are *not* in a global-filtered mode, mirror baseListJobs.
     *
     * @effect
     */
    useEffect(() => {
        if (!hasGlobalFilterApplied) {
            logger.info("Syncing baseJobs from baseListJobs", {
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

    /**
     * handlePageChange
     *
     * @function handlePageChange
     * @param {number} nextPage
     * @returns {void}
     */
    const handlePageChange = (nextPage) => {
        logger.info("handlePageChange", { nextPage });
        pagination.setPage(nextPage);
        setServerPage(nextPage);
    };

    /**
     * handleNextPage
     *
     * @function handleNextPage
     * @returns {void}
     */
    const handleNextPage = () => {
        if (!pagination.hasNext) return;
        const next = pagination.page + 1;
        logger.info("handleNextPage", { current: pagination.page, next });
        pagination.handleNext();
        setServerPage(next);
    };

    /**
     * handlePreviousPage
     *
     * @function handlePreviousPage
     * @returns {void}
     */
    const handlePreviousPage = () => {
        if (!pagination.hasPrevious) return;
        const prev = pagination.page - 1;
        logger.info("handlePreviousPage", { current: pagination.page, prev });
        pagination.handlePrevious();
        setServerPage(prev);
    };

    /**
     * handleSetPageSize
     *
     * @function handleSetPageSize
     * @param {number} nextSize
     * @returns {void}
     */
    const handleSetPageSize = (nextSize) => {
        logger.info("handleSetPageSize", { nextSize });
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

    /**
     * deriveApiSortParams
     *
     * @function deriveApiSortParams
     * @param {string} sortKeyValue
     * @returns {{sortField: string|null, sortOrder: string}}
     */
    const deriveApiSortParams = (sortKeyValue) => {
        if (!sortKeyValue) return { sortField: null, sortOrder: "asc" };

        const [field, dirRaw] = String(sortKeyValue).split("-");
        const sortOrder = dirRaw === "asc" ? "asc" : "desc";

        if (field === "date") return { sortField: "dateAdded", sortOrder };
        if (field === "modified") return { sortField: "dateUpdated", sortOrder };
        return { sortField: "name", sortOrder };
    };

    /**
     * buildGlobalJobParams
     *
     * @function buildGlobalJobParams
     * @param {object} params
     * @returns {object}
     */
    const buildGlobalJobParams = ({
                                      companyFilter: cFilter,
                                      statusFilter: sFilter,
                                      page,
                                      pageSize,
                                      sortKey: sKey,
                                  }) => {
        const { sortField, sortOrder } = deriveApiSortParams(sKey);

        const params = { page, size: pageSize };

        if (sortField) {
            params.sortField = sortField;
            params.sortOrder = sortOrder;
        }

        if (cFilter !== "all") params.companyId = Number(cFilter);
        if (sFilter !== "all") params.status = sFilter;

        return params;
    };

    /**
     * applyGlobalCompanyStatusFilter
     *
     * @async
     * @function applyGlobalCompanyStatusFilter
     * @param {object} params
     * @param {string} params.companyFilter
     * @param {string} params.statusFilter
     * @returns {Promise<object>}
     */
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
        setHasGlobalFilterApplied(true);

        return response;
    };

    /**
     * applyGlobalClientSearch
     *
     * @async
     * @function applyGlobalClientSearch
     * @param {string} clientName
     * @returns {Promise<object|null>}
     */
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

        logger.info("applyGlobalClientSearch called", {
            clientName: trimmedClient,
            params,
        });

        const response = await searchJobs(params);
        const jobsArray = Array.isArray(response?.data) ? response.data : [];

        logger.info("applyGlobalClientSearch success", {
            count: jobsArray.length,
            meta: response?.meta,
        });

        setBaseJobs(jobsArray);
        setHasGlobalFilterApplied(true);

        return response;
    };

    // ---- Scoped client options when global is company(/status) ----
    const [scopedClients, setScopedClients] = useState([]);

    /**
     * Fetch scoped clients when company filter is globally applied.
     *
     * @effect
     */
    useEffect(() => {
        const shouldScopeClients =
            hasGlobalFilterApplied && companyFilter !== "all";

        if (!shouldScopeClients) {
            setScopedClients([]);
            return;
        }

        const companyId = Number(companyFilter);
        logger.info("Fetching scoped clients for company", { companyId });

        (async () => {
            try {
                const clients = await getJobClients({ companyId });
                logger.info("Scoped clients success", {
                    count: Array.isArray(clients) ? clients.length : 0,
                    companyId,
                });
                setScopedClients(Array.isArray(clients) ? clients : []);
            } catch (err) {
                logger.error("Scoped clients failed", err);
                setScopedClients([]);
            }
        })();
    }, [hasGlobalFilterApplied, companyFilter]);

    /**
     * scopedClientOptions
     *
     * @type {Array<{value: string, label: string}>|null}
     */
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

    /**
     * setFilter
     *
     * @function setFilter
     * @param {string} key
     * @param {string} value
     * @returns {string} Normalized value.
     */
    const setFilter = (key, value) => {
        const normalized = value || "all";
        setFiltersState((prev) => ({ ...prev, [key]: normalized }));
        return normalized;
    };

    // ---- Sort key handler (global+local) ----

    /**
     * handleSetSortKey
     *
     * @function handleSetSortKey
     * @param {string} value
     * @returns {void}
     */
    const handleSetSortKey = (value) => {
        logger.info("handleSetSortKey", { value });
        setSortKey(value);
        filters.setSortKey(value);
        filters.setPage(1);
        handlePageChange(1);
    };

    // ---- Company filter handler ----

    /**
     * handleCompanyFilterChange
     *
     * @async
     * @function handleCompanyFilterChange
     * @param {string} value
     * @returns {Promise<void>}
     */
    const handleCompanyFilterChange = async (value) => {
        const normalized = setFilter("company", value);
        logger.info("handleCompanyFilterChange", {
            normalized,
            hasGlobalFilterApplied,
            firstGlobalFilterKey,
        });

        filters.setCompanyFilter(normalized);
        filters.setPage(1);
        handlePageChange(1);

        const isCompanyActive = normalized !== "all";

        const isFirstGlobal = !hasGlobalFilterApplied && isCompanyActive;
        const isPrimaryGlobal =
            hasGlobalFilterApplied &&
            firstGlobalFilterKey === "company" &&
            isCompanyActive;

        if (isFirstGlobal || isPrimaryGlobal) {
            await applyGlobalCompanyStatusFilter({
                companyFilter: normalized,
                statusFilter: "all",
            });
            setFirstGlobalFilterKey("company");
            return;
        }

        if (
            hasGlobalFilterApplied &&
            firstGlobalFilterKey === "company" &&
            !isCompanyActive
        ) {
            logger.info("Clearing global company filter (back to base/globalSearch)");
            setHasGlobalFilterApplied(false);
            setFirstGlobalFilterKey(null);
            setBaseJobs(baseListJobs);
            return;
        }
    };

    // ---- Status filter handler ----

    /**
     * handleStatusFilterChange
     *
     * @async
     * @function handleStatusFilterChange
     * @param {string} value
     * @returns {Promise<void>}
     */
    const handleStatusFilterChange = async (value) => {
        const normalized = setFilter("status", value);
        logger.info("handleStatusFilterChange", {
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
            logger.info("Clearing global status filter (back to base/globalSearch)");
            setHasGlobalFilterApplied(false);
            setFirstGlobalFilterKey(null);
            setBaseJobs(baseListJobs);
            return;
        }
    };

    // ---- Client filter handler ----

    /**
     * handleClientFilterChange
     *
     * @async
     * @function handleClientFilterChange
     * @param {string} value
     * @returns {Promise<void>}
     */
    const handleClientFilterChange = async (value) => {
        const normalized = setFilter("client", value);
        logger.info("handleClientFilterChange", {
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
            logger.info("Clearing global client filter (back to base/globalSearch)");
            setHasGlobalFilterApplied(false);
            setFirstGlobalFilterKey(null);
            setBaseJobs(baseListJobs);
            return;
        }
    };

    // ---- Company/client options ----

    /**
     * companyOptions
     *
     * @type {Array<{value: string, label: string}>}
     */
    const companyOptions = useMemo(
        () => companyOptionsFromServer || filters.companyOptions,
        [companyOptionsFromServer, filters.companyOptions],
    );

    /**
     * clientOptions
     *
     * @type {Array<{value: string, label: string}>}
     */
    const clientOptions = useMemo(() => {
        if (Array.isArray(scopedClientOptions) && scopedClientOptions.length > 0) {
            return scopedClientOptions;
        }
        return filters.clientOptions;
    }, [scopedClientOptions, filters.clientOptions]);

    // ---- Reset all filters + search + pagination ----

    /**
     * handleResetFilters
     *
     * @function handleResetFilters
     * @returns {void}
     */
    const handleResetFilters = () => {
        logger.info("handleResetFilters");
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

    // ---- Global search API ----

    /**
     * applyGlobalSearch
     *
     * @function applyGlobalSearch
     * @param {string} query
     * @returns {void}
     */
    const applyGlobalSearch = (query) => {
        logger.info("applyGlobalSearch", { query });

        setFiltersState({
            company: "all",
            status: "all",
            client: "all",
        });

        filters.setCompanyFilter("all");
        filters.setClientFilter("all");
        filters.setStatusFilter("all");
        filters.setSortKey(DEFAULT_SORT_KEY);
        filters.setPage(1);
        filters.setPageSize(DEFAULT_PAGE_SIZE);

        setHasGlobalFilterApplied(false);
        setFirstGlobalFilterKey(null);
        setScopedClients([]);
        setBaseJobs([]);

        setGlobalSearchQuery(query || "");

        pagination.resetPagination();
        setServerPage(1);
    };

    // ---- Meta derived values ----
    const totalJobs = serverMeta?.totalRecords ?? baseTotalJobs;
    const totalPages = pagination.totalPages;
    const currentPage = pagination.page;

    return {
        // placeholder (passthrough for UI)
        placeholder,

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

        // global search entrypoint
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

        // create job modal
        isCreateJobModalOpen: createJobModal.open,
        openCreateJobModal: createJobModal.openModal,
        closeCreateJobModal: createJobModal.closeModal,
        createJobStatus: createJobModal.status,
        createJobError: createJobModal.error,
        handleCreateJob: createJobModal.handleCreateJob,
    };
};

export default useJobSearchBox;

