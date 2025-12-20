/**
 * useJobScreen.js
 *
 * Business logic and UI state for the JobScreen.
 * - Loads jobs via TanStack Query (getAllJobs).
 * - Uses server-side search via /api/jobs/search when search text is submitted (Enter).
 * - Manages client-side sort and filter state (company/status/client).
 * - Manages simple client-side pagination (page, pageSize) over the active dataset.
 */

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getAllJobs, searchJobs } from "../../../api/job/job";
import { jobKeys } from "../../../api/job/jobQueryKeys";

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
 * SORT_OPTIONS
 * - Sort options for the "Sort by" dropdown.
 *
 * @constant
 * @type {Array<{ key: string, label: string }>}
 */
const SORT_OPTIONS = [
    { key: "date-desc", label: "Newest" },
    { key: "date-asc", label: "Oldest" },
    { key: "modified-desc", label: "Date Modified" },
];

/**
 * DEFAULT_PAGE_SIZE
 * - Default number of jobs per page for JobScreen pagination.
 *
 * @constant
 * @type {number}
 */
const DEFAULT_PAGE_SIZE = 50;

/**
 * deriveSortParams
 * Maps internal sortKey to API sort parameters for the search endpoint.
 *
 * @function deriveSortParams
 * @param {string} sortKey - Current sort key (e.g., "date-desc", "modified-desc").
 * @returns {{ sortField: (string|undefined), sortOrder: ('asc'|'desc'|undefined) }} Derived sort field and order.
 */
const deriveSortParams = (sortKey) => {
    if (!sortKey) return { sortField: undefined, sortOrder: undefined };

    const [field, dirRaw] = String(sortKey).split("-");
    const dir = dirRaw === "asc" ? "asc" : "desc";

    if (field === "date") {
        return { sortField: "dateAdded", sortOrder: dir };
    }
    if (field === "modified") {
        return { sortField: "dateUpdated", sortOrder: dir };
    }

    // Fallback: allow backend to use its own default sort
    return { sortField: undefined, sortOrder: undefined };
};

/**
 * useJobScreen
 *
 * Main hook encapsulating data fetching, server-side search, filters, sort,
 * and pagination behavior for the jobs screen.
 *
 * @function useJobScreen
 * @returns {object} Hook API consumed by JobScreen.jsx.
 */
