/**
 * JobScreen.jsx
 *
 * Presentational jobs screen.
 * - Wide search bar at the top ("Search jobs")
 * - Filter row: Sort by, Company, Client, Status (company/client use FilterDropdownSearch)
 * - Animated grid of minimal job items (JobInfoCard) using Framer Motion layout transitions
 * - Pagination controls pinned to the bottom (page indicator + navigation)
 *
 * All data fetching and business logic is handled by useJobScreen.
 */

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import styles from "../features/job-management/styles/jobscreen.module.css";
import JobInfoCard from "../features/job-management/components/JobInfoCard";
import WideSearchBar from "../components/searchbar/WideSearchBar";
import FilterDropdown from "../components/filterdropdown/FilterDropdown";
import FilterDropdownSearch from "../components/filterdropdown/FilterDropdownSearch";
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
 * NOTE:
 * - The outer layout stays mounted while data is loading so that
 *   Framer Motion can animate card transitions smoothly (no flashes),
 *   similar to the global SearchBar behavior.
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
        searchInput,
        sortKey,
        companyFilter,
        clientFilter,
        statusFilter,
        setSearch,
        setSearchInput,
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
     * handleSearchChange
     * - Updates local search input only; does NOT trigger filtering until Enter.
     *
     * @function handleSearchChange
     * @param {React.ChangeEvent<HTMLInputElement>} event
     * @returns {void}
     */
    const handleSearchChange = (event) => {
        const next = event.target.value;
        setSearchInput(next);
        logger.info("JobScreen search input changed", { value: next });
    };

    /**
     * handleSearchKeyDown
     * - Applies search when user presses Enter.
     *
     * @function handleSearchKeyDown
     * @param {React.KeyboardEvent<HTMLInputElement>} event
     * @returns {void}
     */
    const handleSearchKeyDown = (event) => {
        if (event.key === "Enter") {
            event.preventDefault();
            const value = searchInput.trim();
            logger.info("JobScreen search submitted via Enter", { value });
            setSearch(value);
            setPage(1);
        }
    };

    /**
     * handlePageChange
     * - Handles pagination navigation.
     *
     * @function handlePageChange
     * @param {number} nextPage
     * @returns {void}
     */
    const handlePageChange = (nextPage) => {
        logger.info("JobScreen handlePageChange", { nextPage });
        setPage(nextPage);
    };

    const hasPrevious = currentPage > 1;
    const hasNext = currentPage < totalPages;

    /**
     * buildCompanySearchOptions
     * - Maps companyOptions into label/value pairs for FilterDropdownSearch,
     *   excluding the "all" sentinel option.
     *
     * @returns {Array<{value:string,label:string}>}
     */
    const buildCompanySearchOptions = () =>
        (companyOptions || [])
            .filter((opt) => opt.value !== "all")
            .map((opt) => ({
                value: opt.value,
                label: opt.label,
            }));

    /**
     * buildClientSearchOptions
     * - Maps unique clients from clientOptions into label/value pairs for FilterDropdownSearch.
     *
     * @returns {Array<{value:string,label:string}>}
     */
    const buildClientSearchOptions = () =>
        (clientOptions || [])
            .filter((opt) => opt.value !== "all")
            .map((opt) => ({
                value: opt.value,
                label: opt.label,
            }));

    const companySearchOptions = buildCompanySearchOptions();
    const clientSearchOptions = buildClientSearchOptions();

    return (
        <div className={styles.jobScreen}>
            <header className={styles.headerRow}>
                <h2 className={styles.title}>Jobs</h2>
            </header>

            {/* Top search bar – full-width and aligned with title & filters */}
            <div className={styles.searchRow}>
                <WideSearchBar
                    value={searchInput}
                    onChange={handleSearchChange}
                    onKeyDown={handleSearchKeyDown}
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
                    displaySelection
                />

                <FilterDropdownSearch
                    label="Company"
                    value={companyFilter === "all" ? "" : companyFilter}
                    options={companySearchOptions}
                    onChange={(nextValue) => {
                        const normalized = nextValue || "all";
                        logger.info("JobScreen company filter changed", {
                            value: normalized,
                        });
                        setCompanyFilter(normalized);
                        setPage(1);
                    }}
                />

                <FilterDropdownSearch
                    label="Client"
                    value={clientFilter === "all" ? "" : clientFilter}
                    options={clientSearchOptions}
                    onChange={(nextValue) => {
                        const normalized = nextValue || "all";
                        logger.info("JobScreen client filter changed", {
                            value: normalized,
                        });
                        setClientFilter(normalized);
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
                    displaySelection
                />

                <div className={styles.filtersSpacer} />

                <div className={styles.filterActions}>
                    <button
                        type="button"
                        className={styles.clearButton}
                        onClick={() => {
                            handleResetFilters();
                            logger.info("JobScreen filters cleared");
                        }}
                    >
                        Clear
                    </button>
                </div>
            </div>


            {/* Folder grid (animated JobInfoCard components) */}
            <section className={styles.folderGridSection}>
                {isError ? (
                    <div className={styles.error}>
                        Error: {error?.message || "Failed to load jobs."}
                    </div>
                ) : paginatedJobs.length === 0 ? (
                    <div className={styles.emptyState}>
                    </div>
                ) : (
                    <motion.div
                        className={styles.folderGrid}
                        layout
                        transition={{
                            layout: { duration: 0.25, ease: [0.16, 1, 0.3, 1] },
                        }}
                    >
                        <AnimatePresence>
                            {paginatedJobs.map((job) => (
                                <motion.div
                                    key={job.jobId}
                                    layout
                                    initial={{ opacity: 0, y: 16, scale: 0.96 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: -10, scale: 0.96 }}
                                    transition={{
                                        duration: 0.22,
                                        ease: [0.16, 1, 0.3, 1],
                                    }}
                                >
                                    <JobInfoCard
                                        job={{
                                            jobId: job.jobId,
                                            name: job.name,
                                            companyName: job.client,
                                            status: job.status,
                                        }}
                                        onClick={() =>
                                            logger.info("JobScreen job clicked", {
                                                jobId: job.jobId,
                                            })
                                        }
                                    />
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </motion.div>
                )}
            </section>

            {/* Pagination footer pinned at bottom of page content */}
            <footer className={styles.paginationFooter} aria-label="Job pagination">
                <div className={styles.paginationSummary}>
                    {totalJobs === 0 ? (
                        "Showing 0 jobs"
                    ) : (
                        <>
                            Showing {(currentPage - 1) * pageSize + 1}–
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