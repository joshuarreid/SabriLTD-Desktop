/**
 * useJobScreen.js
 *
 * Orchestration hook for JobScreen.
 */

import { useMemo, useState, useEffect } from "react";
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
    logger.info("useJobScreen render start");

    // Global filters
    const [companyFilter, setCompanyFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");
    const [clientFilter, setClientFilter] = useState("all");
    const [sortKey, setSortKey] = useState(DEFAULT_SORT_KEY);

    // Server pagination (drives API)
    const [serverPage, setServerPage] = useState(1);
    const [serverPageSize, setServerPageSize] = useState(DEFAULT_PAGE_SIZE);

    const clientSearchMode = false;

    // Server data
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

    useEffect(() => {
        logger.info("useJobSearch snapshot", {
            serverPage,
            serverPageSize,
            serverCurrentPage,
            serverTotalJobs,
            serverTotalPages,
            jobsLength: serverJobs.length,
        });
    }, [
        serverPage,
        serverPageSize,
        serverCurrentPage,
        serverTotalJobs,
        serverTotalPages,
        serverJobs,
    ]);

    // Pagination informed by server meta
    const pagination = useJobScreenPagination({
        initialPage: serverCurrentPage ?? 1,
        initialPageSize: serverPageSize,
        totalItems: serverTotalJobs,
        totalPagesFromServer: serverTotalPages,
    });

    const handlePageChange = (nextPage) => {
        logger.info("useJobScreen handlePageChange (from UI)", {
            nextPage,
        });
        pagination.setPage(nextPage);   // updates local pagination
        setServerPage(nextPage);        // triggers new API call
    };

    const handleNextPage = () => {
        const next = pagination.page + 1;
        logger.info("useJobScreen handleNextPage", {
            current: pagination.page,
            next,
        });
        if (!pagination.hasNext) return;
        pagination.handleNext();        // updates local pagination
        setServerPage(next);            // triggers new API call
    };

    const handlePreviousPage = () => {
        const prev = pagination.page - 1;
        logger.info("useJobScreen handlePreviousPage", {
            current: pagination.page,
            prev,
        });
        if (!pagination.hasPrevious) return;
        pagination.handlePrevious();    // updates local pagination
        setServerPage(prev);            // triggers new API call
    };

    const handleSetPageSize = (nextSize) => {
        logger.info("useJobScreen handleSetPageSize", { nextSize });
        pagination.setPageSize(nextSize);
        setServerPageSize(nextSize);
        setServerPage(1);
    };

    // Local filters over current page
    const filters = useJobFilters(serverJobs, {
        initialSortKey: sortKey,
        initialPageSize: serverJobs.length || DEFAULT_PAGE_SIZE,
    });

    const handleSetSortKey = (value) => {
        logger.info("useJobScreen handleSetSortKey", { value });
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
        logger.info("useJobScreen handleResetFilters");
        filters.handleResetFilters();
        setCompanyFilter("all");
        setStatusFilter("all");
        setClientFilter("all");
        setSortKey(DEFAULT_SORT_KEY);

        pagination.resetPagination();
        setServerPage(1);
        setServerPageSize(DEFAULT_PAGE_SIZE);
    };

    const totalJobs = serverTotalJobs ?? filters.totalJobs;
    const totalPages = pagination.totalPages;
    const currentPage = pagination.page;

    useEffect(() => {
        logger.info("useJobScreen meta snapshot", {
            totalJobs,
            totalPages,
            currentPage,
            paginationPage: pagination.page,
            paginationTotalPages: pagination.totalPages,
            serverTotalJobs,
            serverTotalPages,
            serverCurrentPage,
        });
    }, [
        totalJobs,
        totalPages,
        currentPage,
        pagination.page,
        pagination.totalPages,
        serverTotalJobs,
        serverTotalPages,
        serverCurrentPage,
    ]);

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
            logger.info("useJobScreen setCompanyFilter", { normalized });
            setCompanyFilter(normalized);
            filters.setCompanyFilter(normalized);
            filters.setPage(1);
            handlePageChange(1);
        },
        setClientFilter: (value) => {
            const normalized = value || "all";
            logger.info("useJobScreen setClientFilter", { normalized });
            setClientFilter(normalized);
            filters.setClientFilter(normalized);
            filters.setPage(1);
            handlePageChange(1);
        },
        setStatusFilter: (value) => {
            const normalized = value || "all";
            logger.info("useJobScreen setStatusFilter", { normalized });
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