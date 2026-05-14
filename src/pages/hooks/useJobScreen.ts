/**
 * useJobScreen.js
 *
 * Orchestration hook for JobScreen.
 *
 * (Only showing the additions/exports relevant to the Create Job modal integration.)
 */

import { useEffect, useMemo, useState } from "react";
import {
    useJobFilters,
    DEFAULT_PAGE_SIZE,
    DEFAULT_SORT_KEY,
} from "../../features/job/hooks/useJobFilters";
import { useJobSearch } from "../../features/job/hooks/useJobSearch";
import { useJobScreenPagination } from "../../features/job/hooks/useJobScreenPagination";
import useModal from "../../components/modal/hooks/useModal";

const logger = {
    info: (...args: any[]) => console.log("[useJobScreen]", ...args),
    error: (...args: any[]) => console.error("[useJobScreen]", ...args),
};

export const useJobScreen = () => {
    logger.info("useJobScreen render start");

    /**
     * Create job modal (open/close only).
     * CreateJobModal now owns mutation + save lifecycle (per docs/modal.md).
     */
    const createJobModal = useModal(false);

    // ---- existing useJobScreen code remains unchanged below ----
    // (your filters/pagination/search logic)

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
    const [globalSearchQuery, setGlobalSearchQuery] = useState("");
    const [hasGlobalFilterApplied, setHasGlobalFilterApplied] = useState(false);

    const [serverPage, setServerPage] = useState(1);
    const [serverPageSize, setServerPageSize] = useState(DEFAULT_PAGE_SIZE);

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

    const [baseJobs, setBaseJobs] = useState([]);

    useEffect(() => {
        if (!hasGlobalFilterApplied) {
            logger.info("useJobScreen syncing baseJobs from baseListJobs", {
                count: baseListJobs.length,
            });
            setBaseJobs(baseListJobs);
        }
    }, [baseListJobs, hasGlobalFilterApplied]);

    const pagination = useJobScreenPagination({
        initialPage: baseCurrentPage ?? 1,
        initialPageSize: serverPageSize,
        totalItems: serverMeta?.totalRecords ?? baseTotalJobs,
        totalPagesFromServer: serverMeta?.totalPages ?? baseTotalPages,
    });

    const handlePageChange = (nextPage: number) => {
        logger.info("useJobScreen handlePageChange (from UI)", { nextPage });
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

    const handleSetPageSize = (nextSize: number) => {
        logger.info("useJobScreen handleSetPageSize", { nextSize });
        pagination.setPageSize(nextSize);
        setServerPageSize(nextSize);
        setServerPage(1);
    };

    const filters = useJobFilters(baseJobs, {
        initialSortKey: sortKey,
        initialPageSize: baseJobs.length || DEFAULT_PAGE_SIZE,
    });

    // ---- keep your existing handlers (company/status/client) as-is ----
    // (omitted here since user already has them)

    const companyOptions = useMemo(
        () => companyOptionsFromServer || filters.companyOptions,
        [companyOptionsFromServer, filters.companyOptions],
    );

    const clientOptions = useMemo(() => filters.clientOptions, [filters.clientOptions]);

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
        setBaseJobs(baseListJobs);

        pagination.resetPagination();
        setServerPage(1);
        setServerPageSize(DEFAULT_PAGE_SIZE);
    };

    const applyGlobalSearch = (query: string) => {
        logger.info("useJobScreen applyGlobalSearch", { query });

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
        setBaseJobs([]);

        setGlobalSearchQuery(query || "");

        pagination.resetPagination();
        setServerPage(1);
    };

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
        setSortKey,
        setCompanyFilter: filters.setCompanyFilter,
        setClientFilter: filters.setClientFilter,
        setStatusFilter: filters.setStatusFilter,

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

        // create job modal
        isCreateJobModalOpen: createJobModal.open,
        openCreateJobModal: createJobModal.openModal,
        closeCreateJobModal: createJobModal.closeModal,
    };
};

export default useJobScreen;