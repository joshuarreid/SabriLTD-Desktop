import React, { useState } from "react";
import PropTypes from "prop-types";
import { motion, AnimatePresence } from "framer-motion";
import styles from "../styles/horizontaljobbox.module.css";
import JobInfoCard from "../../jobinfocard/JobInfoCard";

/**
 * Logger for HorizontalJobBox.
 * @constant
 * @type {{info: Function, error: Function}}
 */
const logger = {
    info: (...args) => console.log("[HorizontalJobBox]", ...args),
    error: (...args) => console.error("[HorizontalJobBox]", ...args),
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

/**
 * sortJobs
 * Sort jobs by active status first (case-insensitive compare), then by most recent last updated date.
 * @param {Array} jobs - Array of jobs to sort
 * @returns {Array} Sorted jobs
 */
const sortJobs = (jobs) => {
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
 *
 * @component
 * @param {object} props
 * @param {Array} props.jobs - Array of job objects to display.
 * @returns {JSX.Element}
 */
const HorizontalJobBox = ({ jobs = [] }) => {
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
                                            dateUpdated: job.dateUpdated,
                                            dateAdded: job.dateAdded,
                                        }}
                                        descriptionClassName={styles.truncateDescription}
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

HorizontalJobBox.propTypes = {
    jobs: PropTypes.arrayOf(PropTypes.object),
};

export default HorizontalJobBox;