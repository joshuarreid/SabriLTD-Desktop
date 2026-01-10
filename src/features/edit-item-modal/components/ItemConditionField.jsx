/**
 * ItemConditionField.jsx
 *
 * Fetches item conditions from the API and renders horizontal pill-style selectable buttons
 * within an input-styled box. Pills are washed out until selected; clicking a selected pill will deselect it.
 * Handles loading, error, selection, and styling per Bulletproof React.
 *
 * @component
 * @param {object} props
 * @param {number|null} props.value - The currently selected conditionId.
 * @param {Function} props.onChange - Called with the new conditionId when a condition is selected or deselected.
 * @returns {JSX.Element}
 */
import React from "react";
import { useItemConditionField } from "../hooks/useItemConditionField";
import styles from "../styles/itemconditionfield.module.css";

/**
 * Maps canonical API condition name to a style suffix for color pill.
 * @param {string} name
 * @returns {string}
 */
const getConditionStyleClass = (name) => {
    const k = String(name).toLowerCase();
    if (k === "damaged") return styles['pill-damaged'];
    if (k === "needs repair") return styles['pill-needsrepair'];
    if (k === "fair") return styles['pill-fair'];
    if (k === "good") return styles['pill-good'];
    if (k === "new") return styles['pill-new'];
    return "";
};

/**
 * Ordered canonical conditions for UX.
 * @type {string[]}
 */
const ORDERED_CONDITIONS = ["Damaged", "Needs Repair", "Fair", "Good", "New"];

const logger = {
    info: (...args) => console.log("[ItemConditionField]", ...args),
    error: (...args) => console.error("[ItemConditionField]", ...args),
};

export const ItemConditionField = ({ value, onChange }) => {
    const { options, loading, error } = useItemConditionField();

    logger.info("ItemConditionField rendered", { value, options, loading, error });

    // Sort by UX order constant
    const orderedOptions = React.useMemo(() => {
        if (!options) return [];
        return [...options].sort(
            (a, b) =>
                ORDERED_CONDITIONS.indexOf(a.name) - ORDERED_CONDITIONS.indexOf(b.name)
        );
    }, [options]);

    /**
     * Handles selection toggle for pills.
     *
     * @param {number} clickedId
     */
    const handlePillClick = (clickedId) => {
        logger.info("Pill clicked", clickedId);
        // Deselect if already selected, otherwise select
        onChange?.(value === clickedId ? null : clickedId);
    };

    return (
        <div className={styles.root}>
            <label htmlFor="item-condition" className={styles.label}>
                Condition
            </label>
            <div className={styles.inputLikeBox} tabIndex={0} aria-label="Item condition selector">
                {loading ? (
                    <div className={styles.status}>Loading…</div>
                ) : error ? (
                    <div className={styles.status} style={{ color: "#c00" }}>{error}</div>
                ) : (
                    <div className={styles.pillRow}>
                        {orderedOptions.map(opt => {
                            const pillClass = getConditionStyleClass(opt.name);
                            const isSelected = opt.conditionId === value;
                            return (
                                <button
                                    key={opt.conditionId}
                                    type="button"
                                    className={[
                                        styles.pill,
                                        pillClass,
                                        isSelected ? styles.pillSelected : ""
                                    ].join(" ")}
                                    aria-pressed={isSelected}
                                    onClick={() => handlePillClick(opt.conditionId)}
                                    tabIndex={0}
                                >
                                    {opt.name}
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ItemConditionField;