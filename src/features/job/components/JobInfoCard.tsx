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

import * as React from "react";
import styles from "../styles/jobinfocard.module.css";
import { FcFolder } from "react-icons/fc";
import { TbProgressCheck } from "react-icons/tb";

/**
 * logger for JobInfoCard.
 * @constant
 */
const logger = {
    info: (...args: unknown[]) => console.log("[JobInfoCard]", ...args),
    error: (...args: unknown[]) => console.error("[JobInfoCard]", ...args),
};

/**
 * truncate
 * - Truncate a string to maxLength characters, adding "..." if truncated.
 *
 * @param {string} text
 * @param {number} maxLength
 * @returns {string}
 */
const truncate = (text: string, maxLength: number): string => {
    if (!text) return "";
    const str = String(text);
    if (str.length <= maxLength) return str;
    return `${str.slice(0, maxLength)}...`;
};

// Define types for props
export interface JobInfo {
    jobId: number;
    name: string;
    companyName: string;
    status: string;
    description: string;
}

export interface JobInfoCardProps {
    job: JobInfo;
    onClick?: (job: JobInfo) => void;
}

/**
 * JobInfoCard
 *
 * @param {Object} props
 * @param {{jobId:number, name:string, companyName?:string, status?:string, description?:string}} props.job - Job data
 * @param {function} [props.onClick] - Click handler (optional)
 * @returns {JSX.Element}
 */
const JobInfoCard = ({ job, onClick }: JobInfoCardProps): React.ReactElement => {
    logger.info("JobInfoCard rendered", { jobId: job?.jobId });

    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (!onClick) return;
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onClick(job);
        }
    };

    const truncatedDescription = truncate(job?.description || "", 22);
    const isActive = String(job?.status || "").toLowerCase() === "active";

    return (
        <div
            className={styles.jobInfoRoot}
            role={onClick ? "button" : undefined}
            tabIndex={onClick ? 0 : undefined}
            onClick={() => onClick && onClick(job)}
            onKeyDown={handleKeyDown}
            aria-label={
                job?.name
                    ? `Open job ${job.name}`
                    : "Open job"
            }
        >
            <div className={styles.iconWrap} aria-hidden>
                {FcFolder && FcFolder({ className: styles.icon })}
                {isActive && TbProgressCheck && TbProgressCheck({ className: styles.activeCheck })}
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


export default JobInfoCard;