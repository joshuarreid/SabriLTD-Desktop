/**
 * JobScreen.jsx
 *
 * Presentational jobs screen:
 *  - Wide search bar at the top ("Search jobs")
 *  - Filter row: Sort by, Company, Client, Status (using generic FilterDropdown)
 *  - Grid of minimal job items (icon + name) using JobInfoCard (no surrounding tile)
 *  - Pagination controls pinned to the bottom (page indicator + navigation)
 *
 * All data fetching and business logic is handled by useJobScreen.
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
 * Top-level presentational container for the jobs view.
 *
 * @component
 * @returns {JSX.Element}
 */
const JobScreen = () => {
    logger.info("JobScreen rendered");

    const {
        jobs,
        isPending,
        isError,
        error,
        search,
        sortKey,
        companyFilter,
        clientFilter,
        statusFilter,
        setSearch,
        setSortKey,
        setCompanyFilter,
        setClientFilter,
        setStatusFilter,
        sortOptionsForDropdown,
        companyOptions,
        clientOptions,
        statusOptions,
        paginatedJobs,
        totalJobs,
        totalPages,
        currentPage,
        pageSize,
        setPage,
        handleResetFilters,
    } = useJobScreen();

    /**
     * Handles changes in the search bar input.
     *
     * @function handleSearchChange
     * @param {React.ChangeEvent<HTMLInputElement>} event
     * @returns {void}
     */
    const handleSearchChange = (event) => {
        const next = event.target.value;
        setSearch(next);
        setPage(1);
        logger.info("Job search changed", { value: next });
    };

    /**
     * Handles pagination navigation.
     *
     * @function handlePageChange
     * @param {number} nextPage
     * @returns {void}
     */
    const handlePageChange = (nextPage) => {
        logger.info("JobScreen handlePageChange", { nextPage });
        setPage(nextPage);
    };

    if (isPending) {
        return (
            <div className={styles.jobScreen}>
                <div className={styles.loading}>Loading jobs...</div>
            </div>
        );
    }

    if (isError) {
        return (
            <div className={styles.jobScreen}>
                <div className={styles.error}>
                    Error: {error?.message || "Failed to load jobs."}
                </div>
            </div>
        );
    }

    const hasPrevious = currentPage > 1;
    const hasNext = currentPage < totalPages;

    return (
        <div className={styles.jobScreen}>
            <header className={styles.headerRow}>
                <h2 className={styles.title}>Jobs</h2>
            </header>

            {/* Top search bar – full-width and aligned with title & filters */}
            <div className={styles.searchRow}>
                <WideSearchBar
                    value={search}
                    onChange={handleSearchChange}
                    placeholder="Search jobs"
                    ariaLabel="Search jobs"
                    fluid
                />
            </div>

            {/* Filters row: Sort by, Company, Client, Status */}
            <div className={styles.filtersRow} role="region" aria-label="Job filters">
                <FilterDropdown
                    label="Sort by"
                    value={sortKey}
                    options={sortOptionsForDropdown}
                    onChange={(value) => {
                        setSortKey(value);
                        setPage(1);
                    }}
                />
                <FilterDropdown
                    label="Company"
                    value={companyFilter}
                    options={companyOptions}
                    onChange={(value) => {
                        setCompanyFilter(value);
                        setPage(1);
                    }}
                />
                <FilterDropdown
                    label="Client"
                    value={clientFilter}
                    options={clientOptions}
                    onChange={(value) => {
                        setClientFilter(value);
                        setPage(1);
                    }}
                />
                <FilterDropdown
                    label="Status"
                    value={statusFilter}
                    options={statusOptions}
                    onChange={(value) => {
                        setStatusFilter(value);
                        setPage(1);
                    }}
                />

                <div className={styles.filtersSpacer} />

                <div className={styles.filterActions}>
                    <button
                        type="button"
                        className={styles.clearButton}
                        onClick={() => {
                            handleResetFilters();
                            logger.info("Filters cleared (from JobScreen)");
                        }}
                    >
                        Clear
                    </button>
                </div>
            </div>

            {/* Folder grid (minimal JobInfoCard components) */}
            <section className={styles.folderGridSection}>
                {paginatedJobs.length === 0 ? (
                    <div className={styles.emptyState}>
                        {jobs.length === 0
                            ? "No jobs found."
                            : "No jobs match your search or filters."}
                    </div>
                ) : (
                    <div className={styles.folderGrid}>
                        {paginatedJobs.map((job) => (
                            <JobInfoCard
                                key={job.jobId}
                                job={{
                                    jobId: job.jobId,
                                    name: job.name,
                                    companyName: job.client,
                                    status: job.status,
                                }}
                                onClick={() =>
                                    logger.info("Job item clicked", {
                                        jobId: job.jobId,
                                    })
                                }
                            />
                        ))}
                    </div>
                )}
            </section>

            {/* Pagination footer pinned at bottom of page content */}
            <footer className={styles.paginationFooter} aria-label="Job pagination">
                <div className={styles.paginationSummary}>
                    {totalJobs === 0 ? (
                        "Showing 0 jobs"
                    ) : (
                        <>
                            Showing{" "}
                            {(currentPage - 1) * pageSize + 1}–
                            {Math.min(currentPage * pageSize, totalJobs)} of {totalJobs} jobs
                        </>
                    )}
                </div>
                <div className={styles.paginationControls}>
                    <button
                        type="button"
                        className={styles.paginationButton}
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={!hasPrevious}
                    >
                        Previous
                    </button>
                    <span className={styles.paginationIndicator}>
                        Page {currentPage} of {totalPages}
                    </span>
                    <button
                        type="button"
                        className={styles.paginationButton}
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={!hasNext}
                    >
                        Next
                    </button>
                </div>
            </footer>
        </div>
    );
};

export default JobScreen;