/**
 * JobScreen.jsx
 *
 * Presentational jobs screen.
 * Uses JobBrowser (reusable search + filters + grid + pagination) and
 * delegates navigation on card click.
 *
 * @component
 * @returns {JSX.Element}
 */

import React from "react";
import { useNavigate } from "react-router-dom";
import styles from "../styles/jobscreen.module.css";
import JobBrowser from "../../features/job/components/JobBrowser";
import useJobScreen from "../hooks/useJobScreen";
import { type JobInfo } from "../../features/job/components/JobInfoCard";


/**
 * Logger for JobScreen.
 *
 * @constant
 * @type {{info: Function, error: Function}}
 */
const logger = {
    info: (...args: any[]) => console.log("[JobScreen]", ...args),
    error: (...args: any[]) => console.error("[JobScreen]", ...args),
};

const JobScreen = () => {
    logger.info("JobScreen rendered");

    const navigate = useNavigate();
    const {
        openCreateJobModal,
        isCreateJobModalOpen,
        closeCreateJobModal,
        // ...other destructured values...
    } = useJobScreen();

    /**
     * handleJobClick
     * Routes to /jobs/:jobId when a job card is clicked.
     *
     * @function handleJobClick
     * @param {object} job - Job object from the grid.
     * @returns {void}
     */
    const handleJobClick = (job: JobInfo) => {
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

            <JobBrowser
                onJobClick={handleJobClick}
                placeholder="Search jobs"
                openCreateJobModal={openCreateJobModal}
                isCreateJobModalOpen={isCreateJobModalOpen}
                closeCreateJobModal={closeCreateJobModal}
            />
        </div>
    );
};

export default JobScreen;