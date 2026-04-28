import * as React from "react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./horizontaljobbox.module.css";
import JobInfoCard, { JobInfo } from "./JobInfoCard";

/**
 * Logger for HorizontalJobBox.
 * @constant
 * @type {{info: Function, error: Function}}
 */
const logger = {
    info: (...args: unknown[]) => console.log("[HorizontalJobBox]", ...args),
    error: (...args: unknown[]) => console.error("[HorizontalJobBox]", ...args),
};

/**
 * Simple fade animation variants for page.
 * @type {object}
 */
const FADE_VARIANTS = {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: { duration: 0.25 } },
    exit: { opacity: 0, transition: { duration: 0.22 } },
};

const PAGE_SIZE = 7;

// Define the Job type for this component
export interface HorizontalJob extends JobInfo {
    client?: string;
    dateUpdated?: string;
    dateAdded?: string;
}

export interface HorizontalJobBoxProps {
    jobs?: HorizontalJob[];
    onJobClick?: (job: HorizontalJob) => void;
}

/**
 * sortJobs
 * Sort jobs by active status first (case-insensitive compare), then by most recent last updated date.
 * @param {Array} jobs - Array of jobs to sort
 * @returns {Array} Sorted jobs
 */
const sortJobs = (jobs: HorizontalJob[]): HorizontalJob[] => {
    if (!Array.isArray(jobs)) return [];
    // Sort: active first, then most recent dateUpdated (descending), fallback to dateAdded (descending)
    return [...jobs].sort((a, b) => {
        // 1. Active first
        const statusA = String(a.status || "").toLowerCase();
        const statusB = String(b.status || "").toLowerCase();
        if (statusA === "active" && statusB !== "active") return -1;
        if (statusB === "active" && statusA !== "active") return 1;

        // 2. Most recent update
        const aDate = a.dateUpdated || a.dateAdded || "";
        const bDate = b.dateUpdated || b.dateAdded || "";

        // parse as Date and sort descending
        const aTime = aDate ? new Date(aDate).getTime() : 0;
        const bTime = bDate ? new Date(bDate).getTime() : 0;

        return bTime - aTime;
    });
};

/**
 * HorizontalJobBox
 * Consistent horizontal job box with fixed overflow, ellipsized descriptions,
 * never wraps, never cuts off active job icon. Always sorts by active status, then most recent update.
 * Adds onJobClick handler for card navigation.
 *
 * @component
 * @param {object} props
 * @param {Array} props.jobs - Array of job objects to display.
 * @param {function} [props.onJobClick] - Callback when a job card is clicked.
 * @returns {JSX.Element}
 */
const HorizontalJobBox: React.FC<HorizontalJobBoxProps> = ({ jobs = [], onJobClick }) => {
    const [page, setPage] = useState(0);

    // Apply the sort: active first, then most recently updated
    const sortedJobs = sortJobs(jobs);

    const totalPages = Math.max(1, Math.ceil(sortedJobs.length / PAGE_SIZE));
    const pagedJobs = sortedJobs.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
    const showPrev = page > 0;
    const showNext = page < totalPages - 1;

    /**
     * handlePrev - Navigates left.
     * @returns {void}
     */
    const handlePrev = () => {
        setPage((p) => Math.max(p - 1, 0));
        logger.info("Navigated to previous job page", { page: page - 1 });
    };

    /**
     * handleNext - Navigates right.
     * @returns {void}
     */
    const handleNext = () => {
        setPage((p) => Math.min(p + 1, totalPages - 1));
        logger.info("Navigated to next job page", { page: page + 1 });
    };

    logger.info("HorizontalJobBox rendered", {
        page,
        totalPages,
        jobsShowing: pagedJobs.length,
        totalJobs: sortedJobs.length,
    });

    if (sortedJobs.length === 0) {
        return (
            <div className={styles.horizontalJobBox}>
                <div className={styles.emptyState}>No jobs</div>
            </div>
        );
    }

    return (
        <div className={styles.horizontalJobBox}>
            <div className={styles.innerRow}>
                {showPrev ? (
                    <motion.button
                        type="button"
                        className={styles.arrowButton}
                        onClick={handlePrev}
                        aria-label="Previous jobs"
                        whileTap={{ scale: 0.93 }}
                        whileHover={{ scale: 1.09 }}
                    >
                        <span className={styles.arrow}>&#60;</span>
                    </motion.button>
                ) : (
                    <div className={styles.arrowSpacer} />
                )}

                <div className={styles.jobsBoxRowOuter}>
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={page}
                            className={styles.jobsBoxRow}
                            variants={FADE_VARIANTS}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                        >
                            {pagedJobs.map((job) => (
                                <div key={job.jobId} className={styles.jobCardWrap}>
                                    <JobInfoCard
                                        job={{
                                            jobId: job.jobId,
                                            name: job.name,
                                            companyName: job.client,
                                            status: job.status,
                                            description: job.description,
                                            // dateUpdated and dateAdded are not used by JobInfoCard, but kept for sorting
                                        }}
                                        onClick={() => onJobClick && onJobClick(job)}
                                    />
                                </div>
                            ))}
                            {/* Fill out empty slots for spacing (never cuts off icon) */}
                            {Array.from({ length: PAGE_SIZE - pagedJobs.length }).map((_, idx) => (
                                <div key={"spacer-" + idx} className={styles.jobCardWrap} />
                            ))}
                        </motion.div>
                    </AnimatePresence>
                </div>
                {showNext ? (
                    <motion.button
                        type="button"
                        className={styles.arrowButton}
                        onClick={handleNext}
                        aria-label="Next jobs"
                        whileTap={{ scale: 0.93 }}
                        whileHover={{ scale: 1.09 }}
                    >
                        <span className={styles.arrow}>&#62;</span>
                    </motion.button>
                ) : (
                    <div className={styles.arrowSpacer} />
                )}
            </div>
        </div>
    );
};


export default HorizontalJobBox;