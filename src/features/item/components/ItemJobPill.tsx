/**
 * ItemJobPill.jsx
 *
 * Single pill for job association, can be selected or removable,
 * follows Bulletproof React styled pill convention.
 *
 * @component
 * @param {string} jobName
 * @param {boolean} selected
 * @param {boolean} removable - renders 'x' icon for removable pills
 * @param {function} onClick
 * @returns {JSX.Element}
 */
import React from "react";
import styles from "../styles/itemjobfield.module.css";

const logger = {
    info: (...args) => console.log("[ItemJobPill]", ...args),
    error: (...args) => console.error("[ItemJobPill]", ...args),
};

export interface ItemJobPillProps {
    /** Job name to display in the pill. */
    jobName: string;
    /** Whether the pill is selected. */
    selected?: boolean;
    /** Whether the pill is removable (shows '×' icon). */
    removable?: boolean;
    /** Click handler for the pill. */
    onClick?: () => void;
}

/**
 * ItemJobPill
 * Single pill for job association, can be selected or removable.
 *
 * @component
 * @param {ItemJobPillProps} props
 * @returns {JSX.Element}
 */
export const ItemJobPill: React.FC<ItemJobPillProps> = ({ jobName, selected = false, removable = false, onClick }) => {
    logger.info("ItemJobPill rendered", { jobName, selected, removable });
    return (
        <button
            type="button"
            className={[
                styles.jobPill,
                selected ? styles.selected : "",
                removable ? styles.removable : ""
            ].join(" ")}
            aria-pressed={selected}
            onClick={onClick}
            tabIndex={0}
        >
            {jobName}
            {removable ? (
                <span className={styles.removeIcon} aria-label="Remove">
                    ×
                </span>
            ) : null}
        </button>
    );
};

export default ItemJobPill;