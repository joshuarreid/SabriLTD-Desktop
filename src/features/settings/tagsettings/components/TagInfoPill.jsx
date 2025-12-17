import React from "react";
import styles from "../styles/taginfopill.module.css";

/**
 * TagInfoPill
 * - Renders a single tag pill with basic highlight/hover for tag lists.
 * @component
 * @param {object} props
 * @param {string} props.label - Tag label.
 * @param {boolean} [props.active] - Is tag selected? (future use)
 * @param {function} [props.onClick] - Optional click for tag.
 * @returns {JSX.Element}
 */
const logger = {
    info: (...args) => console.log("[TagInfoPill]", ...args),
    error: (...args) => console.error("[TagInfoPill]", ...args),
};

const TagInfoPill = ({ label, active = false, onClick }) => {
    logger.info("TagInfoPill rendered", { label, active });
    return (
        <span
            className={`${styles.pill} ${active ? styles.pillActive : ""}`}
            tabIndex={0}
            role="button"
            onClick={onClick}
        >
      {label}
    </span>
    );
};

export default TagInfoPill;