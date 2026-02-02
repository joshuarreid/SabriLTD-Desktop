import React from "react";
import PropTypes from "prop-types";
import {
    FaCirclePlus,
    FaCircleCheck,
    FaCircleMinus,
    FaCircleExclamation,
    FaCircleQuestion,
    FaCircleXmark
} from "react-icons/fa6";
import styles from "./itemconditionicon.module.css";

/**
 * logger for ItemConditionIcon.
 * @constant
 * @type {{info: Function, error: Function}}
 */
const logger = {
    info: (...args) => console.log("[ItemConditionIcon]", ...args),
    error: (...args) => console.error("[ItemConditionIcon]", ...args),
};

/**
 * getConditionIconConfig
 * Returns icon and color class for an item's condition.
 * Symbol uses semantic color, and the text is shown to the right.
 *
 * @function
 * @param {string} conditionName - Canonical condition name.
 * @returns {{icon: JSX.Element, className: string}}
 */
const getConditionIconConfig = (conditionName) => {
    switch ((conditionName || "").toLowerCase()) {
        case "new":
            return {
                icon: <FaCirclePlus className={`${styles.iconSymbol} ${styles.newSymbol}`} size={18} title="New" data-testid="condition-new" />,
                className: styles.new,
            };
        case "good":
            return {
                icon: <FaCircleCheck className={`${styles.iconSymbol} ${styles.goodSymbol}`} size={18} title="Good" data-testid="condition-good" />,
                className: styles.good,
            };
        case "fair":
            return {
                icon: <FaCircleMinus className={`${styles.iconSymbol} ${styles.fairSymbol}`} size={18} title="Fair" data-testid="condition-fair" />,
                className: styles.fair,
            };
        case "needs repair":
            return {
                icon: <FaCircleExclamation className={`${styles.iconSymbol} ${styles.needsRepairSymbol}`} size={18} title="Needs Repair" data-testid="condition-needsrepair" />,
                className: styles.needsRepair,
            };
        case "damaged":
            return {
                icon: <FaCircleXmark className={`${styles.iconSymbol} ${styles.damagedSymbol}`} size={18} title="Damaged" data-testid="condition-damaged" />,
                className: styles.damaged,
            };
        default:
            return {
                icon: <FaCircleQuestion className={`${styles.iconSymbol} ${styles.unknownSymbol}`} size={18} title="Unknown" data-testid="condition-unknown" />,
                className: styles.unknown,
            };
    }
};

/**
 * ItemConditionIcon
 * Renders a semantic condition symbol with text label to the right.
 *
 * @component
 * @param {Object} props
 * @param {string} props.conditionName - Item condition name.
 * @returns {JSX.Element}
 */
const ItemConditionIcon = ({ conditionName }) => {
    logger.info("Render", { conditionName });

    const { icon, className } = getConditionIconConfig(conditionName);

    return (
        <span className={styles.conditionRow}>
            <span className={`${styles.iconWrapper} ${className}`}>
                {icon}
            </span>
            <span className={styles.conditionLabel}>
                {conditionName || "Unknown"}
            </span>
        </span>
    );
};

ItemConditionIcon.propTypes = {
    conditionName: PropTypes.string,
};

export default ItemConditionIcon;