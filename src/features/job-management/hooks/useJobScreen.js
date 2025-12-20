/**
 * useJobScreen.js
 *
 * Data-fetching and global filter/search orchestration for the JobScreen.
 *
 * Responsibilities:
 * - Load the base jobs collection from the Job API (getAllJobs).
 * - Load the unique companies list (GET /api/jobs/companies) for the Company dropdown.
 * - Expose a stable jobs array to UI hooks without causing full-screen remounts.
 * - Delegate all local filter/search/sort/pagination behavior to useJobFilterAndSearch.
 */

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getAllJobs, getJobCompanies } from "../../../api/job/job";
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
 * useJobScreen
 * - Top-level hook for the JobScreen route.
 * - Fetches jobs and unique companies once, then hands control to
 *   useJobFilterAndSearch for client-side filtering/searching.
 *
 * NOTE:
 * - There is no server-side search or global refetching per filter; the
 *   current design intentionally mirrors the WideSearchBar behavior where
 *   the outer layout stays mounted and only the grid animates as results
 *   change.
 *
 * @function useJobScreen
 * @returns {object} Aggregated JobScreen state, options, and derived lists.
 */
export const useJobScreen = () => {
    logger.info("useJobScreen initialized");

    /**
     * baseJobs
     * - Local copy of jobs used as the source array for filtering.
     *   We keep this in state so that in the future, if we introduce
     *   background refetches, we can update it without changing the
     *   hook API exposed to JobScreen.
     *
     * @type {[Array, Function]}
     */
    const [baseJobs, setBaseJobs] = useState([]);

    /**
     * jobsQuery
     * - Initial and canonical jobs fetch.
     * - Uses Job API "Get Jobs" endpoint with default params.
     */
    const {
        data: jobsResponse,
        isPending: isPendingJobs,
        isError: isErrorJobs,
        error: errorJobs,
    } = useQuery({
        queryKey: jobKeys.lists(),
        queryFn: async () => {
            logger.info("useJobScreen jobs queryFn called");
            const response = await getAllJobs();
            const jobsArray = Array.isArray(response?.data) ? response.data : [];
            logger.info("useJobScreen jobs queryFn success", {
                count: jobsArray.length,
            });
            return jobsArray;
        },
    });

    /**
     * uniqueCompaniesQuery
     * - Loads the de-duplicated list of companies that have at least one job.
     * - Used to populate the Company dropdown with human‑readable names.
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
     * Effect: synchronize baseJobs from the jobs query.
     * We keep this logic in an effect so that if the jobs query refetches
     * (e.g. window focus), the filter/search layer automatically benefits
     * without JobScreen needing to know about it.
     */
    useEffect(() => {
        if (Array.isArray(jobsResponse)) {
            logger.info("useJobScreen syncing baseJobs from jobsResponse", {
                count: jobsResponse.length,
            });
            setBaseJobs(jobsResponse);
        }
    }, [jobsResponse]);

    /**
     * isPending
     * - Top-level pending flag for the screen.
     * - We only hard-block while the very first jobs load is in-flight;
     *   subsequent background refetches could be surfaced via a lighter
     *   hint if needed.
     *
     * @type {boolean}
     */
    const isPending = isPendingJobs;

    /**
     * Combined error state from jobs & unique companies queries.
     */
    const isError = Boolean(isErrorJobs || isErrorCompanies);
    const error = errorJobs || errorCompanies;

    // --- Local filter/search/sort/pagination over baseJobs ---

    /**
     * filterAndSearch
     * - Local UI state and derived collections driven by useJobFilterAndSearch.
     * - This hook is pure client-side: it does not perform any data fetching.
     */
    const filterAndSearch = useJobFilterAndSearch(baseJobs, {
        initialSortKey: DEFAULT_SORT_KEY,
        initialPageSize: DEFAULT_PAGE_SIZE,
    });

    /**
     * companyOptions
     * - Company filter dropdown options built from UniqueCompanyResponse list.
     *   Uses companyId as the value and companyName as the label.
     *   These options replace the ID-based options from useJobFilterAndSearch.
     *
     * @type {Array<{value:string,label:string}>}
     */
    const companyOptions = (() => {
        if (!Array.isArray(uniqueCompanies) || uniqueCompanies.length === 0) {
            // Fallback to "All" only; user can still filter locally if needed.
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
    })();

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
        handleResetFilters: filterAndSearch.handleResetFilters,

        // dropdown options (note: companyOptions overridden with API-backed names)
        sortOptionsForDropdown: filterAndSearch.sortOptionsForDropdown,
        companyOptions,
        clientOptions: filterAndSearch.clientOptions,
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