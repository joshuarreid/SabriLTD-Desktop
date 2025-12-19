/**
 * useJobScreen.js
 *
 * Business logic and UI state for the JobScreen wireframe.
 * - Holds mock jobs list (for now; can later be wired to real Job API).
 * - Manages search, filters (sort, company, status) and derived lists.
 * - Encapsulates all non-render logic so JobScreen.jsx stays presentational.
 */

import { useMemo, useState } from "react";

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
 * MOCK_JOBS
 * Wireframe-only job dataset used for layout and filtering demo.
 * Replace with real Job API results in a future iteration.
 *
 * @constant
 * @type {Array<{jobId:number, name:string, companyName?:string, status?:string, dateAdded?:string}>}
 */
const MOCK_JOBS = [
    { jobId: 401, name: "Annual Audit", companyName: "Acme Corp.", status: "Active", dateAdded: "2025-12-09T14:00:00Z" },
    { jobId: 402, name: "Inventory Count", companyName: "Globex", status: "Pending Storage", dateAdded: "2025-11-12T09:30:00Z" },
    { jobId: 403, name: "Warehouse Cleanup", companyName: "Initech", status: "Closed", dateAdded: "2025-10-02T08:15:00Z" },
    { jobId: 404, name: "Onboarding Project", companyName: "Umbrella", status: "Active", dateAdded: "2025-09-21T11:10:00Z" },
    { jobId: 405, name: "Q4 Reporting", companyName: "Wonka Industries", status: "Active", dateAdded: "2025-12-01T07:00:00Z" },
    { jobId: 406, name: "Compliance Review", companyName: "Acme Corp.", status: "Pending Storage", dateAdded: "2025-08-14T12:22:00Z" },
    { jobId: 407, name: "Safety Inspection", companyName: "Globex", status: "Closed", dateAdded: "2025-07-03T10:05:00Z" },
    { jobId: 408, name: "Site Survey", companyName: "Initech", status: "Active", dateAdded: "2025-12-05T14:55:00Z" },
    { jobId: 409, name: "Data Migration", companyName: "Umbrella", status: "Active", dateAdded: "2025-06-18T16:45:00Z" },
    { jobId: 410, name: "Retrospective", companyName: "Wonka Industries", status: "Closed", dateAdded: "2025-05-09T13:30:00Z" },
];

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
 * - search text
 * - sort key
 * - company & status filters
 * - computed dropdown option lists
 * - filtered & sorted jobs list
 *
 * @returns {object} Hook API consumed by JobScreen.jsx
 */
export const useJobScreen = () => {
    logger.info("useJobScreen initialized");

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
     * Current company filter, "all" or a specific companyName.
     *
     * @type {[string, Function]}
     */
    const [companyFilter, setCompanyFilter] = useState("all");

    /**
     * statusFilter
     * Current status filter, "all" or a specific status.
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
     * Derived list of unique companies for the Company filter dropdown.
     *
     * @type {Array<{value:string,label:string}>}
     */
    const companyOptions = useMemo(() => {
        const setCompanies = new Set();
        MOCK_JOBS.forEach((j) => {
            if (j.companyName) setCompanies.add(j.companyName);
        });
        return [
            { value: "all", label: "All companies" },
            ...Array.from(setCompanies)
                .sort()
                .map((c) => ({ value: c, label: c })),
        ];
    }, []);

    /**
     * statusOptions
     * Derived list of unique statuses for the Status filter dropdown.
     *
     * @type {Array<{value:string,label:string}>}
     */
    const statusOptions = useMemo(() => {
        const setStatus = new Set();
        MOCK_JOBS.forEach((j) => {
            if (j.status) setStatus.add(j.status);
        });
        return [
            { value: "all", label: "All statuses" },
            ...Array.from(setStatus)
                .sort()
                .map((s) => ({ value: s, label: s })),
        ];
    }, []);

    // --- Derived data: filtered + sorted jobs ---

    /**
     * filteredAndSortedJobs
     * Applies search, company/status filters, and sorting to the mock jobs.
     *
     * @type {Array<{jobId:number, name:string, companyName?:string, status?:string, dateAdded?:string}>}
     */
    const filteredAndSortedJobs = useMemo(() => {
        const q = search.trim().toLowerCase();

        const baseFiltered = MOCK_JOBS.filter((job) => {
            const matchesSearch =
                !q ||
                String(job.name || "").toLowerCase().includes(q) ||
                String(job.companyName || "").toLowerCase().includes(q) ||
                String(job.status || "").toLowerCase().includes(q);

            const matchesCompany =
                companyFilter === "all" || job.companyName === companyFilter;

            const matchesStatus =
                statusFilter === "all" || job.status === statusFilter;

            return matchesSearch && matchesCompany && matchesStatus;
        });

        const [field, dir] = sortKey.split("-");
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
    }, [search, companyFilter, statusFilter, sortKey]);

    // --- Public API ---

    return {
        // raw data (mock for now)
        jobs: MOCK_JOBS,

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

        // derived list
        filteredAndSortedJobs,
    };
};

export default useJobScreen;