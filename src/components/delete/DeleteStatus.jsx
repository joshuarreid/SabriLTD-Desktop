import React from "react";
import styles from "./deletestatus.module.css";

/**
 * Logger for DeleteStatus component.
 * @constant
 * @type {{info: Function, error: Function}}
 */
const logger = {
    info: (...args) => console.log('[DeleteStatus]', ...args),
    error: (...args) => console.error('[DeleteStatus]', ...args),
};

/**
 * Icon for "Deleting" (orange bold spinner).
 * @returns {JSX.Element}
 */
export const DeletingSpinner = () => (
    <svg className={styles.iconSpin} width="22" height="22" viewBox="0 0 22 22">
        <circle
            cx="11"
            cy="11"
            r="9"
            stroke="#e2762c"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
            strokeDasharray="13 19"
        />
    </svg>
);

/**
 * Icon for "Deleted" (red trash/check).
 * @returns {JSX.Element}
 */
export const DeletedCheck = () => (
    <svg width="22" height="22" viewBox="0 0 22 22">
        <circle cx="11" cy="11" r="10" fill="#e04545" />
        <polyline points="6,12 10,16 16,7" fill="none" stroke="#fff" strokeWidth="2" />
    </svg>
);

/**
 * DeleteStatus
 * - Displays a status icon and message for deleting/deleted state.
 *
 * @component
 * @param {Object} props
 * @param {'deleting'|'deleted'|'idle'|'error'} props.status - Current delete status.
 * @param {string} [props.deletingText='Deleting...'] - Message for deleting state.
 * @param {string} [props.deletedText='Deleted'] - Message for deleted state.
 * @returns {JSX.Element|null}
 */
const DeleteStatus = ({
                          status,
                          deletingText = "Deleting...",
                          deletedText = "Deleted",
                      }) => {
    logger.info("DeleteStatus rendered with status:", status);

    if (status === "deleting") {
        return (
            <span className={styles.deleteState}>
                <DeletingSpinner /> {deletingText}
            </span>
        );
    }
    if (status === "deleted") {
        return (
            <span className={styles.deleteState}>
                <DeletedCheck /> {deletedText}
            </span>
        );
    }
    // No indicator for idle/error
    return null;
};

export default DeleteStatus;