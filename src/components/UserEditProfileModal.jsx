import React, { useState, useEffect } from "react";
import styles from "../features/profile/styles/userprofilescreen.module.css";
import modalStyles from "./usereditprofilemodal.module.css";
import SaveStatus from "../components/save/SaveStatus";

/**
 * UserEditProfileModal
 * Modal for editing a user's basic profile (name & email).
 *
 * @param {object} props
 * @param {object} props.user - User object to edit {userId, name, email}.
 * @param {boolean} props.open - Modal open state.
 * @param {boolean} props.isSaving - If the save action is pending.
 * @param {function} props.onSave - Receives (userId, {name, email}) on submit.
 * @param {function} props.onClose - Called on modal backdrop or cancel.
 * @param {string|null} props.error - Error message string (optional).
 * @param {'saving'|'saved'|'idle'|'error'} [props.saveState] - Current save state for SaveStatus indicator.
 * @returns {JSX.Element|null}
 */
const logger = {
    info: (...args) => console.log("[UserEditProfileModal]", ...args),
    error: (...args) => console.error("[UserEditProfileModal]", ...args),
};

const UserEditProfileModal = ({
                                  user,
                                  open,
                                  isSaving,
                                  onSave,
                                  onClose,
                                  error,
                                  saveState = "idle"
                              }) => {
    /**
     * Local draft object for editing name/email.
     * @type {[object, function]}
     */
    const [draft, setDraft] = useState({ name: "", email: "" });

    /**
     * Form-local error state.
     * @type {[string | null, function]}
     */
    const [formError, setFormError] = useState(null);

    useEffect(() => {
        if (user) setDraft({ name: user.name || "", email: user.email || "" });
        setFormError(null);
        logger.info("Initialized modal draft for user", user);
    }, [user, open]);

    if (!open || !user) return null;

    /**
     * Handles input field changes.
     * @param {object} e - React.ChangeEvent
     */
    const handleChange = (e) => {
        const { name, value } = e.target;
        setDraft((prev) => ({ ...prev, [name]: value }));
        setFormError(null);
    };

    /**
     * Validates and submits the edit form.
     * @param {React.FormEvent} e
     */
    const handleSubmit = (e) => {
        e.preventDefault();
        if (!draft.name.trim() || !draft.email.trim()) {
            setFormError("Both name and email are required.");
            logger.error("Validation error on save: missing name/email");
            return;
        }
        if (
            draft.name.trim() === (user.name || "") &&
            draft.email.trim() === (user.email || "")
        ) {
            setFormError("No changes to save.");
            return;
        }
        logger.info("Saving user edit", { id: user.userId, ...draft });
        onSave(user.userId, { name: draft.name.trim(), email: draft.email.trim() });
    };

    /**
     * Handles cancel (closes modal and resets error).
     */
    const handleCancel = () => {
        setFormError(null);
        logger.info("Modal cancelled");
        onClose();
    };

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
                    Edit User
                </h2>
                <form className={styles.profileForm} onSubmit={handleSubmit}>
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

export default UserEditProfileModal;