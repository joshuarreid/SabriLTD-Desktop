/**
 * ItemConditionPill.jsx
 *
 * Renders a status pill for an item's condition (e.g., "Good", "Damaged") consistent with Sabri inventory card and input UX.
 * Colors and border are set globally in App CSS for each canonical condition.
 * Follows Bulletproof React conventions: UI only.
 *
 * @component
 * @param {Object} props
 * @param {string} [props.conditionName] - Canonical API/display name, e.g. "Good", "Damaged".
 * @param {boolean} [props.selected] - Highlights the pill as selected (border/shadow, i.e. for input case).
 * @param {string} [props.className] - Optional additional CSS classes.
 * @param {React.ReactNode} [props.children] - If provided, renders children instead of conditionName.
 * @param {React.ButtonHTMLAttributes<HTMLButtonElement>} [props.buttonProps] - Extra props to apply if rendering as a button.
 * @returns {JSX.Element}
 */
import React from "react";
import PropTypes from "prop-types";
import styles from "../styles/itemconditionpill.module.css";

/**
 * logger for ItemConditionPill.
 * @constant
 */
const logger = {
    info: (...args) => console.log("[ItemConditionPill]", ...args),
    error: (...args) => console.error("[ItemConditionPill]", ...args),
};

/**
 * Maps the canonical condition name to a style class for coloring.
 * @param {string} name
 * @returns {string}
 */
const getConditionClass = (name) => {
    const k = String(name || "").toLowerCase();
    if (k === "damaged") return styles.damaged;
    if (k === "needs repair") return styles.needsRepair;
    if (k === "fair") return styles.fair;
    if (k === "good") return styles.good;
    if (k === "new") return styles.new;
    return styles.unknown;
};

/**
 * ItemConditionPill
 * Renders a pill-styled label for any condition value, styled using the canonical Sabri palette.
 */
export const ItemConditionPill = React.memo(
    ({
         conditionName,
         selected = false,
         className = "",
         children,
         as = "span",
         ...rest
     }) => {
        logger.info("Rendered", { conditionName, selected });

        const Tag = as === "button" ? "button" : "span";
        const pillClass = [
            styles.pill,
            getConditionClass(conditionName),
            selected ? styles.selected : "",
            className,
        ]
            .filter(Boolean)
            .join(" ");

        // Attach type for button element
        const tagProps =
            Tag === "button" ? { type: "button", ...rest } : rest;

        return (
            <Tag className={pillClass} {...tagProps}>
                {children ?? conditionName ?? "Unknown"}
            </Tag>
        );
    }
);

ItemConditionPill.propTypes = {
    conditionName: PropTypes.string,
    selected: PropTypes.bool,
    className: PropTypes.string,
    as: PropTypes.oneOf(["span", "button"]),
    children: PropTypes.node,
};

ItemConditionPill.defaultProps = {
    conditionName: "",
    selected: false,
    className: "",
    as: "span",
    children: undefined,
};

export default ItemConditionPill;