import React from "react";
import styles from "../styles/edituserprofilemodal.module.css";
import SaveStatus from "../../../components/save/SaveStatus.jsx";
import { useEditUserModal } from "../hooks/useEditUserModal.ts";
import { FaRegTrashCan } from "react-icons/fa6";

export interface EditUserProfileModalProps {
    user: { userId?: number; name: string; email: string } | null;
    open: boolean;
    isSaving: boolean;
    onSave: (userId: number | null, payload: { name: string; email: string }) => void;
    onClose: () => void;
    onDelete?: (userId: number) => void;
    error?: string | null;
    saveState?: 'saving' | 'saved' | 'idle' | 'error';
    currentUser?: { userId?: number } | null;
}

/**
 * EditUserProfileModal
 * Modal for editing or adding a user's profile (name, email).
 *
 * @component
 * @param {object} props
 * @param {object} props.user - user object to edit ({userId, name, email}). Use {name: '', email: ''} for add mode.
 * @param {boolean} props.open - Modal open state.
 * @param {boolean} props.isSaving - If the save action is pending.
 * @param {function} props.onSave - Receives (userId, {name, email}) on submit.
 * @param {function} props.onClose - Called on modal backdrop or cancel.
 * @param {function} [props.onDelete] - Called when user confirms user deletion. Receives userId.
 * @param {string|null} props.error - Error message string (optional).
 * @param {'saving'|'saved'|'idle'|'error'} [props.saveState] - Current save state for SaveStatus indicator.
 * @param {object} [props.currentUser] - Current authenticated user object ({userId, ...}), to prevent self-delete.
 * @returns {JSX.Element|null}
 */
const logger = {
    info: (...args: unknown[]) => console.log("[EditUserProfileModal]", ...args),
    error: (...args: unknown[]) => console.error("[EditUserProfileModal]", ...args),
};

const EditUserProfileModal: React.FC<EditUserProfileModalProps> = ({
    user,
    open,
    isSaving,
    onSave,
    onClose,
    onDelete,
    error,
    saveState = "idle",
    currentUser
}) => {
    const {
        draft,
        formError,
        setFormError,
        handleChange,
        handleSubmit,
        resetDraft
    } = useEditUserModal(user, isSaving);

    // Controls the confirmation modal for deletion (edit mode only)
    const [deleteConfirmOpen, setDeleteConfirmOpen] = React.useState<boolean>(false);

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
     * Add mode: no userId and all inputfields are blank.
     */
    const isAddUser =
        !user.userId &&
        (!user.name || user.name === "") &&
        (!user.email || user.email === "");

    /**
     * Determines if the user being edited is the current user.
     */
    const isCurrentUser =
        !!user &&
        !!currentUser &&
        String(user.userId) === String(currentUser.userId);

    /**
     * Opens confirmation dialog for delete.
     */
    const handleTrashClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        if (!isCurrentUser && !isSaving) {
            setDeleteConfirmOpen(true);
        }
    };

    /**
     * Closes the delete confirmation.
     */
    const handleDeleteCancel = () => {
        setDeleteConfirmOpen(false);
    };

    /**
     * Confirms deletion, notifies parent.
     */
    const handleDeleteConfirm = () => {
        setDeleteConfirmOpen(false);
        if (onDelete && user.userId && !isCurrentUser) {
            logger.info("user delete confirmed", user.userId);
            onDelete(user.userId);
        }
    };

    return (
        <div
            className={styles.modalOverlay}
            onClick={handleCancel}
            tabIndex={-1}
            aria-modal="true"
        >
            <div
                className={styles.modalCard}
                onClick={(e) => e.stopPropagation()}
                tabIndex={0}
                role="dialog"
                aria-modal="true"
                aria-labelledby="edit-user-modal-title"
            >
                {/* Trash icon (edit mode only) */}
                {!isAddUser && (
                    <button
                        type="button"
                        className={styles.trashButton}
                        onClick={handleTrashClick}
                        title={
                            isCurrentUser
                                ? "Cannot delete your own user profile"
                                : "Delete user"
                        }
                        aria-label={
                            isCurrentUser
                                ? "Cannot delete your own user profile"
                                : "Delete user"
                        }
                        disabled={isSaving || isCurrentUser}
                        tabIndex={isCurrentUser ? -1 : 0}
                        style={
                            isCurrentUser
                                ? { opacity: 0.44, cursor: "not-allowed" }
                                : undefined
                        }
                    >
                        <FaRegTrashCan size={20} />
                    </button>
                )}
                <h2 className={styles.userTitle} id="edit-user-modal-title">
                    {isAddUser ? "Add user" : "Edit user"}
                </h2>
                <form
                    className={styles.userForm}
                    onSubmit={(e) => handleSubmit(e, onSave)}
                >
                    <div className={styles.formGroup}>
                        <label htmlFor="edit-user-name">Name</label>
                        <input
                            id="edit-user-name"
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
                        <label htmlFor="edit-user-email">Email</label>
                        <input
                            id="edit-user-email"
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
                {/* Confirmation modal for deletion */}
                {deleteConfirmOpen && (
                    <div className={styles.confirmOverlay}>
                        <div className={styles.confirmCard}>
                            <h3>Delete this user?</h3>
                            <p>
                                Are you sure you want to delete{" "}
                                <strong>
                                    {user.name || "this user"}
                                </strong>
                                ? This cannot be undone.
                            </p>
                            <div className={styles.confirmActions}>
                                <button
                                    type="button"
                                    className={styles.confirmDelete}
                                    onClick={handleDeleteConfirm}
                                    disabled={isCurrentUser}
                                >
                                    Delete
                                </button>
                                <button
                                    type="button"
                                    className={styles.cancelDelete}
                                    onClick={handleDeleteCancel}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EditUserProfileModal;

