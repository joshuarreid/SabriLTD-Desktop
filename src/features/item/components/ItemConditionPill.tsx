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
import styles from "../styles/itemconditionpill.module.css";

/**
 * logger for ItemConditionPill.
 * @constant
 */
const logger = {
    info: (...args: unknown[]) => console.log("[ItemConditionPill]", ...args),
    error: (...args: unknown[]) => console.error("[ItemConditionPill]", ...args),
};

/**
 * Maps the canonical condition name to a style class for coloring.
 * @param {string} name
 * @returns {string}
 */
const getConditionClass = (name: string | undefined) => {
    const k = String(name || "").toLowerCase();
    if (k === "damaged") return styles.damaged;
    if (k === "needs repair") return styles.needsRepair;
    if (k === "fair") return styles.fair;
    if (k === "good") return styles.good;
    if (k === "new") return styles.new;
    return styles.unknown;
};

export interface ItemConditionPillProps extends React.HTMLAttributes<HTMLSpanElement> {
    /** Canonical API/display name, e.g. "Good", "Damaged". */
    conditionName?: string;
    /** Highlights the pill as selected (border/shadow, i.e. for input case). */
    selected?: boolean;
    /** Optional additional CSS classes. */
    className?: string;
    /** If provided, renders children instead of conditionName. */
    children?: React.ReactNode;
    /** Render as span or button. */
    as?: "span" | "button";
    /** Extra props to apply if rendering as a button. */
    [key: string]: any;
}

/**
 * ItemConditionPill
 * Renders a pill-styled label for any condition value, styled using the canonical Sabri palette.
 *
 * @component
 * @param {ItemConditionPillProps} props
 * @returns {JSX.Element}
 */
export const ItemConditionPill = React.memo(
    ({
         conditionName = "",
         selected = false,
         className = "",
         children,
         as = "span",
         ...rest
     }: ItemConditionPillProps) => {
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


export default ItemConditionPill;