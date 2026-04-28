import React from "react";
import styles from "./alphabeticalsortfilter.module.css";
import { FaSortAmountUp, FaSortAmountDown } from "react-icons/fa";

interface AlphabeticalSortFilterProps {
    value: "a-z" | "z-a";
    onChange?: (value: "a-z" | "z-a") => void;
}

/**
 * AlphabeticalSortFilter
 * Minimalistic icon-only toggle for sorting A-Z/Z-A, styled to match "outline icon button" project style.
 *
 * @component
 * @param {object} props
 * @param {string} props.value - Current selected sort key ("a-z" or "z-a").
 * @param {function} props.onChange - Callback with the new sort key.
 * @returns {JSX.Element}
 */
const AlphabeticalSortFilter: React.FC<AlphabeticalSortFilterProps> = ({ value, onChange }) => {
    const logger = {
        info: (...args: any[]) => console.log("[AlphabeticalSortFilter]", ...args),
        error: (...args: any[]) => console.error("[AlphabeticalSortFilter]", ...args),
    };

    /**
     * Handles toggle between "a-z" and "z-a".
     * @function handleToggle
     */
    const handleToggle = () => {
        const nextKey: "a-z" | "z-a" = value === "a-z" ? "z-a" : "a-z";
        logger.info("Sort toggled", { from: value, to: nextKey });
        if (onChange) onChange(nextKey);
    };

    const Icon = value === "z-a" ? FaSortAmountDown : FaSortAmountUp;
    const label = value === "z-a" ? "Sort Z to A" : "Sort A to Z";

    return (
        <button
            type="button"
            className={styles.sortToggleButton}
            onClick={handleToggle}
            aria-label={label}
            title={label}
        >
            <Icon className={styles.sortToggleIcon} size={20} />
        </button>
    );
};

export default AlphabeticalSortFilter;