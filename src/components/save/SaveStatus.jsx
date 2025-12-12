import React from "react";
import styles from "./savestatus.module.css";

/**
 * Icon for "Saving changes" (orange spinner).
 * @returns {JSX.Element}
 */
export const SavingSpinner = () => (
    <svg className={styles.iconSpin} width="22" height="22" viewBox="0 0 22 22">
        <circle
            cx="11" cy="11" r="9"
            stroke="#e2762c"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
            strokeDasharray="12 20"
        />
    </svg>
);

/**
 * Icon for "Saved" (green check).
 * @returns {JSX.Element}
 */
export const SavedCheck = () => (
    <svg width="22" height="22" viewBox="0 0 22 22">
        <circle cx="11" cy="11" r="10" fill="#4bbe4b" />
        <polyline points="6,12 10,16 16,7" fill="none" stroke="#fff" strokeWidth="2" />
    </svg>
);

/**
 * SaveStatus
 * - Displays a status icon and message for saving/saved state.
 *
 * @component
 * @param {Object} props
 * @param {'saving'|'saved'|'idle'|'error'} props.status - Current save status.
 * @param {string} [props.savingText='Saving changes'] - Message for saving state.
 * @param {string} [props.savedText='Saved'] - Message for saved state.
 * @returns {JSX.Element|null}
 */
const SaveStatus = ({
                        status,
                        savingText = "Saving changes",
                        savedText = "Saved",
                    }) => {
    if (status === "saving") {
        return (
            <span className={styles.saveState}>
        <SavingSpinner /> {savingText}
      </span>
        );
    }
    if (status === "saved") {
        return (
            <span className={styles.saveState}>
        <SavedCheck /> {savedText}
      </span>
        );
    }
    // No indicator for idle/error
    return null;
};

export default SaveStatus;