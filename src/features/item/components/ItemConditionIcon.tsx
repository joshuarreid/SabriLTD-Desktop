import React from "react";
import {
    FaCirclePlus,
    FaCircleCheck,
    FaCircleMinus,
    FaCircleExclamation,
    FaCircleQuestion,
    FaCircleXmark
} from "react-icons/fa6";
import styles from "../styles/itemconditionicon.module.css";

/**
 * logger for ItemConditionIcon.
 * Provides info and error logging for component lifecycle and traceability.
 * @type {{info: Function, error: Function}}
 */
const logger = {
    info: (...args: unknown[]) => console.log("[ItemConditionIcon]", ...args),
    error: (...args: unknown[]) => console.error("[ItemConditionIcon]", ...args),
};

/**
 * getConditionIconConfig
 * Maps condition names to semantic color style and icon.
 *
 * @function
 * @param {string} conditionName - Canonical item condition name.
 * @returns {{icon: JSX.Element, className: string, label: string}}
 */
const getConditionIconConfig = (conditionName: string | undefined | null): { icon: JSX.Element, className: string, label: string } => {
    switch ((conditionName || "").toLowerCase()) {
        case "new":
            return {
                icon: <FaCirclePlus className={`${styles.iconSymbol} ${styles.newSymbol}`} size={18} title="New" data-testid="condition-new" />,
                className: styles.new,
                label: "New"
            };
        case "good":
            return {
                icon: <FaCircleCheck className={`${styles.iconSymbol} ${styles.goodSymbol}`} size={18} title="Good" data-testid="condition-good" />,
                className: styles.good,
                label: "Good"
            };
        case "fair":
            return {
                icon: <FaCircleMinus className={`${styles.iconSymbol} ${styles.fairSymbol}`} size={18} title="Fair" data-testid="condition-fair" />,
                className: styles.fair,
                label: "Fair"
            };
        case "needs repair":
            return {
                icon: <FaCircleExclamation className={`${styles.iconSymbol} ${styles.needsRepairSymbol}`} size={18} title="Needs Repair" data-testid="condition-needsrepair" />,
                className: styles.needsRepair,
                label: "Needs Repair"
            };
        case "damaged":
            return {
                icon: <FaCircleXmark className={`${styles.iconSymbol} ${styles.damagedSymbol}`} size={18} title="Damaged" data-testid="condition-damaged" />,
                className: styles.damaged,
                label: "Damaged"
            };
        default:
            return {
                icon: <FaCircleQuestion className={`${styles.iconSymbol} ${styles.unknownSymbol}`} size={18} title="Unknown" data-testid="condition-unknown" />,
                className: styles.unknown,
                label: "Unknown"
            };
    }
};

export interface ItemConditionIconProps {
    /**
     * Canonical item condition name (e.g., "Good", "Damaged").
     */
    conditionName?: string | null;
}

/**
 * ItemConditionIcon
 * Renders a semantic condition symbol with greyed-out text label to the right.
 *
 * @component
 * @param {ItemConditionIconProps} props
 * @returns {JSX.Element}
 */
const ItemConditionIcon: React.FC<ItemConditionIconProps> = ({ conditionName }) => {
    logger.info("Render", { conditionName });

    const { icon, className, label } = getConditionIconConfig(conditionName);

    return (
        <span className={styles.conditionRow}>
            <span className={`${styles.iconWrapper} ${className}`}>
                {icon}
            </span>
            <span className={styles.conditionLabel}>
                {label}
            </span>
        </span>
    );
};


export default ItemConditionIcon;