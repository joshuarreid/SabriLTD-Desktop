/**
 * JobScreen.jsx
 *
 * Wireframe jobs screen with:
 *  - Wide search bar at the top ("Search jobs")
 *  - Filter row underneath the search: Sort by, Company, Status (using generic FilterDropdown)
 *  - Grid of minimal job items (icon + name) using JobInfoCard (no surrounding tile)
 *
 * Per Bulletproof React conventions: this file contains render logic only and
 * delegates state / business logic to useJobScreen hook.
 */

import React from "react";
import styles from "../features/job-management/styles/jobscreen.module.css";
import JobInfoCard from "../features/job-management/components/JobInfoCard";
import WideSearchBar from "../components/searchbar/WideSearchBar";
import FilterDropdown from "../components/filterdropdown/FilterDropdown";
import { useJobScreen } from "../features/job-management/hooks/useJobScreen";

/**
 * Standardized logger for JobScreen.
 *
 * @constant
 * @type {{info: Function, error: Function}}
 */
const logger = {
    info: (...args) => console.log("[JobScreen]", ...args),
    error: (...args) => console.error("[JobScreen]", ...args),
};

/**
 * JobScreen
 * Presentational container for the jobs wireframe.
 *
 * @component
 * @returns {JSX.Element}
 */
const JobScreen = () => {
    logger.info("JobScreen rendered");

    const {
        search,
        sortKey,
        companyFilter,
        statusFilter,
        setSearch,
        setSortKey,
        setCompanyFilter,
        setStatusFilter,
        sortOptionsForDropdown,
        companyOptions,
        statusOptions,
        filteredAndSortedJobs,
    } = useJobScreen();

    /**
     * handleSearchChange
     * Handles changes in the search bar input.
     *
     * @param {React.ChangeEvent<HTMLInputElement>} event
     * @returns {void}
     */
    const handleSearchChange = (event) => {
        const next = event.target.value;
        setSearch(next);
        logger.info("Job search changed", { value: next });
    };

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

            {/* Filters row: Sort by, Company, Status (using generic FilterDropdown) */}
            <div className={styles.filtersRow} role="region" aria-label="Job filters">
                <FilterDropdown
                    label="Sort by"
                    value={sortKey}
                    options={sortOptionsForDropdown}
                    onChange={setSortKey}
                />
                <FilterDropdown
                    label="Company"
                    value={companyFilter}
                    options={companyOptions}
                    onChange={setCompanyFilter}
                />
                <FilterDropdown
                    label="Status"
                    value={statusFilter}
                    options={statusOptions}
                    onChange={setStatusFilter}
                />

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
            </div>

            {/* Folder grid (minimal JobInfoCard components) */}
            <section className={styles.folderGridSection}>
                {filteredAndSortedJobs.length === 0 ? (
                    <div className={styles.emptyState}>No jobs match your search.</div>
                ) : (
                    <div className={styles.folderGrid}>
                        {filteredAndSortedJobs.map((job) => (
                            <JobInfoCard
                                key={job.jobId}
                                job={job}
                                onClick={() =>
                                    logger.info("Job item clicked (wireframe only)", {
                                        jobId: job.jobId,
                                    })
                                }
                            />
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
};

export default JobScreen;