/**
 * useJobScreen.js
 *
 * Business logic and UI state for the JobScreen.
 * - Loads jobs via TanStack Query (getAllJobs).
 * - Manages client-side search, sort, and filter state (company/status/client).
 * - Manages simple client-side pagination (page, pageSize).
 * - Exposes a filtered, sorted, and paginated jobs list for JobScreen.
 *
 * Follows Bulletproof React conventions:
 *  - UI concerns live in JobScreen.jsx
 *  - Data/state and side effects live in this hook.
 */

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getAllJobs } from "../../../api/job/job";
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
 * Sort options for the "Sort by" dropdown.
 *
 * NOTE:
 *  - "Newest" / "Oldest" use dateAdded.
 *  - "Date Modified" uses dateUpdated with a fallback to dateAdded.
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
 * Default number of jobs per page for JobScreen pagination.
 *
 * @constant
 * @type {number}
 */
const DEFAULT_PAGE_SIZE = 50;

/**
 * useJobScreen
 *
 * Encapsulates state and derived values for JobScreen:
 * - Fetches jobs from the real Job API via React Query.
 * - Owns search text, sort key, company, client & status filters.
 * - Computes dropdown option lists and filtered/sorted jobs.
 * - Provides client-side pagination (page, pageSize).
 *
 * @returns {object} Hook API consumed by JobScreen.jsx
 */
export const useJobScreen = () => {
    logger.info("useJobScreen initialized");

    // --- Query: jobs list from real API ---

    /**
     * jobsQuery
     * Uses jobKeys.lists() as the canonical cache key and getAllJobs as the fetcher.
     * Currently no server-side filters; all filtering is done client-side.
     */
    const {
        data: jobs = [],
        isPending,
        isError,
        error,
    } = useQuery({
        queryKey: jobKeys.lists(),
        queryFn: () => getAllJobs(),
    });

    // --- Local UI state ---

    /**
     * search
     * Current search input value.
     *
     * @type {[string, Function]}
     */
    const [search, setSearch] = useState("");

    /**
     * sortKey
     * Current sort key, one of SORT_OPTIONS keys.
     *
     * @type {[string, Function]}
     */
    const [sortKey, setSortKey] = useState("date-desc");

    /**
     * companyFilter
     * Current company filter, "all" or a specific companyId (stringified).
     *
     * @type {[string, Function]}
     */
    const [companyFilter, setCompanyFilter] = useState("all");

    /**
     * clientFilter
     * Current client filter, "all" or a specific client string.
     *
     * @type {[string, Function]}
     */
    const [clientFilter, setClientFilter] = useState("all");

    /**
     * statusFilter
     * Current status filter, "all" or a specific status string.
     *
     * @type {[string, Function]}
     */
    const [statusFilter, setStatusFilter] = useState("all");

    /**
     * page
     * Current page index, 1-based.
     *
     * @type {[number, Function]}
     */
    const [page, setPage] = useState(1);

    /**
     * pageSize
     * Current page size. Default 50 per user requirements.
     *
     * @type {[number, Function]}
     */
    const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

    // --- Derived option lists for dropdowns ---

    /**
     * sortOptionsForDropdown
     * SORT_OPTIONS mapped into generic FilterDropdown option shape.
     *
     * @type {Array<{value:string,label:string}>}
     */
    const sortOptionsForDropdown = useMemo(
        () => SORT_OPTIONS.map((opt) => ({ value: opt.key, label: opt.label })),
        [],
    );

    /**
     * companyOptions
     * Derived list of unique companyId values for the Company filter dropdown.
     * Uses job.companyId (ID) as both value and label for now.
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
     * Derived list of unique clients for the Client filter dropdown.
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
     * Derived list of unique statuses for the Status filter dropdown.
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

    // --- Derived data: filtered + sorted jobs (before pagination) ---

    /**
     * filteredAndSortedJobs
     * Applies search, company/status/client filters, and sorting to the jobs array.
     *
     * @type {Array<{
     *   jobId:number,
     *   name:string,
     *   companyId:number,
     *   client:string|null,
     *   description:string|null,
     *   status:string|null,
     *   updatedBy:number|null,
     *   dateAdded:string,
     *   dateUpdated:string|null,
     *   comments:string|null
     * }>}
     */
    const filteredAndSortedJobs = useMemo(() => {
        if (!Array.isArray(jobs) || jobs.length === 0) {
            return [];
        }

        const q = search.trim().toLowerCase();

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
            // default fallback: name sort
            const aa = String(a.name || "").toLowerCase();
            const bb = String(b.name || "").toLowerCase();
            return dir === "asc" ? aa.localeCompare(bb) : bb.localeCompare(aa);
        });

        return result;
    }, [jobs, search, companyFilter, clientFilter, statusFilter, sortKey]);

    // --- Pagination over filtered+sorted list ---

    /**
     * totalJobs
     * Total count after filtering, before pagination.
     *
     * @type {number}
     */
    const totalJobs = filteredAndSortedJobs.length;

    /**
     * totalPages
     * Total pages given current pageSize.
     *
     * @type {number}
     */
    const totalPages = useMemo(() => {
        if (totalJobs === 0) return 1;
        return Math.max(1, Math.ceil(totalJobs / pageSize));
    }, [totalJobs, pageSize]);

    /**
     * currentPage
     * Page number clamped to valid range (1..totalPages).
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
     * Slice of filteredAndSortedJobs for the current page.
     *
     * @type {Array}
     */
    const paginatedJobs = useMemo(() => {
        if (totalJobs === 0) {
            return [];
        }
        const start = (currentPage - 1) * pageSize;
        const end = start + pageSize;
        return filteredAndSortedJobs.slice(start, end);
    }, [filteredAndSortedJobs, currentPage, pageSize, totalJobs]);

    /**
     * handleResetFilters
     * Resets filters, search, sort, and page to defaults.
     *
     * @function handleResetFilters
     * @returns {void}
     */
    const handleResetFilters = () => {
        logger.info("useJobScreen handleResetFilters");
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
        search,
        sortKey,
        companyFilter,
        clientFilter,
        statusFilter,
        page,
        pageSize,

        // setters
        setSearch,
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