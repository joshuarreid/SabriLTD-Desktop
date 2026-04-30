import React from "react";
import styles from "./confirmationmodal.module.css";
import DeleteStatus from "../delete/DeleteStatus";


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
 * @param {boolean} [props.confirmDisabled] - If true, disables confirm/delete button (e.g. for current user).
 * @param {'deleting'|'deleted'|'idle'|'error'} [props.deleteStatus] - Visual delete status badge, if present.
 * @param {string} [props.deletingText] - Custom deleting message for status.
 * @param {string} [props.deletedText] - Custom deleted message for status.
 * @returns {JSX.Element|null}
 */
const logger = {
    info: (...args) => console.log('[ConfirmationModal]', ...args),
    error: (...args) => console.error('[ConfirmationModal]', ...args),
};

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
                               confirmDisabled = false,
                               // --------- new props below ----------
                               deleteStatus = "idle",
                               deletingText = "Deleting...",
                               deletedText = "Deleted",
                           }) => {
    logger.info('ConfirmationModal rendered', { open, deleteStatus });

    // Remove local confirmClicked state
    // Only rely on props for disabling the button

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

                {/* DeleteStatus badge: shows above actions if deleting/deleted */}
                {["deleting", "deleted", "error"].includes(deleteStatus) && (
                    <div style={{ marginBottom: 10 }}>
                        <DeleteStatus
                            status={deleteStatus}
                            deletingText={deletingText}
                            deletedText={deletedText}
                        />
                    </div>
                )}

                <div className={styles.actions}>
                    <button
                        className={confirmClass || styles.deleteButton}
                        onClick={onConfirm}
                        disabled={
                            isConfirmLoading ||
                            confirmDisabled ||
                            deleteStatus === "deleting" ||
                            deleteStatus === "deleted"
                        }
                        type="button"
                        aria-disabled={
                            isConfirmLoading ||
                            confirmDisabled ||
                            deleteStatus === "deleting" ||
                            deleteStatus === "deleted"
                        }
                        tabIndex={0}
                    >
                        {isConfirmLoading || deleteStatus === "deleting"
                            ? "..."
                            : confirmText}
                    </button>
                    <button
                        className={cancelClass || styles.cancelButton}
                        onClick={onCancel}
                        disabled={isCancelLoading || deleteStatus === "deleting"}
                        type="button"
                        aria-disabled={isCancelLoading || deleteStatus === "deleting"}
                        tabIndex={0}
                    >
                        {cancelText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;