import React, { useState, useEffect } from "react";
import styles from "../styles/editbuildingmodal.module.css";
import SaveStatus from "../../../components/save/SaveStatus.jsx";
import { FaRegTrashCan } from "react-icons/fa6";

/**
 * EditBuildingForm
 * UI form for editing a building's profile (name, address, manager).
 *
 * @component
 * @param {object} props
 * @param {object} props.building - Building object to edit ({buildingId, name, address, manager}).
 * @param {boolean} props.isSaving - If the save action is pending.
 * @param {function} props.onSave - Receives (buildingId, {name, address, manager}) on submit.
 * @param {function} props.onCancel - Called on cancel.
 * @param {function} [props.onDelete] - Called when user confirms building deletion. Receives buildingId.
 * @param {string|null} props.error - Error message string (optional).
 * @param {'saving'|'saved'|'idle'|'error'} [props.saveState] - Current save state for SaveStatus indicator.
 * @returns {JSX.Element|null}
 */
const logger = {
    info: (...args) => console.log("[EditBuildingForm]", ...args),
    error: (...args) => console.error("[EditBuildingForm]", ...args),
};

const EditBuildingForm = ({
    building,
    isSaving = false,
    onSave,
    onCancel,
    onDelete,
    error = null,
    saveState = "idle",
}) => {
    const [draft, setDraft] = useState({
        name: building?.name || "",
        address: building?.address || "",
        manager: building?.manager || "",
    });
    const [formError, setFormError] = useState(null);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

    useEffect(() => {
        setDraft({
            name: building?.name || "",
            address: building?.address || "",
            manager: building?.manager || "",
        });
    }, [building]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setDraft((prev) => ({ ...prev, [name]: value }));
    };

    const validate = () => {
        if (!draft.name.trim()) return "Name is required.";
        if (!draft.address.trim()) return "Address is required.";
        if (!draft.manager.trim()) return "Manager is required.";
        return null;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const validationError = validate();
        if (validationError) {
            setFormError(validationError);
            logger.error("Validation failed:", validationError);
            return;
        }
        setFormError(null);
        logger.info("Submitting building update", draft);
        onSave?.(building.buildingId, draft);
    };

    const handleCancel = (e) => {
        e.preventDefault();
        setFormError(null);
        logger.info("Edit cancelled");
        onCancel?.();
    };

    const handleTrashClick = (e) => {
        e.stopPropagation();
        setDeleteConfirmOpen(true);
    };
    const handleDeleteCancel = () => setDeleteConfirmOpen(false);
    const handleDeleteConfirm = () => {
        setDeleteConfirmOpen(false);
        if (onDelete && building.buildingId) {
            logger.info("Building delete confirmed", building.buildingId);
            onDelete(building.buildingId);
        }
    };

    if (!building) return null;
    const isAddBuilding = !building.buildingId;

    return (
        <form className={styles.buildingForm} onSubmit={handleSubmit}>
            <div className={styles.headerRow}>
                <h3 className={styles.buildingTitle}>Edit Building</h3>
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
            </div>
            <div className={styles.formGroup}>
                <label htmlFor="building-name">Name</label>
                <input
                    id="building-name"
                    name="name"
                    type="text"
                    className={styles.input}
                    value={draft.name}
                    onChange={handleChange}
                    disabled={isSaving}
                    autoFocus
                />
            </div>
            <div className={styles.formGroup}>
                <label htmlFor="building-address">Address</label>
                <input
                    id="building-address"
                    name="address"
                    type="text"
                    className={styles.input}
                    value={draft.address}
                    onChange={handleChange}
                    disabled={isSaving}
                />
            </div>
            <div className={styles.formGroup}>
                <label htmlFor="building-manager">Manager</label>
                <input
                    id="building-manager"
                    name="manager"
                    type="text"
                    className={styles.input}
                    value={draft.manager}
                    onChange={handleChange}
                    disabled={isSaving}
                />
            </div>
            {(formError || error) && (
                <div className={styles.errorMsg}>{formError || error}</div>
            )}
            <div className={styles.formActions}>
                <button type="button" className={styles.resetButton} onClick={handleCancel} disabled={isSaving}>
                    Cancel
                </button>
                <button type="submit" className={styles.saveButton} disabled={isSaving}>
                    Save
                </button>
                <span className={styles.saveFeedback}><SaveStatus state={saveState} /></span>
            </div>
            {/* Delete confirmation modal (simple inline version) */}
            {deleteConfirmOpen && (
                <div className={styles.deleteConfirmOverlay}>
                    <div className={styles.deleteConfirmModal}>
                        <p>Are you sure you want to delete this building?</p>
                        <div className={styles.deleteConfirmActions}>
                            <button type="button" onClick={handleDeleteCancel}>
                                Cancel
                            </button>
                            <button type="button" onClick={handleDeleteConfirm}>
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </form>
    );
};

export default EditBuildingForm;
