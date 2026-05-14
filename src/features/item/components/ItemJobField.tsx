/**
 * ItemJobField.jsx
 *
 * Bulletproof React job selection field for item:
 * - Selected jobs shown as pills at the top (removable by click), never filtered by search.
 * - Search bar below for fuzzy lookup (API-driven).
 * - Below search bar is a responsive pill grid of jobs (recent or filtered).
 * - Clicking a job toggles selection; selected jobs are pinned at the top and remain visible even when searching.
 * - Keeps the selected pills section static in height and position, minimizing resize/jump.
 * - Uses framer-motion for pill animations (entry/exit/move), matching job screen UX.
 * - Caches selected job label so selected pills never disappear when searching.
 *
 * @component
 * @param {Object} props
 * @param {Array<number>} props.value - Array of selected jobIds.
 * @param {Function} props.onChange - Called with updated array of selected jobIds.
 * @returns {JSX.Element}
 */
import React, { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import useItemJobField from "../hooks/useItemJobField.ts";
import styles from "../styles/itemjobfield.module.css";
import ItemJobPill from "./ItemJobPill";

/**
 * logger for ItemJobField
 * @constant
 */
const logger = {
    info: (...args) => console.log("[ItemJobField]", ...args),
    error: (...args) => console.error("[ItemJobField]", ...args),
};

/**
 * Framer Motion animation variants for pills.
 * @type {Object}
 */
const pillMotion = {
    initial: { opacity: 0, y: 14, scale: 0.95 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: -11, scale: 0.90 },
    transition: { duration: 0.18, ease: [0.16, 1, 0.3, 1] },
};

/**
 * ItemJobField
 * - Selected jobs remain visible always (not filtered by search).
 * - Search only affects the grid job list below.
 *
 * @component
 * @param {ItemJobFieldProps} props
 * @returns {JSX.Element}
 */
export const ItemJobField: React.FC<ItemJobFieldProps> = ({ value = [], onChange }) => {
    const [search, setSearch] = useState<string>("");

    // Fetch jobs via business logic hook
    const { jobs, loading, error }: { jobs: ItemJob[]; loading: boolean; error: string | null } = useItemJobField({ search });

    // Cache of all jobs for static selected label rendering, typed as jobId -> job shape.
    const jobsCache = useRef<Map<number, ItemJob>>(new Map());

    useEffect(() => {
        jobs.forEach(job => {
            if (!jobsCache.current.has(job.jobId)) {
                jobsCache.current.set(job.jobId, job);
            }
        });
    }, [jobs]);

    /**
     * Selected jobs (never filtered by search).
     * Uses jobsCache for labels (fallback to jobId if missing).
     */
    const selectedJobs: ItemJob[] = useMemo(() => {
        return value.map(
            id => jobsCache.current.get(id) || { jobId: id, name: `Job #${id}` }
        );
    }, [value]);

    /**
     * Jobs to show in grid, never includes selected jobs.
     */
    const otherJobs: ItemJob[] = useMemo(() => {
        return jobs.filter(job => !value.includes(job.jobId));
    }, [jobs, value]);

    /**
     * Handles pill selection toggle.
     * @param {number} jobId
     */
    const handleSelect = useCallback((jobId: number) => {
        logger.info("Job pill toggled", jobId);
        if (value.includes(jobId)) {
            onChange(value.filter(id => id !== jobId));
        } else {
            onChange([...value, jobId]);
        }
    }, [value, onChange]);

    return (
        <div className={styles.root}>
            {/* Selected jobs always shown, never search filtered */}
            <label htmlFor="item-condition" className={styles.label}>
                Jobs
            </label>
            <div className={styles.selectedJobsRow}>
                <AnimatePresence>
                    {selectedJobs.map(job => (
                        <motion.div
                            key={job.jobId}
                            initial={pillMotion.initial}
                            animate={pillMotion.animate}
                            exit={pillMotion.exit}
                            transition={pillMotion.transition}
                            style={{ display: "inline-block" }}
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

            {/* Search bar, icon left */}
            <div className={styles.searchBarRow}>
                <span className={styles.searchIcon} aria-hidden>
                    <svg width="19" height="19" viewBox="0 0 20 20">
                        <circle cx="8.5" cy="8.5" r="7" stroke="#bbb" strokeWidth="2" fill="none"/>
                        <line x1="15.2" y1="15.2" x2="11.8" y2="11.8" stroke="#bbb" strokeWidth="2"/>
                    </svg>
                </span>
                <input
                    type="text"
                    className={styles.searchBar}
                    placeholder="Search jobs…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    aria-label="Search jobs"
                    autoComplete="off"
                />
            </div>

            {/* Search results grid, animated */}
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
                                    initial={pillMotion.initial}
                                    animate={pillMotion.animate}
                                    exit={pillMotion.exit}
                                    transition={pillMotion.transition}
                                    style={{ display: "inline-block" }}
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

export interface ItemJob {
    jobId: number;
    name: string;
}

export interface ItemJobFieldProps {
    /** Array of selected jobIds. */
    value: number[];
    /** Called with updated array of selected jobIds. */
    onChange: (jobIds: number[]) => void;
}
