/**
 * JobScreen.jsx
 *
 * Presentational jobs screen.
 * Top search bar ALWAYS performs a global server-side search
 * via applyGlobalSearch in useJobScreen and clears filters.
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
 * @component
 * @returns {JSX.Element}
 */
const JobScreen = () => {
    logger.info("JobScreen rendered");

    const {
        // data
        paginatedJobs,
        totalJobs,
        totalPages,
        currentPage,

        // loading / error
        isPending,
        isError,
        error,

        // search & filters
        searchInput,
        sortKey,
        companyFilter,
        clientFilter,
        statusFilter,

        setSearchInput,
        setSortKey,
        setCompanyFilter,
        setClientFilter,
        setStatusFilter,

        // dropdown options
        sortOptionsForDropdown,
        companyOptions,
        clientOptions,
        statusOptions,

        // pagination (centralized via useJobScreenPagination)
        hasPrevious,
        hasNext,
        handlePageChange,
        handleNextPage,
        handlePreviousPage,
        itemStart,
        itemEnd,

        // actions
        handleResetFilters,
        applyGlobalSearch,
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
        logger.info("[JobScreen] search input changed", { value: next });
    };

    /**
     * handleSearchKeyDown
     * - Global search when user presses Enter.
     *   - Clears all filters.
     *   - Sets global search query (server-side searchJobs).
     *   - Resets pagination to page 1.
     *
     * @function handleSearchKeyDown
     * @param {React.KeyboardEvent<HTMLInputElement>} event
     * @returns {void}
     */
    const handleSearchKeyDown = (event) => {
        if (event.key === "Enter") {
            event.preventDefault();
            const value = searchInput.trim();
            logger.info("[JobScreen] global search submitted via Enter", {
                value,
            });
            applyGlobalSearch(value);
        }
    };

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
            .map((opt) => ({ value: opt.value, label: opt.label }));

    /**
     * buildClientSearchOptions
     * - Maps unique clients from clientOptions into label/value pairs for FilterDropdownSearch.
     *
     * @returns {Array<{value:string,label:string}>}
     */
    const buildClientSearchOptions = () =>
        (clientOptions || [])
            .filter((opt) => opt.value !== "all")
            .map((opt) => ({ value: opt.value, label: opt.label }));

    const companySearchOptions = buildCompanySearchOptions();
    const clientSearchOptions = buildClientSearchOptions();

    logger.info("[JobScreen] render snapshot", {
        totalJobs,
        totalPages,
        currentPage,
        itemStart,
        itemEnd,
        hasPrevious,
        hasNext,
        paginatedJobsLength: paginatedJobs.length,
    });

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
                        const normalized = value || sortKey;
                        logger.info("[JobScreen] sort changed", { value: normalized });
                        setSortKey(normalized);
                        handlePageChange(1);
                    }}
                    displaySelection
                />

                <FilterDropdownSearch
                    label="Company"
                    value={companyFilter === "all" ? "" : companyFilter}
                    options={companySearchOptions}
                    onChange={(nextValue) => {
                        const normalized = nextValue || "all";
                        logger.info("[JobScreen] company filter changed", {
                            value: normalized,
                        });
                        setCompanyFilter(normalized);
                        handlePageChange(1);
                    }}
                />

                <FilterDropdownSearch
                    label="Client"
                    value={clientFilter === "all" ? "" : clientFilter}
                    options={clientSearchOptions}
                    onChange={(nextValue) => {
                        const normalized = nextValue || "all";
                        logger.info("[JobScreen] client filter changed", {
                            value: normalized,
                        });
                        setClientFilter(normalized);
                        handlePageChange(1);
                    }}
                />

                <FilterDropdown
                    label="Status"
                    value={statusFilter || "all"}
                    options={statusOptions}
                    onChange={(value) => {
                        // Normalize falsy/empty values to "all" explicitly before setting.
                        const normalized = value || "all";
                        logger.info("[JobScreen] status filter changed", { value: normalized });
                        setStatusFilter(normalized);
                        handlePageChange(1);
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
                            logger.info("[JobScreen] filters cleared");
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
                ) : isPending ? (
                    <div className={styles.loadingState} />
                ) : paginatedJobs.length === 0 ? (
                    <div className={styles.emptyState} />
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
                                            logger.info("[JobScreen] job clicked", {
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
                        <>Showing {itemStart}–{itemEnd} of {totalJobs} jobs</>
                    )}
                </div>
                <div className={styles.paginationControls}>
                    <button
                        type="button"
                        className={styles.paginationButton}
                        onClick={handlePreviousPage}
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
                        onClick={handleNextPage}
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