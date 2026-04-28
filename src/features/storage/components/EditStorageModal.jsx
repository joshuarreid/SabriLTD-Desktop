import React from "react";
import styles from "./editstoragemodal.module.css";
import SaveStatus from "../../../components/save/SaveStatus";
import { useEditStorageModal } from "../hooks/useEditStorageModal";
import { FaRegTrashCan } from "react-icons/fa6";

/**
 * EditStorageModal
 * Modal for editing or adding a storage location (name, description) for a selected building.
 *
 * @component
 * @param {object} props
 * @param {object} props.storage - Storage object to edit ({storageId, name, description, buildingId}). Use {name: '', description: ''} for add mode.
 * @param {number|string} props.selectedBuildingId - Currently selected building ID (always included on submit, not shown in form).
 * @param {boolean} props.open - Modal open state.
 * @param {boolean} props.isSaving - If the save action is pending.
 * @param {function} props.onSave - Receives (storageId, {name, description, buildingId}) on submit.
 * @param {function} props.onClose - Called on modal backdrop or cancel.
 * @param {function} [props.onDelete] - Called when user confirms storage deletion. Receives storageId.
 * @param {string|null} props.error - Error message string (optional).
 * @param {'saving'|'saved'|'idle'|'error'} [props.saveState] - Current save state for SaveStatus indicator.
 * @returns {JSX.Element|null}
 */
const logger = {
    info: (...args) => console.log("[EditStorageModal]", ...args),
    error: (...args) => console.error("[EditStorageModal]", ...args),
};

const EditStorageModal = ({
                              storage,
                              selectedBuildingId,
                              open,
                              isSaving,
                              onSave,
                              onClose,
                              onDelete,
                              error,
                              saveState = "idle",
                          }) => {
    const {
        draft,
        formError,
        setFormError,
        handleChange,
        handleSubmit,
        resetDraft,
    } = useEditStorageModal(storage, isSaving);

    if (!open || !storage) return null;

    /**
     * Handles cancel (closes modal and resets error).
     * @function handleCancel
     */
    const handleCancel = () => {
        setFormError(null);
        logger.info("Modal cancelled");
        onClose();
    };

    /**
     * Determines if in add or edit mode.
     * Add mode: no storageId and all inputfields are blank
     */
    const isAddStorage =
        !storage.storageId &&
        (!storage.name || storage.name === "") &&
        (!storage.description || storage.description === "");

    /**
     * Handles trash click (calls onDelete prop immediately, allowing outer logic to show a single confirmation modal).
     * @function handleTrashClick
     * @param {React.MouseEvent} e
     */
    const handleTrashClick = (e) => {
        e.stopPropagation();
        if (onDelete && storage.storageId) {
            logger.info("Trash/delete triggered via EditStorageModal for storageId:", storage.storageId);
            onDelete(storage.storageId);
        }
    };

    /**
     * Passes selectedBuildingId into handleSubmit for proper payload wiring.
     * @function handleSubmitWithBuildingId
     */
    const handleSubmitWithBuildingId = (e) => {
        e.preventDefault();
        handleSubmit(e, selectedBuildingId, onSave);
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
                aria-labelledby="edit-storage-modal-title"
            >
                {/* Trash icon in top-right (only for edit mode, not add mode) */}
                {!isAddStorage && (
                    <button
                        type="button"
                        className={styles.trashButton}
                        onClick={handleTrashClick}
                        title="Delete storage"
                        aria-label="Delete storage"
                        disabled={isSaving}
                        tabIndex={0}
                    >
                        <FaRegTrashCan size={20} />
                    </button>
                )}
                <h2 className={styles.storageTitle} id="edit-storage-modal-title">
                    {isAddStorage ? "Add Storage Location" : "Edit Storage Location"}
                </h2>
                <form className={styles.storageForm} onSubmit={handleSubmitWithBuildingId}>
                    <div className={styles.formGroup}>
                        <label htmlFor="edit-storage-name">Name</label>
                        <input
                            id="edit-storage-name"
                            name="name"
                            type="text"
                            value={draft.name}
                            onChange={handleChange}
                            autoComplete="off"
                            className={styles.input}
                            maxLength={18}
                            disabled={isSaving}
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label htmlFor="edit-storage-description">Description</label>
                        <input
                            id="edit-storage-description"
                            name="description"
                            type="text"
                            value={draft.description}
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

export default EditStorageModal;