/**
 * JobScreen.jsx
 *
 * Wireframe jobs screen with:
 *  - Wide search bar at the top ("Search jobs")
 *  - Filter row underneath the search: Sort by, Company, Status
 *  - Grid of minimal job items (icon + name) using JobInfoCard (no surrounding tile)
 *
 * UI-only component: all data is mock for the wireframe. Filtering + sorting are performed
 * client-side for visual demo purposes.
 */

import React, { useState, useMemo } from "react";
import styles from "../features/job-management/styles/jobscreen.module.css";
import JobInfoCard from "../features/job-management/components/JobInfoCard";
import WideSearchBar from "../components/searchbar/WideSearchBar";

/**
 * Standardized logger for JobScreen.
 * @constant
 */
const logger = {
    info: (...args) => console.log("[JobScreen]", ...args),
    error: (...args) => console.error("[JobScreen]", ...args),
};

/**
 * Mock wireframe jobs list for layout only.
 * Replace later with real data from a hook/useJobsTab.
 *
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
 * Sort options for the "Sort by" control.
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
 * JobScreen component
 *
 * @component
 * @returns {JSX.Element}
 */
const JobScreen = () => {
    logger.info("JobScreen rendered");

    const [search, setSearch] = useState("");
    const [sortKey, setSortKey] = useState("name-asc");
    const [companyFilter, setCompanyFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");

    /**
     * handleSearchChange
     * @param {React.ChangeEvent<HTMLInputElement>} event
     */
    const handleSearchChange = (event) => {
        const next = event.target.value;
        setSearch(next);
        logger.info("Job search changed", { value: next });
    };

    /**
     * Derived list of unique companies (for company filter select)
     */
    const companyOptions = useMemo(() => {
        const setCompanies = new Set();
        MOCK_JOBS.forEach((j) => {
            if (j.companyName) setCompanies.add(j.companyName);
        });
        return ["all", ...Array.from(setCompanies).sort()];
    }, []);

    /**
     * Derived list of unique statuses (for status filter select)
     */
    const statusOptions = useMemo(() => {
        const setStatus = new Set();
        MOCK_JOBS.forEach((j) => {
            if (j.status) setStatus.add(j.status);
        });
        return ["all", ...Array.from(setStatus).sort()];
    }, []);

    /**
     * filteredAndSortedJobs - applies search, company/status filters and sorting
     */
    const filteredAndSortedJobs = useMemo(() => {
        const q = search.trim().toLowerCase();

        let result = MOCK_JOBS.filter((job) => {
            const matchesSearch =
                !q ||
                String(job.name || "").toLowerCase().includes(q) ||
                String(job.companyName || "").toLowerCase().includes(q) ||
                String(job.status || "").toLowerCase().includes(q);

            const matchesCompany = companyFilter === "all" || job.companyName === companyFilter;
            const matchesStatus = statusFilter === "all" || job.status === statusFilter;

            return matchesSearch && matchesCompany && matchesStatus;
        });

        // Sorting
        const [field, dir] = sortKey.split("-");
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

    return (
        <div className={styles.jobScreen}>
            <header className={styles.headerRow}>
                <h2 className={styles.title}>Jobs</h2>
            </header>

            {/* Top search bar */}
            <div className={styles.searchRow}>
                <WideSearchBar
                    value={search}
                    onChange={handleSearchChange}
                    placeholder="Search jobs"
                    ariaLabel="Search jobs"
                />
            </div>

            {/* Filters row: Sort by, Company, Status */}
            <div className={styles.filtersRow} role="region" aria-label="Job filters">
                <label className={styles.filterControl}>
                    <span className={styles.filterLabel}>Sort by</span>
                    <select
                        value={sortKey}
                        onChange={(e) => setSortKey(e.target.value)}
                        className={styles.filterSelect}
                        aria-label="Sort jobs"
                    >
                        {SORT_OPTIONS.map((opt) => (
                            <option key={opt.key} value={opt.key}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                </label>

                <label className={styles.filterControl}>
                    <span className={styles.filterLabel}>Company</span>
                    <select
                        value={companyFilter}
                        onChange={(e) => setCompanyFilter(e.target.value)}
                        className={styles.filterSelect}
                        aria-label="Filter by company"
                    >
                        {companyOptions.map((c) => (
                            <option key={c} value={c}>
                                {c === "all" ? "All companies" : c}
                            </option>
                        ))}
                    </select>
                </label>

                <label className={styles.filterControl}>
                    <span className={styles.filterLabel}>Status</span>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className={styles.filterSelect}
                        aria-label="Filter by status"
                    >
                        {statusOptions.map((s) => (
                            <option key={s} value={s}>
                                {s === "all" ? "All statuses" : s}
                            </option>
                        ))}
                    </select>
                </label>

                <div className={styles.filtersSpacer} />

                <div className={styles.filterActions}>
                    <button
                        type="button"
                        className={styles.clearButton}
                        onClick={() => {
                            setSearch("");
                            setCompanyFilter("all");
                            setStatusFilter("all");
                            setSortKey("name-asc");
                            logger.info("Filters cleared");
                        }}
                    >
                        Clear
                    </button>
                </div>
            a</div>

            {/* Folder grid (now using minimal JobInfoCard components) */}
            <section className={styles.folderGridSection}>
                {filteredAndSortedJobs.length === 0 ? (
                    <div className={styles.emptyState}>No jobs match your search.</div>
                ) : (
                    <div className={styles.folderGrid}>
                        {filteredAndSortedJobs.map((job) => (
                            <JobInfoCard
                                key={job.jobId}
                                job={job}
                                onClick={() => logger.info("Job item clicked (wireframe only)", { jobId: job.jobId })}
                            />
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
};

export default JobScreen;