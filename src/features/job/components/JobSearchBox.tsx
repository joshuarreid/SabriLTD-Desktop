/**
 * JobSearchBox.jsx
 *
 * Reusable search bar + filter row + job card grid + pagination component.
 * Encapsulates all job search UI that was previously inline in JobScreen.
 * All data fetching and state management delegated to useJobSearchBox.
 *
 * @component
 * @param {object} props
 * @param {(job: object) => void} props.onJobClick - Called when a job card is clicked.
 * @param {string} [props.placeholder="Search jobs"] - Search bar placeholder text.
 * @returns {JSX.Element}
 */

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./jobsearchbox.module.css";
import useJobSearchBox from "../hooks/useJobSearchBox";
import JobInfoCard, { JobInfo } from "./JobInfoCard";
import CreateJobModal from "./CreateJobModal";
import FilterDropdown from "../../../components/filterdropdown/FilterDropdown";
import FilterDropdownSearch from "../../../components/filterdropdown/FilterDropdownSearch";
import WideSearchBar from "../../../components/searchbar/WideSearchBar";

interface JobSearchBoxProps {
    onJobClick: (job: JobInfo) => void;
    placeholder?: string;
}

/**
 * Logger for JobSearchBox.
 *
 * @constant
 * @type {{info: Function, error: Function}}
 */
const logger = {
    info: (...args: unknown[]) => console.log("[JobSearchBox]", ...args),
    error: (...args: unknown[]) => console.error("[JobSearchBox]", ...args),
};

const JobSearchBox: React.FC<JobSearchBoxProps> = ({ onJobClick, placeholder = "Search jobs" }) => {
    logger.info("JobSearchBox rendered");

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
        applyGlobalSearch,
        isCreateJobModalOpen,
        openCreateJobModal,
        closeCreateJobModal,
        createJobStatus,
        createJobError,
        handleCreateJob,
    } = useJobSearchBox({ placeholder });

    /**
     * handleSearchChange
     * Updates local search input only; does NOT trigger filtering until Enter.
     *
     * @function handleSearchChange
     * @param {React.ChangeEvent<HTMLInputElement>} event
     * @returns {void}
     */
    const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const next = event.target.value;
        setSearchInput(next);
    };

    /**
     * handleSearchKeyDown
     * Global search when user presses Enter.
     *
     * @function handleSearchKeyDown
     * @param {React.KeyboardEvent<HTMLInputElement>} event
     * @returns {void}
     */
    const handleSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === "Enter") {
            event.preventDefault();
            const value = searchInput.trim();
            logger.info("Global search submitted via Enter", { value });
            applyGlobalSearch(value);
        }
    };

    /**
     * handleCardClick
     * Delegates to parent onJobClick prop.
     *
     * @function handleCardClick
     * @param {object} job
     * @returns {void}
     */
    const handleCardClick = (job: JobInfo) => {
        if (!job || !job.jobId) {
            logger.error("handleCardClick called with invalid job", job);
            return;
        }

        logger.info("Job card clicked", { jobId: job.jobId });

        if (typeof onJobClick === "function") {
            onJobClick(job);
        }
    };

    /**
     * buildCompanySearchOptions
     *
     * @function buildCompanySearchOptions
     * @returns {Array<{value: string, label: string}>}
     */
    const buildCompanySearchOptions = () =>
        (companyOptions || [])
            .filter((opt: any) => opt.value !== "all")
            .map((opt: any) => ({ value: opt.value, label: opt.label }));

    /**
     * buildClientSearchOptions
     *
     * @function buildClientSearchOptions
     * @returns {Array<{value: string, label: string}>}
     */
    const buildClientSearchOptions = () =>
        (clientOptions || [])
            .filter((opt: any) => opt.value !== "all")
            .map((opt: any) => ({ value: opt.value, label: opt.label }));

    const companySearchOptions = buildCompanySearchOptions();
    const clientSearchOptions = buildClientSearchOptions();

    return (
        <div className={styles.container}>
            {/* Search bar */}
            <div className={styles.searchRow}>
                <WideSearchBar
                    value={searchInput}
                    onChange={handleSearchChange}
                    onKeyDown={handleSearchKeyDown}
                    placeholder={placeholder}
                    ariaLabel={placeholder}
                    fluid
                />
            </div>

            {/* Filters row */}
            <div
                className={styles.filtersRow}
                role="region"
                aria-label="Job filters"
            >
                <FilterDropdown
                    label="Sort by"
                    value={sortKey}
                    options={sortOptionsForDropdown}
                    onChange={(value: string) => {
                        const normalized = value || sortKey;
                        logger.info("Sort changed", { value: normalized });
                        setSortKey(normalized);
                        handlePageChange(1);
                    }}
                    displaySelection
                />

                <FilterDropdownSearch
                    label="Company"
                    value={companyFilter === "all" ? "" : companyFilter}
                    options={companySearchOptions}
                    onChange={(nextValue: string) => {
                        const normalized = nextValue || "all";
                        logger.info("Company filter changed", { value: normalized });
                        setCompanyFilter(normalized);
                        handlePageChange(1);
                    }}
                />

                <FilterDropdownSearch
                    label="Client"
                    value={clientFilter === "all" ? "" : clientFilter}
                    options={clientSearchOptions}
                    onChange={(nextValue: string) => {
                        const normalized = nextValue || "all";
                        logger.info("Client filter changed", { value: normalized });
                        setClientFilter(normalized);
                        handlePageChange(1);
                    }}
                />

                <FilterDropdown
                    label="Status"
                    value={statusFilter || "all"}
                    options={statusOptions}
                    onChange={(value: string) => {
                        const normalized = value || "all";
                        logger.info("Status filter changed", { value: normalized });
                        setStatusFilter(normalized);
                        handlePageChange(1);
                    }}
                    displaySelection
                />

                <div className={styles.filtersSpacer} />

                <div className={styles.filterActions}>
                    <button
                        className={styles.addJobBtn}
                        type="button"
                        onClick={() => {
                            logger.info("+ New clicked");
                            openCreateJobModal();
                        }}
                    >
                        + New
                    </button>

                    <button
                        type="button"
                        className={styles.clearButton}
                        onClick={() => {
                            handleResetFilters();
                            logger.info("Filters cleared");
                        }}
                    >
                        Clear Filters
                    </button>
                </div>
            </div>

            {/* Job card grid */}
            <section className={styles.gridSection}>
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
                            {paginatedJobs.map((job: JobInfo) => (
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
                                            description: job.description,
                                        }}
                                        onClick={() => handleCardClick(job)}
                                    />
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </motion.div>
                )}
            </section>

            {/* Create Job Modal */}
            <CreateJobModal
                open={isCreateJobModalOpen}
                isSaving={createJobStatus === "saving"}
                saveState={createJobStatus}
                onClose={() => {
                    logger.info("Create job modal closed");
                    closeCreateJobModal();
                }}
                onSave={(payload: any) => {
                    logger.info("Create job modal save submitted");
                    handleCreateJob(payload);
                }}
                error={createJobError}
                companyOptions={companyOptions}
                statusOptions={statusOptions}
            />

            {/* Pagination footer */}
            <footer className={styles.paginationFooter} aria-label="Job pagination">
                <div className={styles.paginationSummary}>
                    {totalJobs === 0 ? (
                        "Showing 0 jobs"
                    ) : (
                        <>
                            Showing {itemStart}–{itemEnd} of {totalJobs} jobs
                        </>
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

export default JobSearchBox;