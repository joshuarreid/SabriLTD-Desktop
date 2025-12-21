/**
 * JobScreen.jsx
 *
 * Presentational jobs screen.
 * Top search bar now ALWAYS performs a global server-side search
 * via setGlobalSearchQuery in useJobScreen.
 */

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import styles from "../features/job-management/styles/jobscreen.module.css";
import JobInfoCard from "../features/job-management/components/JobInfoCard";
import WideSearchBar from "../components/searchbar/WideSearchBar";
import FilterDropdown from "../components/filterdropdown/FilterDropdown";
import FilterDropdownSearch from "../components/filterdropdown/FilterDropdownSearch";
import { useJobScreen } from "../features/job-management/hooks/useJobScreen";

const logger = {
    info: (...args) => console.log("[JobScreen]", ...args),
    error: (...args) => console.error("[JobScreen]", ...args),
};

const JobScreen = () => {
    logger.info("JobScreen rendered");

    const {
        paginatedJobs,
        totalJobs,
        totalPages,
        currentPage,

        isPending,
        isError,
        error,

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

        // NEW: from useJobScreen (global search setter)
        setGlobalSearchQuery,

        sortOptionsForDropdown,
        companyOptions,
        clientOptions,
        statusOptions,

        hasPrevious,
        hasNext,
        handlePageChange,
        handleNextPage,
        handlePreviousPage,
        itemStart,
        itemEnd,

        handleResetFilters,
    } = useJobScreen();

    const handleSearchChange = (event) => {
        const next = event.target.value;
        setSearchInput(next);
        logger.info("[JobScreen] search input changed", { value: next });
    };

    /**
     * Global search on Enter:
     * - Updates globalSearchQuery in useJobScreen (server-side searchJobs).
     * - Resets to page 1.
     */
    const handleSearchKeyDown = (event) => {
        if (event.key === "Enter") {
            event.preventDefault();
            const value = searchInput.trim();
            logger.info("[JobScreen] global search submitted via Enter", {
                value,
            });
            setGlobalSearchQuery(value);
            handlePageChange(1);
        }
    };

    const buildCompanySearchOptions = () =>
        (companyOptions || [])
            .filter((opt) => opt.value !== "all")
            .map((opt) => ({ value: opt.value, label: opt.label }));

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

            <div className={styles.filtersRow} role="region" aria-label="Job filters">
                <FilterDropdown
                    label="Sort by"
                    value={sortKey}
                    options={sortOptionsForDropdown}
                    onChange={(value) => {
                        logger.info("[JobScreen] sort changed", { value });
                        setSortKey(value);
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
                    value={statusFilter}
                    options={statusOptions}
                    onChange={(value) => {
                        logger.info("[JobScreen] status filter changed", { value });
                        setStatusFilter(value);
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