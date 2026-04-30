import React from "react";
import styles from "../styles/taginfopill.module.css";

/**
 * logger for TagInfoPill component.
 *
 * @constant
 * @type {{info: Function, error: Function}}
 */
const logger = {
    info: (...args) => console.log("[TagInfoPill]", ...args),
    error: (...args) => console.error("[TagInfoPill]", ...args),
};

/**
 * TagInfoPill
 * - Renders a single tag pill with label and optional delete "x" control.
 *
 * @component
 * @param {object} props
 * @param {string} props.label - Tag label.
 * @param {boolean} [props.active] - Is tag selected? (future use)
 * @param {function} [props.onClick] - Optional click handler for the pill body.
 * @param {function} [props.onDelete] - Optional handler invoked when the delete "x" is clicked.
 * @returns {JSX.Element}
 */
const TagInfoPill = ({ label, active = false, onClick, onDelete }) => {
    logger.info("TagInfoPill rendered", { label, active });

    /**
     * Handles click on the delete icon.
     *
     * @param {React.MouseEvent<HTMLButtonElement>} event
     * @returns {void}
     */
    const handleDeleteClick = (event) => {
        event.stopPropagation();
        if (onDelete) {
            onDelete();
        }
    };

    return (
        <span
            className={`${styles.pill} ${active ? styles.pillActive : ""}`}
            tabIndex={0}
            role="button"
            onClick={onClick}
        >
            <span className={styles.pillLabel}>{label}</span>
            {/* Always render the X for now; if you only want it sometimes, wrap in {onDelete && ...} */}
            <button
                type="button"
                className={styles.deleteButton}
                aria-label={`Remove tag ${label}`}
                onClick={handleDeleteClick}
            >
                ×
            </button>
        </span>
    );
};

export default TagInfoPill;