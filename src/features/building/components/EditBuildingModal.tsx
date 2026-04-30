import React from "react";
import styles from "../styles/editbuildingmodal.module.css";
import SaveStatus from "../../../components/save/SaveStatus.jsx";
import { useEditBuildingModal } from "../hooks/useEditBuildingModal";
import { FaRegTrashCan } from "react-icons/fa6";

/**
 * EditBuildingModal
 * Modal for editing or adding a building's profile (name, address, manager).
 *
 * @component
 * @param {object} props
 * @param {object} props.building - Building object to edit ({buildingId, name, address, manager}). Use {name: '', address: '', manager: ''} for add mode.
 * @param {boolean} props.open - Modal open state.
 * @param {boolean} props.isSaving - If the save action is pending.
 * @param {function} props.onSave - Receives (buildingId, {name, address, manager}) on submit.
 * @param {function} props.onClose - Called on modal backdrop or cancel.
 * @param {function} [props.onDelete] - Called when user confirms building deletion. Receives buildingId.
 * @param {string|null} props.error - Error message string (optional).
 * @param {'saving'|'saved'|'idle'|'error'} [props.saveState] - Current save state for SaveStatus indicator.
 * @returns {JSX.Element|null}
 */
const logger = {
    info: (...args) => console.log("[EditBuildingModal]", ...args),
    error: (...args) => console.error("[EditBuildingModal]", ...args),
};

const EditBuildingModal = ({
                               building,
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
    } = useEditBuildingModal(building, isSaving);

    // Controls the confirmation modal for deletion.
    const [deleteConfirmOpen, setDeleteConfirmOpen] = React.useState(false);

    if (!open || !building) return null;

    /** Handles cancel (closes modal and resets error). */
    const handleCancel = () => {
        setFormError(null);
        logger.info("Modal cancelled");
        onClose();
    };

    /** Determines if in add or edit mode. */
    const isAddBuilding =
        !building.buildingId &&
        (!building.name || building.name === "") &&
        (!building.address || building.address === "") &&
        (!building.manager || building.manager === "");

    /** Opens confirmation dialog for delete. */
    const handleTrashClick = (e) => {
        e.stopPropagation();
        setDeleteConfirmOpen(true);
    };

    /** Closes the delete confirmation. */
    const handleDeleteCancel = () => {
        setDeleteConfirmOpen(false);
    };

    /** Confirms deletion, notifies parent. */
    const handleDeleteConfirm = () => {
        setDeleteConfirmOpen(false);
        if (onDelete && building.buildingId) {
            logger.info("Building delete confirmed", building.buildingId);
            onDelete(building.buildingId);
        }
    };

    return (
        <>
            {/* Trash icon in top-right (only for edit mode, not add mode) */}
            {!isAddBuilding && (
                <button
                    type="button"
                    className={styles.trashButton}
                    onClick={handleTrashClick}
                    title="Delete building"
                    aria-label="Delete building"
                    disabled={isSaving}
                    tabIndex={0}
                >
                    <FaRegTrashCan size={20} />
                </button>
            )}

            <h2 className={styles.buildingTitle} id="edit-building-modal-title">
                {isAddBuilding ? "Add Building" : "Edit Building"}
            </h2>
            <form
                className={styles.buildingForm}
                onSubmit={(e) => handleSubmit(e, onSave)}
            >
                <div className={styles.formGroup}>
                    <label htmlFor="edit-building-name">Name</label>
                    <input
                        id="edit-building-name"
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
                    <label htmlFor="edit-building-address">Address</label>
                    <input
                        id="edit-building-address"
                        name="address"
                        type="text"
                        value={draft.address}
                        onChange={handleChange}
                        autoComplete="off"
                        className={styles.input}
                        disabled={isSaving}
                    />
                </div>
                <div className={styles.formGroup}>
                    <label htmlFor="edit-building-manager">Manager</label>
                    <input
                        id="edit-building-manager"
                        name="manager"
                        type="text"
                        value={draft.manager}
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
                        <h3>Delete this building?</h3>
                        <p>
                            Are you sure you want to delete{" "}
                            <strong>
                                {building.name || "this building"}
                            </strong>
                            ? This cannot be undone.
                        </p>
                        <div className={styles.confirmActions}>
                            <button
                                type="button"
                                className={styles.confirmDelete}
                                onClick={handleDeleteConfirm}
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
        </>
    );
};

export default EditBuildingModal;

