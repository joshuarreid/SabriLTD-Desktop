import React from "react";
import styles from "../../features/profile/styles/userprofilescreen.module.css";
import modalStyles from "./edituserprofilemodal.module.css";
import SaveStatus from "../save/SaveStatus";
import { useEditUserProfileModal } from "./useEditUserProfileModal";

/**
 * EditUserProfileModal
 * Modal for editing or adding a user's basic profile (name & email).
 *
 * @param {object} props
 * @param {object} props.user - User object to edit {userId, name, email}. Use {name: '', email: ''} for add mode.
 * @param {boolean} props.open - Modal open state.
 * @param {boolean} props.isSaving - If the save action is pending.
 * @param {function} props.onSave - Receives (userId, {name, email}) on submit.
 * @param {function} props.onClose - Called on modal backdrop or cancel.
 * @param {string|null} props.error - Error message string (optional).
 * @param {'saving'|'saved'|'idle'|'error'} [props.saveState] - Current save state for SaveStatus indicator.
 * @returns {JSX.Element|null}
 */
const logger = {
    info: (...args) => console.log("[EditUserProfileModal]", ...args),
    error: (...args) => console.error("[EditUserProfileModal]", ...args),
};

const EditUserProfileModal = ({
                                  user,
                                  open,
                                  isSaving,
                                  onSave,
                                  onClose,
                                  error,
                                  saveState = "idle"
                              }) => {
    const {
        draft,
        formError,
        setFormError,
        handleChange,
        handleSubmit
    } = useEditUserProfileModal(user, isSaving);

    if (!open || !user) return null;

    /**
     * Handles cancel (closes modal and resets error).
     */
    const handleCancel = () => {
        setFormError(null);
        logger.info("Modal cancelled");
        onClose();
    };

    /**
     * Determines if in add or edit mode.
     * Add mode is when there is no userId and both name/email are empty.
     */
    const isAddUser = !user.userId && (!user.name || user.name === "") && (!user.email || user.email === "");

    return (
        <div
            className={modalStyles.modalOverlay}
            onClick={handleCancel}
            tabIndex={-1}
            aria-modal="true"
        >
            <div
                className={modalStyles.modalCard}
                onClick={(e) => e.stopPropagation()}
                tabIndex={0}
                role="dialog"
                aria-modal="true"
                aria-labelledby="edit-modal-title"
            >
                <h2 className={styles.profileTitle} id="edit-modal-title">
                    {isAddUser ? "Add User" : "Edit User"}
                </h2>
                <form
                    className={styles.profileForm}
                    onSubmit={(e) => handleSubmit(e, onSave)}
                >
                    <div className={styles.formGroup}>
                        <label htmlFor="edit-name">Name</label>
                        <input
                            id="edit-name"
                            name="name"
                            type="text"
                            value={draft.name}
                            onChange={handleChange}
                            autoComplete="off"
                            className={styles.input}
                            disabled={isSaving}
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label htmlFor="edit-email">Email</label>
                        <input
                            id="edit-email"
                            name="email"
                            type="email"
                            value={draft.email}
                            onChange={handleChange}
                            autoComplete="off"
                            className={styles.input}
                            disabled={isSaving}
                        />
                    </div>
                    {(formError || error) && (
                        <div className={styles.errorMsg}>{formError || error}</div>
                    )}
                    <div className={styles.formActions}>
                        <button
                            type="submit"
                            className={styles.saveButton}
                            disabled={isSaving}
                            aria-disabled={isSaving}
                        >
                            Save
                        </button>
                        <button
                            type="button"
                            className={styles.resetButton}
                            onClick={handleCancel}
                            disabled={isSaving}
                            aria-disabled={isSaving}
                        >
                            Cancel
                        </button>
                    </div>
                    <div className={styles.saveFeedback}>
                        <SaveStatus status={saveState} />
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditUserProfileModal;