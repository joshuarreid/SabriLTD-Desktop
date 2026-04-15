/**
 * JobScreen.jsx
 *
 * Presentational jobs screen.
 * Uses JobSearchBox (reusable search + filters + grid + pagination) and
 * delegates navigation on card click.
 *
 * @component
 * @returns {JSX.Element}
 */

import React from "react";
import { useNavigate } from "react-router-dom";
import styles from "../features/job-management/styles/jobscreen.module.css";
import JobSearchBox from "../features/jobsearchbox/components/JobSearchBox";


/**
 * Logger for JobScreen.
 *
 * @constant
 * @type {{info: Function, error: Function}}
 */
const logger = {
    info: (...args) => console.log("[JobScreen]", ...args),
    error: (...args) => console.error("[JobScreen]", ...args),
};

const JobScreen = () => {
    logger.info("JobScreen rendered");

    const navigate = useNavigate();

    /**
     * handleJobClick
     * Routes to /jobs/:jobId when a job card is clicked.
     *
     * @function handleJobClick
     * @param {object} job - Job object from the grid.
     * @returns {void}
     */
    const handleJobClick = (job) => {
        if (!job || !job.jobId) {
            logger.error("Tried to navigate to job with invalid job object", job);
            return;
        }
        logger.info("Navigating to JobDetailScreen", { jobId: job.jobId });
        navigate(`/jobs/${job.jobId}`);
    };

    return (
        <div className={styles.jobScreen}>
            <header className={styles.headerRow}>
                <h2 className={styles.title}>Jobs</h2>
            </header>

            <JobSearchBox
                onJobClick={handleJobClick}
                placeholder="Search jobs"
            />
        </div>
    );
};

export default JobScreen;