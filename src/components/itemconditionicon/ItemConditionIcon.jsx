import React from "react";
import PropTypes from "prop-types";
import {
    CiCirclePlus,
    CiCircleCheck,
    CiCircleMinus,
    CiCircleAlert,
    CiCircleQuestion
} from "react-icons/ci";
import { FaRegTimesCircle } from "react-icons/fa";
import styles from "./itemconditionicon.module.css";

/**
 * logger for ItemConditionIcon.
 *
 * @constant
 * @type {{info: Function, error: Function}}
 */
const logger = {
    info: (...args) => console.log("[ItemConditionIcon]", ...args),
    error: (...args) => console.error("[ItemConditionIcon]", ...args),
};

/**
 * getConditionIconConfig
 * - Returns icon and color class for an item's condition.
 *
 * @function
 * @param {string} conditionName - Canonical condition name.
 * @returns {{icon: JSX.Element, className: string}}
 */
const getConditionIconConfig = (conditionName) => {
    switch ((conditionName || "").toLowerCase()) {
        case "new":
            return {
                icon: <CiCirclePlus size={18} title="New" data-testid="condition-new"/>,
                className: styles.new,
            };
        case "good":
            return {
                icon: <CiCircleCheck size={18} title="Good" data-testid="condition-good"/>,
                className: styles.good,
            };
        case "fair":
            return {
                icon: <CiCircleMinus size={18} title="Fair" data-testid="condition-fair"/>,
                className: styles.fair,
            };
        case "needs repair":
            return {
                icon: <CiCircleAlert size={18} title="Needs Repair" data-testid="condition-needsrepair"/>,
                className: styles.needsRepair,
            };
        case "damaged":
            return {
                icon: <FaRegTimesCircle size={17} title="Damaged" data-testid="condition-damaged"/>,
                className: styles.damaged,
            };
        default:
            return {
                icon: <CiCircleQuestion size={18} title="Unknown" data-testid="condition-unknown"/>,
                className: styles.unknown,
            };
    }
};

/**
 * ItemConditionIcon
 * - Renders an icon representing item condition with semantic color.
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
        <span className={`${styles.iconWrapper} ${className}`}>
            {icon}
        </span>
    );
};

ItemConditionIcon.propTypes = {
    conditionName: PropTypes.string,
};

export default ItemConditionIcon;