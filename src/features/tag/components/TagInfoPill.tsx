import React from "react";
import styles from "../styles/taginfopill.module.css";

interface TagInfoPillProps {
    label: string;
    active?: boolean;
    onClick?: () => void;
    onDelete?: () => void;
}

/**
 * logger for TagInfoPill component.
 *
 * @constant
 * @type {{info: Function, error: Function}}
 */
const logger = {
    info: (...args: unknown[]) => console.log("[TagInfoPill]", ...args),
    error: (...args: unknown[]) => console.error("[TagInfoPill]", ...args),
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
const TagInfoPill: React.FC<TagInfoPillProps> = ({ label, active = false, onClick, onDelete }) => {
    logger.info("TagInfoPill rendered", { label, active });

    /**
     * Handles click on the delete icon.
     *
     * @param {React.MouseEvent<HTMLButtonElement>} event
     * @returns {void}
     */
    const handleDeleteClick = (event: React.MouseEvent<HTMLButtonElement>) => {
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
            {onDelete && (
                <button
                    type="button"
                    className={styles.deleteBtn}
                    aria-label={`Delete tag ${label}`}
                    onClick={handleDeleteClick}
                >
                    ×
                </button>
            )}
        </span>
    );
};

export default TagInfoPill;