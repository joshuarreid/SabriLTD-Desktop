/**
 * useJobScreen.js
 *
 * Top-level orchestration hook for the JobScreen route.
 *
 * Responsibilities:
 * - Own server-side pagination state (centralized in useJobScreenPagination).
 * - Call useJobSearch to fetch jobs + server metadata.
 * - Call useJobFilters to manage local search/filter/sort/pagination
 *   over the current server page of jobs.
 * - Reconcile server meta (totalJobs/totalPages/currentPage) with local state.
 */

import { useMemo, useState } from "react";
import {
    useJobFilters,
    DEFAULT_SORT_KEY,
    DEFAULT_PAGE_SIZE,
} from "./useJobFilters";
import { useJobSearch } from "./useJobSearch";
import { useJobScreenPagination } from "./useJobScreenPagination";

const logger = {
    info: (...args) => console.log("[useJobScreen]", ...args),
    error: (...args) => console.error("[useJobScreen]", ...args),
};

export const useJobScreen = () => {
    logger.info("useJobScreen initialized");

    // --- Global filters that should be reflected in server calls ---
    /** @type {[string, Function]} */
    const [companyFilter, setCompanyFilter] = useState("all");
    /** @type {[string, Function]} */
    const [statusFilter, setStatusFilter] = useState("all");
    /** @type {[string, Function]} */
    const [clientFilter, setClientFilter] = useState("all");
    /** @type {[string, Function]} */
    const [sortKey, setSortKey] = useState(DEFAULT_SORT_KEY);

    // Centralized pagination hook for JobScreen
    const pagination = useJobScreenPagination({
        initialPage: 1,
        initialPageSize: DEFAULT_PAGE_SIZE,
    });

    // If you want "client search" to be special (server-wide search), toggle this:
    const clientSearchMode = false; // set true if you want searchJobs(q=clientFilter)

    // --- Server data: jobs + metadata + server-driven filter options ---
    const {
        jobs: serverJobs,
        totalJobs: serverTotalJobs,
        totalPages: serverTotalPages,
        currentPage: serverCurrentPage,
        isPending,
        isError,
        error,
        companyOptionsFromServer,
        clientOptionsFromServer,
    } = useJobSearch({
        companyFilter,
        statusFilter,
        clientFilter,
        sortKey,
        page: pagination.page,
        pageSize: pagination.pageSize,
        clientSearchMode,
    });

    // --- Local filters/search/sort/pagination over current server page ---
    const filters = useJobFilters(serverJobs, {
        initialSortKey: sortKey,
        initialPageSize: serverJobs.length || DEFAULT_PAGE_SIZE,
    });

    // Keep sortKey in sync with local sort changes if desired
    const handleSetSortKey = (value) => {
        setSortKey(value);
        filters.setSortKey(value);
        filters.setPage(1);
        pagination.setPage(1);
    };

    // Company/client options: prefer server options if available
    const companyOptions = useMemo(
        () => companyOptionsFromServer || filters.companyOptions,
        [companyOptionsFromServer, filters.companyOptions],
    );

    const clientOptions = useMemo(
        () => clientOptionsFromServer || filters.clientOptions,
        [clientOptionsFromServer, filters.clientOptions],
    );

    // Global reset: filters + server pagination
    const handleResetFilters = () => {
        logger.info("useJobScreen handleResetFilters called");
        filters.handleResetFilters();
        setCompanyFilter("all");
        setStatusFilter("all");
        setClientFilter("all");
        setSortKey(DEFAULT_SORT_KEY);
        pagination.resetPagination();
    };

    // Map server pagination/meta into what the UI expects
    const totalJobs = serverTotalJobs ?? filters.totalJobs;
    const totalPages = serverTotalPages ?? filters.totalPages;
    const currentPage = serverCurrentPage ?? pagination.page;

    return {
        // jobs (use paginatedJobs for rendering grid)
        jobs: filters.jobs,
        filteredAndSortedJobs: filters.filteredAndSortedJobs,
        paginatedJobs: filters.paginatedJobs,

        // loading / error
        isPending,
        isError,
        error,

        // search & filters (UI state)
        search: filters.search,
        searchInput: filters.searchInput,
        sortKey,
        companyFilter,
        clientFilter,
        statusFilter,

        // setters for search/filters
        setSearch: filters.setSearch,
        setSearchInput: filters.setSearchInput,
        setSortKey: handleSetSortKey,
        setCompanyFilter: (value) => {
            const normalized = value || "all";
            setCompanyFilter(normalized);
            filters.setCompanyFilter(normalized);
            filters.setPage(1);
            pagination.setPage(1);
        },
        setClientFilter: (value) => {
            const normalized = value || "all";
            setClientFilter(normalized);
            filters.setClientFilter(normalized);
            filters.setPage(1);
            pagination.setPage(1);
        },
        setStatusFilter: (value) => {
            const normalized = value || "all";
            setStatusFilter(normalized);
            filters.setStatusFilter(normalized);
            filters.setPage(1);
            pagination.setPage(1);
        },

        // pagination (centralized via useJobScreenPagination)
        page: currentPage,
        pageSize: pagination.pageSize,
        setPage: pagination.setPage,
        setPageSize: pagination.setPageSize,
        hasPrevious: pagination.hasPrevious,
        hasNext: pagination.hasNext,
        handlePageChange: pagination.handlePageChange,
        handleNextPage: pagination.handleNext,
        handlePreviousPage: pagination.handlePrevious,
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
    };
};

export default useJobScreen;