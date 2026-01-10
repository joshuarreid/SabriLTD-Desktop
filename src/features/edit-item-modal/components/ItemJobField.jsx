/**
 * ItemJobField.jsx
 *
 * Bulletproof React job selection field for items:
 * - Selected jobs shown as pills at the top (removable by click).
 * - Search bar below for fuzzy lookup (API-driven).
 * - Below search bar is a responsive pill grid of jobs (recent or filtered).
 * - Clicking a job toggles selection; selected jobs are pinned at the top.
 * - Powered by job API (getAllJobs for recent, searchJobs for search).
 * - Uses framer-motion for pill animations (entry/exit/move), matching job screen UX.
 *
 * @component
 * @param {Object} props
 * @param {Array<number>} props.value - Array of selected jobIds.
 * @param {Function} props.onChange - Called with updated array of selected jobIds.
 * @returns {JSX.Element}
 */

import React, { useState, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import useItemJobField from "../hooks/useItemJobField";
import styles from "../styles/itemjobfield.module.css";
import ItemJobPill from "./ItemJobPill";

/**
 * logger for ItemJobField
 */
const logger = {
    info: (...args) => console.log("[ItemJobField]", ...args),
    error: (...args) => console.error("[ItemJobField]", ...args),
};

/**
 * Framer Motion animation variants for pills.
 */
const pillMotion = {
    initial: { opacity: 0, y: 18, scale: 0.96 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: -14, scale: 0.93 },
    transition: { duration: 0.22, ease: [0.16, 1, 0.3, 1] },
};

/**
 * Main ItemJobField component.
 */
export const ItemJobField = ({ value = [], onChange }) => {
    const [search, setSearch] = useState("");
    const { jobs, loading, error } = useItemJobField({ search });

    // Build map for pills: jobId → job details
    const jobsMap = useMemo(() => {
        const map = new Map();
        jobs.forEach(job => map.set(job.jobId, job));
        return map;
    }, [jobs]);

    /** Selected jobs: always show at top, can be removed by click */
    const selectedJobs = useMemo(() => {
        return value
            .map(id => jobsMap.get(id))
            .filter(Boolean);
    }, [value, jobsMap]);

    /** Remaining jobs: not already selected */
    const otherJobs = useMemo(() => {
        return jobs.filter(job => !value.includes(job.jobId));
    }, [jobs, value]);

    /**
     * Handles pill selection toggle
     * @param {number} jobId
     */
    const handleSelect = jobId => {
        logger.info("Job pill toggled", jobId);
        if (value.includes(jobId)) {
            onChange(value.filter(id => id !== jobId));
        } else {
            onChange([...value, jobId]);
        }
    };

    return (
        <div className={styles.root}>
            {/* Selected jobs pinned at top */}
            <div className={styles.selectedJobsRow}>
                <AnimatePresence>
                    {selectedJobs.length > 0 &&
                        selectedJobs.map(job => (
                            <motion.div
                                key={job.jobId}
                                layout
                                initial={pillMotion.initial}
                                animate={pillMotion.animate}
                                exit={pillMotion.exit}
                                transition={pillMotion.transition}
                            >
                                <ItemJobPill
                                    jobName={job.name}
                                    selected
                                    removable
                                    onClick={() => handleSelect(job.jobId)}
                                />
                            </motion.div>
                        ))}
                </AnimatePresence>
            </div>

            {/* Search bar with icon */}
            <div className={styles.searchBarRow}>
                <input
                    type="text"
                    className={styles.searchBar}
                    placeholder="Search jobs…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    aria-label="Search jobs"
                />
                <span className={styles.searchIcon} aria-hidden>
                    <svg width="20" height="20">
                        <circle cx="9" cy="9" r="7.5" stroke="#aaa" strokeWidth="2" fill="none"/>
                        <line x1="15.5" y1="15.5" x2="11.9" y2="11.9" stroke="#aaa" strokeWidth="2"/>
                    </svg>
                </span>
            </div>

            {/* Jobs grid (filtered or recent) */}
            <div className={styles.jobsGrid}>
                {loading ? (
                    <div className={styles.status}>Loading…</div>
                ) : error ? (
                    <div className={styles.status} style={{ color: "#c00" }}>{error}</div>
                ) : (
                    <AnimatePresence>
                        {otherJobs.length > 0 ? (
                            otherJobs.map(job => (
                                <motion.div
                                    key={job.jobId}
                                    layout
                                    initial={pillMotion.initial}
                                    animate={pillMotion.animate}
                                    exit={pillMotion.exit}
                                    transition={pillMotion.transition}
                                >
                                    <ItemJobPill
                                        jobName={job.name}
                                        selected={value.includes(job.jobId)}
                                        onClick={() => handleSelect(job.jobId)}
                                    />
                                </motion.div>
                            ))
                        ) : (
                            <motion.div
                                key="no-jobs"
                                initial={pillMotion.initial}
                                animate={pillMotion.animate}
                                exit={pillMotion.exit}
                                transition={pillMotion.transition}
                                className={styles.status}
                            >
                                No jobs found.
                            </motion.div>
                        )}
                    </AnimatePresence>
                )}
            </div>
        </div>
    );
};

export default ItemJobField;