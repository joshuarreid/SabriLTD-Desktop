/**
 * useJobFilterAndSearch.js
 *
 * Encapsulates all filter, search, sort, and pagination logic for the JobScreen.
 * This hook is UI‑agnostic and can be reused by other job list views.
 *
 * Responsibilities:
 * - Manage local UI state: searchInput, search, filters, sortKey, page, pageSize.
 * - Apply local filtering, sorting, and pagination over the provided jobs array.
 * - Expose derived metadata (totalJobs, totalPages, currentPage).
 */

import { useMemo, useState } from "react";

/**
 * logger for useJobFilterAndSearch hook.
 *
 * @constant
 * @type {{info: Function, error: Function}}
 */
const logger = {
    info: (...args) => console.log("[useJobFilterAndSearch]", ...args),
    error: (...args) => console.error("[useJobFilterAndSearch]", ...args),
};

/**
 * DEFAULT_SORT_KEY
 * - Default sort key for jobs grids using this hook.
 *   Per JobScreen requirements this is "Date Modified" (modified-desc).
 *
 * @constant
 * @type {string}
 */
export const DEFAULT_SORT_KEY = "modified-desc";

/**
 * DEFAULT_PAGE_SIZE
 * - Default number of jobs per page for pagination.
 *
 * @constant
 * @type {number}
 */
export const DEFAULT_PAGE_SIZE = 25;

/**
 * SORT_OPTIONS
 * - Sort options usable by dropdowns when consuming this hook.
 *
 * @constant
 * @type {Array<{ key: string, label: string }>}
 */
export const SORT_OPTIONS = [
    { key: "modified-desc", label: "Date Modified" },
    { key: "date-desc", label: "Newest" },
    { key: "date-asc", label: "Oldest" },
];

/**
 * deriveSortParams
 * - Maps internal sortKey to normalized sort params.
 *
 * @function deriveSortParams
 * @param {string} sortKey
 * @returns {{ field: string|null, direction: 'asc'|'desc'}}
 */
const deriveSortParams = (sortKey) => {
    if (!sortKey) return { field: null, direction: "desc" };

    const [field, dirRaw] = String(sortKey).split("-");
    const direction = dirRaw === "asc" ? "asc" : "desc";

    if (field === "date") {
        return { field: "dateAdded", direction };
    }
    if (field === "modified") {
        return { field: "dateUpdatedOrAdded", direction };
    }

    // Fallback to name sort
    return { field: "name", direction };
};

/**
 * useJobFilterAndSearch
 * - Pure client-side filter/search/sort/pagination over a jobs collection.
 *
 * NOTE:
 * - This hook does NOT perform any data fetching.
 *   The caller (e.g. useJobScreen) is responsible for providing the base jobs array.
 *
 * @function useJobFilterAndSearch
 * @param {Array<{
 *   jobId: number,
 *   name?: string,
 *   companyId?: number,
 *   client?: string|null,
 *   description?: string|null,
 *   status?: string|null,
 *   dateAdded?: string|null,
 *   dateUpdated?: string|null
 * }>} jobs - Source jobs to filter & page over.
 * @param {object} [options]
 * @param {string} [options.initialSortKey=DEFAULT_SORT_KEY] - Initial sort key.
 * @param {number} [options.initialPageSize=DEFAULT_PAGE_SIZE] - Initial page size.
 * @returns {object} Filter/search/sort/pagination API.
 */