export const useJobScreen = () => {
    logger.info("useJobScreen initialized");

    // --- Query: load all jobs once (V8 behavior) ---

    /**
     * Base list query:
     * - Loads all jobs with a single call to getAllJobs().
     * - All filtering/sorting/pagination for non-search mode is client-side.
     */
    const {
        data: baseJobs = [],
        isPending: isPendingList,
        isError: isErrorList,
        error: errorList,
    } = useQuery({
        queryKey: jobKeys.lists(),
        queryFn: () => {
            logger.info("useJobScreen base list queryFn called");
            return getAllJobs();
        },
    });

    // --- Local UI state ---

    /**
     * searchInput
     * - Current value in the search input field (NOT yet applied until Enter).
     *
     * @type {[string, Function]}
     */
    const [searchInput, setSearchInput] = useState("");

    /**
     * search
     * - Active search text that has been "applied" (e.g., via Enter key).
     * - Only this value triggers server-side /api/jobs/search.
     *
     * @type {[string, Function]}
     */
    const [search, setSearch] = useState("");

    /**
     * sortKey
     * - Current sort key (one of SORT_OPTIONS keys).
     *
     * @type {[string, Function]}
     */
    const [sortKey, setSortKey] = useState("date-desc");

    /**
     * companyFilter
     * - "all" or a specific companyId (stringified).
     *
     * @type {[string, Function]}
     */
    const [companyFilter, setCompanyFilter] = useState("all");

    /**
     * clientFilter
     * - "all" or a specific client string.
     *
     * @type {[string, Function]}
     */
    const [clientFilter, setClientFilter] = useState("all");

    /**
     * statusFilter
     * - "all" or a specific job status string.
     *
     * @type {[string, Function]}
     */
    const [statusFilter, setStatusFilter] = useState("all");

    /**
     * page
     * - Current page index (1-based).
     *
     * @type {[number, Function]}
     */
    const [page, setPage] = useState(1);

    /**
     * pageSize
     * - Current page size (default 50).
     *
     * @type {[number, Function]}
     */
    const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

    /**
     * sortParams
     * - Derived server-side sort parameters from sortKey.
     *
     * @type {{sortField: (string|undefined), sortOrder: ('asc'|'desc'|undefined)}}
     */
    const sortParams = useMemo(
        () => deriveSortParams(sortKey),
        [sortKey],
    );

    const trimmedSearch = search.trim();
    const trimmedSearchInput = searchInput.trim();

    // --- Server search query (only when search text has been "applied") ---

    /**
     * searchJobsQuery
     * - Uses /api/jobs/search when search text has been applied.
     * - Does not run while user is still typing (only when trimmedSearch has content).
     */
    const {
        data: searchResponse,
        isPending: isPendingSearch,
        isError: isErrorSearch,
        error: errorSearch,
    } = useQuery({
        queryKey: jobKeys.search({
            q: trimmedSearch || null,
            page,
            size: pageSize,
            sortField: sortParams.sortField,
            sortOrder: sortParams.sortOrder,
        }),
        queryFn: async () => {
            logger.info("useJobScreen search queryFn called", {
                q: trimmedSearch,
                page,
                size: pageSize,
                sortField: sortParams.sortField,
                sortOrder: sortParams.sortOrder,
            });

            const params = {
                q: trimmedSearch,
                page,
                size: pageSize,
                sortField: sortParams.sortField,
                sortOrder: sortParams.sortOrder,
            };

            const response = await searchJobs(params);
            logger.info("useJobScreen search queryFn success", {
                count: Array.isArray(response?.data) ? response.data.length : 0,
                meta: response?.meta,
            });
            return response;
        },
        enabled: trimmedSearch.length > 0, // only hit API when a search is actually applied
        keepPreviousData: true,
    });

    /**
     * isUsingSearch
     * - Indicates whether server-side search is currently active.
     *
     * @type {boolean}
     */
    const isUsingSearch = trimmedSearch.length > 0;

    /**
     * jobs
     * - Active job collection used for filtering & rendering.
     *   - Search mode: the current page from /api/jobs/search.
     *   - Non-search mode: base list from getAllJobs().
     *
     * @type {Array}
     */
    const jobs = useMemo(() => {
        if (isUsingSearch) {
            return Array.isArray(searchResponse?.data) ? searchResponse.data : [];
        }
        return Array.isArray(baseJobs) ? baseJobs : [];
    }, [isUsingSearch, searchResponse, baseJobs]);

    /**
     * isPending
     * - Controls initial full-screen loading state.
     * - We only block the whole screen while the base list is loading.
     *
     * @type {boolean}
     */
    const isPending = isPendingList;

    /**
     * isError
     * - Combined error flag that prefers search error when in search mode.
     *
     * @type {boolean}
     */
    const isError = isUsingSearch ? isErrorSearch : isErrorList;

    /**
     * error
     * - Combined error object from list or search queries (depending on mode).
     *
     * @type {Error | null | undefined}
     */
    const error = isUsingSearch ? errorSearch : errorList;

    // --- Options for dropdowns (derived from current jobs set) ---

    /**
     * sortOptionsForDropdown
     * - Sort options mapped into FilterDropdown shape.
     *
     * @type {Array<{value:string,label:string}>}
     */
    const sortOptionsForDropdown = useMemo(
        () => SORT_OPTIONS.map((opt) => ({ value: opt.key, label: opt.label })),
        [],
    );

    /**
     * companyOptions
     * - Unique companyId values for Company filter dropdown.
     *
     * @type {Array<{value:string,label:string}>}
     */
    const companyOptions = useMemo(() => {
        const setCompanyIds = new Set();
        (jobs || []).forEach((job) => {
            if (job.companyId !== null && job.companyId !== undefined) {
                setCompanyIds.add(String(job.companyId));
            }
        });

        return [
            { value: "all", label: "All" },
            ...Array.from(setCompanyIds)
                .sort((a, b) => Number(a) - Number(b))
                .map((id) => ({ value: id, label: id })),
        ];
    }, [jobs]);

    /**
     * clientOptions
     * - Unique client values for Client filter dropdown.
     *
     * @type {Array<{value:string,label:string}>}
     */
    const clientOptions = useMemo(() => {
        const setClients = new Set();
        (jobs || []).forEach((job) => {
            if (job.client) {
                setClients.add(job.client);
            }
        });

        return [
            { value: "all", label: "All" },
            ...Array.from(setClients)
                .sort()
                .map((client) => ({ value: client, label: client })),
        ];
    }, [jobs]);

    /**
     * statusOptions
     * - Unique status values for Status filter dropdown.
     *
     * @type {Array<{value:string,label:string}>}
     */
    const statusOptions = useMemo(() => {
        const setStatus = new Set();
        (jobs || []).forEach((job) => {
            if (job.status) {
                setStatus.add(job.status);
            }
        });
        return [
            { value: "all", label: "All" },
            ...Array.from(setStatus)
                .sort()
                .map((s) => ({ value: s, label: s })),
        ];
    }, [jobs]);

    // --- Derived data: filters, sort, pagination ---

    /**
     * filteredAndSortedJobs
     * - Applies search, filters, and sort.
     * - In search mode, text search is done server-side; we only apply filters.
     *
     * @type {Array}
     */
    const filteredAndSortedJobs = useMemo(() => {
        if (!Array.isArray(jobs) || jobs.length === 0) return [];

        const q = trimmedSearch.toLowerCase();

        const baseFiltered = jobs.filter((job) => {
            // When using server search, skip client text matching; we trust backend.
            const matchesSearch =
                isUsingSearch ||
                !q ||
                String(job.name || "").toLowerCase().includes(q) ||
                String(job.client || "").toLowerCase().includes(q) ||
                String(job.status || "").toLowerCase().includes(q) ||
                String(job.description || "").toLowerCase().includes(q);

            const matchesCompany =
                companyFilter === "all" ||
                String(job.companyId ?? "") === companyFilter;

            const matchesClient =
                clientFilter === "all" || job.client === clientFilter;

            const matchesStatus =
                statusFilter === "all" || job.status === statusFilter;

            return matchesSearch && matchesCompany && matchesClient && matchesStatus;
        });

        if (isUsingSearch) {
            // Respect backend ordering for search results
            return baseFiltered;
        }

        const [field, dirRaw] = String(sortKey || "").split("-");
        const dir = dirRaw || "desc";
        const result = [...baseFiltered];

        result.sort((a, b) => {
            if (field === "date") {
                const da = a.dateAdded ? new Date(a.dateAdded).getTime() : 0;
                const db = b.dateAdded ? new Date(b.dateAdded).getTime() : 0;
                return dir === "asc" ? da - db : db - da;
            }
            if (field === "modified") {
                const modifiedA = a.dateUpdated || a.dateAdded;
                const modifiedB = b.dateUpdated || b.dateAdded;
                const da = modifiedA ? new Date(modifiedA).getTime() : 0;
                const db = modifiedB ? new Date(modifiedB).getTime() : 0;
                return dir === "asc" ? da - db : db - da;
            }
            const aa = String(a.name || "").toLowerCase();
            const bb = String(b.name || "").toLowerCase();
            return dir === "asc" ? aa.localeCompare(bb) : bb.localeCompare(aa);
        });

        return result;
    }, [
        jobs,
        trimmedSearch,
        isUsingSearch,
        companyFilter,
        clientFilter,
        statusFilter,
        sortKey,
    ]);

    /**
     * totalJobs
     * - Total count after filtering.
     * - In search mode, prefers backend meta.totalRecords if present.
     *
     * @type {number}
     */
    const totalJobs = useMemo(() => {
        if (isUsingSearch) {
            const metaTotal = searchResponse?.meta?.totalRecords;
            if (typeof metaTotal === "number") return metaTotal;
            return filteredAndSortedJobs.length;
        }
        return filteredAndSortedJobs.length;
    }, [isUsingSearch, searchResponse, filteredAndSortedJobs.length]);

    /**
     * totalPages
     * - Total pages given current pageSize and totalJobs.
     *
     * @type {number}
     */
    const totalPages = useMemo(() => {
        if (totalJobs === 0) return 1;
        return Math.max(1, Math.ceil(totalJobs / pageSize));
    }, [totalJobs, pageSize]);

    /**
     * currentPage
     * - Page number clamped to valid range (1..totalPages).
     *
     * @type {number}
     */
    const currentPage = useMemo(() => {
        if (page < 1) return 1;
        if (page > totalPages) return totalPages;
        return page;
    }, [page, totalPages]);

    /**
     * paginatedJobs
     * - Non-search mode: slice filteredAndSortedJobs for current page.
     * - Search mode: backend already paginates; we return filteredAndSortedJobs as-is.
     *
     * @type {Array}
     */
    const paginatedJobs = useMemo(() => {
        if (isUsingSearch) {
            // Search results are already paginated server-side
            return filteredAndSortedJobs;
        }

        if (filteredAndSortedJobs.length === 0) return [];

        const start = (currentPage - 1) * pageSize;
        const end = start + pageSize;
        return filteredAndSortedJobs.slice(start, end);
    }, [isUsingSearch, filteredAndSortedJobs, currentPage, pageSize]);

    /**
     * handleResetFilters
     * - Resets filters, search text, sort, and pagination to defaults.
     *
     * @function handleResetFilters
     * @returns {void}
     */
    const handleResetFilters = () => {
        logger.info("useJobScreen handleResetFilters");
        setSearchInput("");
        setSearch("");
        setCompanyFilter("all");
        setClientFilter("all");
        setStatusFilter("all");
        setSortKey("date-desc");
        setPage(1);
        setPageSize(DEFAULT_PAGE_SIZE);
    };

    // --- Public API ---

    return {
        // query base
        jobs,
        isPending,
        isError,
        error,

        // state
        search, // applied search text
        searchInput, // live text in input field
        sortKey,
        companyFilter,
        clientFilter,
        statusFilter,
        page,
        pageSize,

        // setters / actions
        setSearch, // apply search (used on Enter)
        setSearchInput, // update text as user types
        setSortKey,
        setCompanyFilter,
        setClientFilter,
        setStatusFilter,
        setPage,
        setPageSize,

        // dropdown options
        sortOptionsForDropdown,
        companyOptions,
        clientOptions,
        statusOptions,

        // derived lists
        filteredAndSortedJobs,
        paginatedJobs,

        // pagination meta
        totalJobs,
        totalPages,
        currentPage,

        // actions
        handleResetFilters,
    };
};

export default useJobScreen;