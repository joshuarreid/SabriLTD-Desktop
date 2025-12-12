import React from "react";
import styles from "./confirmationmodal.module.css";

/**
 * ConfirmationModal
 * A reusable, universal confirmation modal for destructive or important actions.
 *
 * @component
 * @param {object} props
 * @param {boolean} props.open - Whether the modal is visible.
 * @param {function} props.onCancel - Fired when cancel/close is triggered.
 * @param {function} props.onConfirm - Fired when the user confirms the action.
 * @param {string|JSX.Element} props.title - Modal title (bold/question).
 * @param {string|JSX.Element} props.description - Extra description shown below the title.
 * @param {string} [props.confirmText="Delete"] - Primary (destructive) action text.
 * @param {string} [props.cancelText="Cancel"] - Cancel/close text.
 * @param {boolean} [props.isConfirmLoading] - If true, disables confirm button and shows loading.
 * @param {boolean} [props.isCancelLoading] - If true, disables cancel button and shows loading.
 * @param {string} [props.confirmClass] - Custom class for the Confirm button.
 * @param {string} [props.cancelClass] - Custom class for the Cancel button.
 * @returns {JSX.Element|null}
 */
const ConfirmationModal = ({
                               open,
                               onCancel,
                               onConfirm,
                               title,
                               description,
                               confirmText = "Delete",
                               cancelText = "Cancel",
                               isConfirmLoading = false,
                               isCancelLoading = false,
                               confirmClass,
                               cancelClass,
                           }) => {
    if (!open) return null;

    return (
        <div
            className={styles.overlay}
            onClick={onCancel}
            tabIndex={-1}
            aria-modal="true"
            data-testid="confirmation-modal"
        >
            <div
                className={styles.modal}
                onClick={e => e.stopPropagation()}
                tabIndex={0}
                role="dialog"
                aria-modal="true"
                aria-labelledby="confirmation-modal-title"
            >
                {title && (
                    <h3 className={styles.title} id="confirmation-modal-title">
                        {title}
                    </h3>
                )}
                {description && (
                    <div className={styles.description}>{description}</div>
                )}
                <div className={styles.actions}>
                    <button
                        className={confirmClass || styles.deleteButton}
                        onClick={onConfirm}
                        disabled={isConfirmLoading}
                        type="button"
                    >
                        {isConfirmLoading ? "..." : confirmText}
                    </button>
                    <button
                        className={cancelClass || styles.cancelButton}
                        onClick={onCancel}
                        disabled={isCancelLoading}
                        type="button"
                    >
                        {cancelText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;