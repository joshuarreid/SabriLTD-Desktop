/**
 * ItemConditionField
 *
 * Fetches item conditions from the API and renders horizontal pill-style selectable buttons
 * within an input-styled box. Uses the shared ItemConditionPill for condition rendering.
 * Pills are washed out until selected; clicking a selected pill will deselect it.
 * Follows Bulletproof React conventions and pin UX standards.
 *
 * @component
 * @param {ItemConditionFieldProps} props
 * @returns {JSX.Element}
 */
import React from "react";
import { useItemConditionField } from "../hooks/useItemConditionField";
import styles from "../styles/itemconditionfield.module.css";
import ItemConditionPill from "./ItemConditionPill";

/**
 * Ordered canonical conditions for UX.
 * @type {string[]}
 */
const ORDERED_CONDITIONS = ["Damaged", "Needs Repair", "Fair", "Good", "New"];

/**
 * logger for ItemConditionField.
 */
const logger = {
    info: (...args: unknown[]) => console.log("[ItemConditionField]", ...args),
    error: (...args: unknown[]) => console.error("[ItemConditionField]", ...args),
};

export interface ItemConditionFieldProps {
    value: number | null;
    onChange?: (conditionId: number | null) => void;
}

/**
 * ItemConditionField
 *
 * Fetches item conditions from the API and renders horizontal pill-style selectable buttons
 * within an input-styled box. Uses the shared ItemConditionPill for condition rendering.
 * Pills are washed out until selected; clicking a selected pill will deselect it.
 * Follows Bulletproof React conventions and pin UX standards.
 *
 * @component
 * @param {ItemConditionFieldProps} props
 * @returns {JSX.Element}
 */
export const ItemConditionField: React.FC<ItemConditionFieldProps> = ({ value, onChange }) => {
    const { options, loading, error } = useItemConditionField();

    logger.info("ItemConditionField rendered", { value, options, loading, error });

    // Sort options according to canonical UX order.
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
    const handlePillClick = (clickedId: number) => {
        logger.info("Pill clicked", clickedId);
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
                        {orderedOptions.map(opt => (
                            <ItemConditionPill
                                key={opt.conditionId}
                                conditionName={opt.name}
                                selected={opt.conditionId === value}
                                as="button"
                                aria-pressed={opt.conditionId === value}
                                onClick={() => handlePillClick(opt.conditionId)}
                                tabIndex={0}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ItemConditionField;