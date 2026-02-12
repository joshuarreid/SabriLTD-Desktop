import React, { useState } from "react";
import PropTypes from "prop-types";
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
 * HorizontalJobBox
 * Horizontally scrollable row of JobInfoCard icons with round left/right arrows
 * on the far sides (vertically centered with icons), no page counter, no section label.
 * Spacing/layout matches Figma and screenshot, with section border/background.
 *
 * @component
 * @param {object} props
 * @param {Array} props.jobs - Array of job objects to display.
 * @returns {JSX.Element}
 */
const PAGE_SIZE = 8;

const HorizontalJobBox = ({ jobs = [] }) => {
    const [page, setPage] = useState(0);

    const totalPages = Math.max(1, Math.ceil(jobs.length / PAGE_SIZE));
    const pagedJobs = jobs.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
    const showPrev = page > 0;
    const showNext = page < totalPages - 1;

    /**
     * Go to the previous jobs page.
     * @function handlePrev
     */
    const handlePrev = () => setPage((p) => Math.max(p - 1, 0));

    /**
     * Go to the next jobs page.
     * @function handleNext
     */
    const handleNext = () => setPage((p) => Math.min(p + 1, totalPages - 1));

    logger.info("HorizontalJobBox rendered", {
        page,
        totalPages,
        jobsShowing: pagedJobs.length,
        totalJobs: jobs.length,
    });

    if (jobs.length === 0) {
        return (
            <div className={styles.horizontalJobBox}>
                <div className={styles.emptyState}>No jobs</div>
            </div>
        );
    }

    return (
        <div className={styles.horizontalJobBox}>
            <div className={styles.innerRow}>
                {/* Left arrow (far left, vertically centered) */}
                {showPrev ? (
                    <button
                        type="button"
                        className={styles.arrowButton}
                        onClick={handlePrev}
                        aria-label="Previous jobs"
                    >
                        <span className={styles.arrow}>&#60;</span>
                    </button>
                ) : (
                    <div className={styles.arrowSpacer} />
                )}

                {/* Main icon row (always PAGE_SIZE slots for stable spacing) */}
                <div className={styles.jobsBoxRow}>
                    {pagedJobs.map((job) => (
                        <div key={job.jobId} className={styles.jobCardWrap}>
                            <JobInfoCard
                                job={{
                                    jobId: job.jobId,
                                    name: job.name,
                                    companyName: job.client,
                                    status: job.status,
                                    description: job.description,
                                }}
                            />
                        </div>
                    ))}
                    {/* Fill out empty slots for spacing consistency */}
                    {Array.from({ length: PAGE_SIZE - pagedJobs.length }).map((_, idx) => (
                        <div key={"spacer-" + idx} className={styles.jobCardWrap} />
                    ))}
                </div>

                {/* Right arrow (far right, vertically centered) */}
                {showNext ? (
                    <button
                        type="button"
                        className={styles.arrowButton}
                        onClick={handleNext}
                        aria-label="Next jobs"
                    >
                        <span className={styles.arrow}>&#62;</span>
                    </button>
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