/**
 * useJobScreen.js
 *
 * Top-level orchestration hook for the JobScreen route.
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
    const [companyFilter, setCompanyFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");
    const [clientFilter, setClientFilter] = useState("all");
    const [sortKey, setSortKey] = useState(DEFAULT_SORT_KEY);

    // --- Server pagination state that actually drives API queries ---
    const [serverPage, setServerPage] = useState(1);
    const [serverPageSize, setServerPageSize] = useState(DEFAULT_PAGE_SIZE);

    const clientSearchMode = false;

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
        page: serverPage,
        pageSize: serverPageSize,
        clientSearchMode,
    });

    // --- Centralized pagination, informed by server meta ---
    const pagination = useJobScreenPagination({
        initialPage: serverCurrentPage ?? 1,
        initialPageSize: serverPageSize,
        totalItems: serverTotalJobs,
        totalPagesFromServer: serverTotalPages,
    });

    // Sync pagination changes back to server state so queries refetch
    const handlePageChange = (nextPage) => {
        pagination.setPage(nextPage);
        setServerPage(nextPage);
    };

    const handleSetPageSize = (nextSize) => {
        pagination.setPageSize(nextSize);
        setServerPageSize(nextSize);
        setServerPage(1);
    };

    // --- Local filters/search/sort/pagination over current server page ---
    const filters = useJobFilters(serverJobs, {
        initialSortKey: sortKey,
        initialPageSize: serverJobs.length || DEFAULT_PAGE_SIZE,
    });

    const handleSetSortKey = (value) => {
        setSortKey(value);
        filters.setSortKey(value);
        filters.setPage(1);
        handlePageChange(1);
    };

    const companyOptions = useMemo(
        () => companyOptionsFromServer || filters.companyOptions,
        [companyOptionsFromServer, filters.companyOptions],
    );

    const clientOptions = useMemo(
        () => clientOptionsFromServer || filters.clientOptions,
        [clientOptionsFromServer, filters.clientOptions],
    );

    const handleResetFilters = () => {
        logger.info("useJobScreen handleResetFilters called");
        filters.handleResetFilters();
        setCompanyFilter("all");
        setStatusFilter("all");
        setClientFilter("all");
        setSortKey(DEFAULT_SORT_KEY);

        pagination.resetPagination();
        setServerPage(1);
        setServerPageSize(DEFAULT_PAGE_SIZE);
    };

    // Use server meta as the single source of truth for totals
    const totalJobs = serverTotalJobs ?? filters.totalJobs;
    const totalPages = pagination.totalPages; // <- from pagination (already based on serverTotalPages)
    const currentPage = pagination.page;      // <- from pagination

    return {
        // jobs
        jobs: filters.jobs,
        filteredAndSortedJobs: filters.filteredAndSortedJobs,
        paginatedJobs: filters.paginatedJobs,

        // loading / error
        isPending,
        isError,
        error,

        // filters
        search: filters.search,
        searchInput: filters.searchInput,
        sortKey,
        companyFilter,
        clientFilter,
        statusFilter,

        setSearch: filters.setSearch,
        setSearchInput: filters.setSearchInput,
        setSortKey: handleSetSortKey,
        setCompanyFilter: (value) => {
            const normalized = value || "all";
            setCompanyFilter(normalized);
            filters.setCompanyFilter(normalized);
            filters.setPage(1);
            handlePageChange(1);
        },
        setClientFilter: (value) => {
            const normalized = value || "all";
            setClientFilter(normalized);
            filters.setClientFilter(normalized);
            filters.setPage(1);
            handlePageChange(1);
        },
        setStatusFilter: (value) => {
            const normalized = value || "all";
            setStatusFilter(normalized);
            filters.setStatusFilter(normalized);
            filters.setPage(1);
            handlePageChange(1);
        },

        // pagination
        pageSize: pagination.pageSize,
        hasPrevious: pagination.hasPrevious,
        hasNext: pagination.hasNext,
        handlePageChange,
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