export const useJobFilterAndSearch = (
    jobs,
    { initialSortKey = DEFAULT_SORT_KEY, initialPageSize = DEFAULT_PAGE_SIZE } = {},
) => {
    logger.info("useJobFilterAndSearch initialized", {
        initialSortKey,
        initialPageSize,
    });

    /** @type {[string, Function]} */
    const [searchInput, setSearchInput] = useState("");

    /** @type {[string, Function]} */
    const [search, setSearch] = useState("");

    /** @type {[string, Function]} */
    const [sortKey, setSortKey] = useState(initialSortKey);

    /** @type {[string, Function]} */
    const [companyFilter, setCompanyFilter] = useState("all");

    /** @type {[string, Function]} */
    const [statusFilter, setStatusFilter] = useState("all");

    /** @type {[string, Function]} */
    const [clientFilter, setClientFilter] = useState("all");

    /** @type {[number, Function]} */
    const [page, setPage] = useState(1);

    /** @type {[number, Function]} */
    const [pageSize, setPageSize] = useState(initialPageSize);

    const trimmedSearch = search.trim();

    /** @type {{field:string|null,direction:'asc'|'desc'}} */
    const sortParams = useMemo(
        () => deriveSortParams(sortKey),
        [sortKey],
    );

    /**
     * sortOptionsForDropdown
     * - Convenience mapping into {value,label} for dropdowns.
     *
     * @type {Array<{value:string,label:string}>}
     */
    const sortOptionsForDropdown = useMemo(
        () => SORT_OPTIONS.map((opt) => ({ value: opt.key, label: opt.label })),
        [],
    );

    /**
     * companyOptions
     * - Derived from current jobs (by companyId) for dropdowns.
     *
     * @type {Array<{value:string,label:string}>}
     */
    const companyOptions = useMemo(() => {
        const ids = new Set();
        (jobs || []).forEach((job) => {
            if (job.companyId !== null && job.companyId !== undefined) {
                ids.add(String(job.companyId));
            }
        });

        return [
            { value: "all", label: "All Companies" },
            ...Array.from(ids)
                .sort((a, b) => Number(a) - Number(b))
                .map((id) => ({ value: id, label: id })),
        ];
    }, [jobs]);

    /**
     * clientOptions
     * - Unique clients from current jobs.
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
     * - Unique statuses from current jobs.
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

    /**
     * filteredAndSortedJobs
     * - Applies text search, filters and sort against the incoming jobs.
     *
     * @type {Array}
     */
    const filteredAndSortedJobs = useMemo(() => {
        if (!Array.isArray(jobs) || jobs.length === 0) return [];

        const q = trimmedSearch.toLowerCase();

        const baseFiltered = jobs.filter((job) => {
            const matchesSearch =
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

        const { field, direction } = sortParams;
        const result = [...baseFiltered];

        result.sort((a, b) => {
            if (field === "dateAdded") {
                const da = a.dateAdded ? new Date(a.dateAdded).getTime() : 0;
                const db = b.dateAdded ? new Date(b.dateAdded).getTime() : 0;
                return direction === "asc" ? da - db : db - da;
            }

            if (field === "dateUpdatedOrAdded") {
                const modifiedA = a.dateUpdated || a.dateAdded;
                const modifiedB = b.dateUpdated || b.dateAdded;
                const da = modifiedA ? new Date(modifiedA).getTime() : 0;
                const db = modifiedB ? new Date(modifiedB).getTime() : 0;
                return direction === "asc" ? da - db : db - da;
            }

            // default to name
            const aa = String(a.name || "").toLowerCase();
            const bb = String(b.name || "").toLowerCase();
            return direction === "asc" ? aa.localeCompare(bb) : bb.localeCompare(aa);
        });

        return result;
    }, [
        jobs,
        trimmedSearch,
        companyFilter,
        clientFilter,
        statusFilter,
        sortParams,
    ]);

    /**
     * totalJobs
     * - Total count after filtering.
     *
     * @type {number}
     */
    const totalJobs = useMemo(
        () => filteredAndSortedJobs.length,
        [filteredAndSortedJobs],
    );

    /**
     * totalPages
     * - Total pages given pageSize and totalJobs.
     *
     * @type {number}
     */
    const totalPages = useMemo(() => {
        if (totalJobs === 0) return 1;
        return Math.max(1, Math.ceil(totalJobs / pageSize));
    }, [totalJobs, pageSize]);

    /**
     * currentPage
     * - Page number clamped to a valid range.
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
     * - Slice of filteredAndSortedJobs for the current page.
     *
     * @type {Array}
     */
    const paginatedJobs = useMemo(() => {
        if (filteredAndSortedJobs.length === 0) return [];

        const start = (currentPage - 1) * pageSize;
        const end = start + pageSize;
        return filteredAndSortedJobs.slice(start, end);
    }, [filteredAndSortedJobs, currentPage, pageSize]);

    /**
     * handleResetFilters
     * - Resets filters, search text, sort, and pagination to defaults.
     *
     * @function handleResetFilters
     * @returns {void}
     */
    const handleResetFilters = () => {
        logger.info("useJobFilterAndSearch handleResetFilters");
        setSearchInput("");
        setSearch("");
        setCompanyFilter("all");
        setClientFilter("all");
        setStatusFilter("all");
        setSortKey(DEFAULT_SORT_KEY);
        setPage(1);
        setPageSize(DEFAULT_PAGE_SIZE);
    };

    return {
        // raw jobs input
        jobs,

        // state
        search,
        searchInput,
        sortKey,
        companyFilter,
        clientFilter,
        statusFilter,
        page,
        pageSize,

        // setters
        setSearch,
        setSearchInput,
        setSortKey,
        setCompanyFilter,
        setClientFilter,
        setStatusFilter,
        setPage,
        setPageSize,

        // options for dropdowns
        sortOptionsForDropdown,
        companyOptions,
        clientOptions,
        statusOptions,

        // derived collections
        filteredAndSortedJobs,
        paginatedJobs,

        // meta
        totalJobs,
        totalPages,
        currentPage,

        // actions
        handleResetFilters,
    };
};

export default useJobFilterAndSearch;