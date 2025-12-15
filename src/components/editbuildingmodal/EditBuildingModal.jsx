import React from "react";
import styles from "./editbuildingmodal.module.css";
import SaveStatus from "../save/SaveStatus";
import { useEditBuildingModal } from "./useEditBuildingModal";

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
                               error,
                               saveState = "idle"
                           }) => {
    const {
        draft,
        formError,
        setFormError,
        handleChange,
        handleSubmit,
        resetDraft,
    } = useEditBuildingModal(building, isSaving);

    if (!open || !building) return null;

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
     * Add mode: no buildingId and all fields are blank
     */
    const isAddBuilding =
        !building.buildingId &&
        (!building.name || building.name === "") &&
        (!building.address || building.address === "") &&
        (!building.manager || building.manager === "");

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
                aria-labelledby="edit-building-modal-title"
            >
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
            </div>
        </div>
    );
};

export default EditBuildingModal;