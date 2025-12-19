/**
 * useJobScreen.js
 *
 * Business logic and UI state for the JobScreen.
 * - Loads jobs via TanStack Query (getAllJobs).
 * - Manages client-side search, sort, and filter state (company/status).
 * - Exposes a filtered & sorted jobs list for the presentational JobScreen.
 *
 * Follows the same design patterns as useCompanySettingsTab (single hook that
 * owns data fetching, keys, and view-model state).
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
 * @constant
 * @type {Array<{ key: string, label: string }>}
 */
const SORT_OPTIONS = [
    { key: "name-asc", label: "Name (A → Z)" },
    { key: "name-desc", label: "Name (Z → A)" },
    { key: "date-desc", label: "Date Added (newest)" },
    { key: "date-asc", label: "Date Added (oldest)" },
    { key: "status-asc", label: "Status (A → Z)" },
    { key: "status-desc", label: "Status (Z → A)" },
];

/**
 * useJobScreen
 *
 * Encapsulates state and derived values for JobScreen:
 * - Fetches jobs from the real Job API via React Query.
 * - Owns search text, sort key, company & status filters.
 * - Computes dropdown option lists and filtered/sorted jobs.
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
    const [sortKey, setSortKey] = useState("name-asc");

    /**
     * companyFilter
     * Current company filter, "all" or a specific company name.
     *
     * @type {[string, Function]}
     */
    const [companyFilter, setCompanyFilter] = useState("all");

    /**
     * statusFilter
     * Current status filter, "all" or a specific status string.
     *
     * @type {[string, Function]}
     */
    const [statusFilter, setStatusFilter] = useState("all");

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
     * Derived list of unique company names for the Company filter dropdown.
     * Uses job.client as the display field (per JobResponse spec).
     *
     * @type {Array<{value:string,label:string}>}
     */
    const companyOptions = useMemo(() => {
        const setCompanies = new Set();
        (jobs || []).forEach((job) => {
            if (job.client) {
                setCompanies.add(job.client);
            }
        });
        return [
            { value: "all", label: "All" },
            ...Array.from(setCompanies)
                .sort()
                .map((c) => ({ value: c, label: c })),
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

    // --- Derived data: filtered + sorted jobs ---

    /**
     * filteredAndSortedJobs
     * Applies search, company/status filters, and sorting to the jobs array.
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
                companyFilter === "all" || job.client === companyFilter;

            const matchesStatus =
                statusFilter === "all" || job.status === statusFilter;

            return matchesSearch && matchesCompany && matchesStatus;
        });

        const [field, dir] = String(sortKey || "").split("-");
        const result = [...baseFiltered];

        result.sort((a, b) => {
            if (field === "name") {
                const aa = String(a.name || "").toLowerCase();
                const bb = String(b.name || "").toLowerCase();
                return dir === "asc" ? aa.localeCompare(bb) : bb.localeCompare(aa);
            }
            if (field === "date") {
                const da = a.dateAdded ? new Date(a.dateAdded).getTime() : 0;
                const db = b.dateAdded ? new Date(b.dateAdded).getTime() : 0;
                return dir === "asc" ? da - db : db - da;
            }
            if (field === "status") {
                const sa = String(a.status || "").toLowerCase();
                const sb = String(b.status || "").toLowerCase();
                return dir === "asc" ? sa.localeCompare(sb) : sb.localeCompare(sa);
            }
            return 0;
        });

        return result;
    }, [jobs, search, companyFilter, statusFilter, sortKey]);

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
        statusFilter,

        // setters
        setSearch,
        setSortKey,
        setCompanyFilter,
        setStatusFilter,

        // dropdown options
        sortOptionsForDropdown,
        companyOptions,
        statusOptions,

        // derived list for UI
        filteredAndSortedJobs,
    };
};

export default useJobScreen;