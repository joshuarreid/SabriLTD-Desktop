/**
 * JobInfoCard.jsx
 *
 * Presentational component for a job "folder" icon + name. This is intentionally
 * minimal: no surrounding tile/background — just the icon and the text beneath it,
 * matching the wireframe request.
 *
 * - Pure UI component (no side-effects)
 * - Accessible: supports keyboard activation (Enter / Space)
 *
 * @module JobInfoCard
 */

import React from "react";
import PropTypes from "prop-types";
import styles from "../styles/jobinfocard.module.css";
import { FcFolder } from "react-icons/fc";

/**
 * logger for JobInfoCard.
 * @constant
 */
const logger = {
    info: (...args) => console.log("[JobInfoCard]", ...args),
    error: (...args) => console.error("[JobInfoCard]", ...args),
};

/**
 * truncate
 * - Truncate a string to maxLength characters, adding "..." if truncated.
 *
 * @param {string} text
 * @param {number} maxLength
 * @returns {string}
 */
const truncate = (text, maxLength) => {
    if (!text) return "";
    const str = String(text);
    if (str.length <= maxLength) return str;
    return `${str.slice(0, maxLength)}...`;
};

/**
 * JobInfoCard
 *
 * @param {Object} props
 * @param {{jobId:number, name:string, companyName?:string, status?:string, description?:string}} props.job - Job data
 * @param {function} [props.onClick] - Click handler (optional)
 * @returns {JSX.Element}
 */
const JobInfoCard = ({ job, onClick }) => {
    logger.info("JobInfoCard rendered", { jobId: job?.jobId });

    const handleKeyPress = (e) => {
        if (!onClick) return;
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onClick(job);
        }
    };

    const truncatedDescription = truncate(job?.description || "", 22);

    return (
        <div
            className={styles.jobInfoRoot}
            role={onClick ? "button" : undefined}
            tabIndex={onClick ? 0 : undefined}
            onClick={() => onClick && onClick(job)}
            onKeyPress={handleKeyPress}
            aria-label={
                job?.name
                    ? `Open job ${job.name}`
                    : "Open job"
            }
        >
            <div className={styles.iconWrap} aria-hidden>
                <FcFolder className={styles.icon} />
            </div>
            <div className={styles.nameWrap}>
                <div className={styles.name}>{job?.name}</div>
                {truncatedDescription && (
                    <div className={styles.description}>
                        {truncatedDescription}
                    </div>
                )}
            </div>
        </div>
    );
};

JobInfoCard.propTypes = {
    job: PropTypes.shape({
        jobId: PropTypes.number.isRequired,
        name: PropTypes.string.isRequired,
        companyName: PropTypes.string,
        status: PropTypes.string,
        description: PropTypes.string,
    }).isRequired,
    onClick: PropTypes.func,
};

JobInfoCard.defaultProps = {
    onClick: undefined,
};

export default JobInfoCard;