import React, { forwardRef, useImperativeHandle } from "react";
import styles from "../styles/editbuildingmodal.module.css";
import SaveStatus from "../../../components/save/SaveStatus.jsx";
import { useEditBuildingModal } from "../hooks/useEditBuildingModal";

interface EditBuildingFormProps {
    building: { buildingId?: number; name: string; address: string; manager: string };
    isSaving: boolean;
    onSave: (buildingId: number | undefined, data: { name: string; address: string; manager: string }) => void;
    onCancel: () => void;
    onDelete?: (buildingId: number | undefined) => void;
    error?: string | null;
    saveState?: 'saving' | 'saved' | 'idle' | 'error';
}

const EditBuildingForm = forwardRef(function EditBuildingForm({
    building,
    isSaving = false,
    onSave,
    onCancel,
    onDelete,
    error = null,
    saveState = "idle",
}: EditBuildingFormProps, ref) {
    const {
        draft,
        formError,
        setFormError,
        handleChange,
        handleSubmit,
        resetDraft,
    } = useEditBuildingModal(building, isSaving);

    useImperativeHandle(ref, () => ({
        submit: () => {
            if (!draft.name.trim() || !draft.address.trim() || !draft.manager.trim()) {
                setFormError("All fields are required.");
                return false;
            }
            setFormError(null);
            onSave(building?.buildingId, { ...draft });
            return true;
        }
    }));

    const onFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!draft.name.trim() || !draft.address.trim() || !draft.manager.trim()) {
            setFormError("All fields are required.");
            return;
        }
        setFormError(null);
        onSave(building?.buildingId, { ...draft });
    };

    return (
        <form className={styles.form} onSubmit={onFormSubmit}>
            <div className={styles.formGroup}>
                <label className={styles.label} htmlFor="edit-building-name">Name</label>
                <input
                    id="edit-building-name"
                    className={styles.input}
                    name="name"
                    value={draft.name}
                    onChange={handleChange}
                    placeholder="Enter building name"
                    disabled={isSaving}
                />
            </div>
            <div className={styles.formGroup}>
                <label className={styles.label} htmlFor="edit-building-address">Address</label>
                <input
                    id="edit-building-address"
                    className={styles.input}
                    name="address"
                    value={draft.address}
                    onChange={handleChange}
                    placeholder="Enter address"
                    disabled={isSaving}
                />
            </div>
            <div className={styles.formGroup}>
                <label className={styles.label} htmlFor="edit-building-manager">Manager</label>
                <input
                    id="edit-building-manager"
                    className={styles.input}
                    name="manager"
                    value={draft.manager}
                    onChange={handleChange}
                    placeholder="Enter manager name"
                    disabled={isSaving}
                />
            </div>
            {(formError || error) && <div className={styles.errorMsg}>{formError || error}</div>}
            <div className={styles.saveFeedback}>
                <SaveStatus state={saveState} />
            </div>
            {/* Action buttons removed; handled by modal */}
        </form>
    );
});

export default EditBuildingForm;
