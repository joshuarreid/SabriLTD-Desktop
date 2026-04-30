import React, { useEffect, useRef, useState } from "react";
import styles from "../styles/editbuildingmodal.module.css";

interface CreateBuildingFormProps {
    isSaving: boolean;
    saveState?: 'saving' | 'saved' | 'idle' | 'error';
    onSave: (data: { name: string; address: string; manager: string }) => void;
    onCancel: () => void;
    error?: string | null;
    autoFocus?: boolean;
    initialValues?: {
        name?: string;
        address?: string;
        manager?: string;
    };
}

const CreateBuildingForm: React.FC<CreateBuildingFormProps> = ({
    isSaving,
    saveState = 'idle',
    onSave,
    onCancel,
    error = null,
    autoFocus = false,
    initialValues = {},
}) => {
    const nameInputRef = useRef<HTMLInputElement>(null);
    const [draft, setDraft] = useState({
        name: initialValues?.name || "",
        address: initialValues?.address || "",
        manager: initialValues?.manager || "",
    });
    const [formError, setFormError] = useState<string | null>(null);

    useEffect(() => {
        if (autoFocus) {
            setTimeout(() => {
                try {
                    nameInputRef.current?.focus?.();
                } catch (e) {}
            }, 0);
        }
    }, [autoFocus]);

    const updateDraft = (field: string, value: string) => {
        setDraft((prev) => ({ ...prev, [field]: value }));
    };

    const canSubmit = !!draft.name.trim() && !!draft.address.trim() && !!draft.manager.trim() && !isSaving;

    const handleConfirm = (e: React.FormEvent) => {
        e.preventDefault();
        if (!draft.name.trim() || !draft.address.trim() || !draft.manager.trim()) {
            setFormError("All fields are required.");
            return;
        }
        setFormError(null);
        onSave({
            name: draft.name.trim(),
            address: draft.address.trim(),
            manager: draft.manager.trim(),
        });
    };

    return (
        <form className={styles.form} onSubmit={handleConfirm}>
            <div className={styles.formGroup}>
                <label className={styles.label} htmlFor="create-building-name">Building Name</label>
                <input
                    id="create-building-name"
                    ref={nameInputRef}
                    className={styles.input}
                    value={draft.name}
                    onChange={(e) => updateDraft("name", e.target.value)}
                    placeholder="Enter building name"
                    disabled={isSaving}
                />
            </div>
            <div className={styles.formGroup}>
                <label className={styles.label} htmlFor="create-building-address">Address</label>
                <input
                    id="create-building-address"
                    className={styles.input}
                    value={draft.address}
                    onChange={(e) => updateDraft("address", e.target.value)}
                    placeholder="Enter address"
                    disabled={isSaving}
                />
            </div>
            <div className={styles.formGroup}>
                <label className={styles.label} htmlFor="create-building-manager">Manager</label>
                <input
                    id="create-building-manager"
                    className={styles.input}
                    value={draft.manager}
                    onChange={(e) => updateDraft("manager", e.target.value)}
                    placeholder="Enter manager name"
                    disabled={isSaving}
                />
            </div>
            {(formError || error) && <div className={styles.errorMsg}>{formError || error}</div>}
            <div className={styles.saveFeedback}>
                {saveState === "saved" ? <div className={styles.savedMsg}>Saved</div> : null}
            </div>
            <div className={styles.formActions}>
                <button
                    type="submit"
                    className={styles.saveButton}
                    disabled={!canSubmit}
                    aria-disabled={!canSubmit}
                >
                    {isSaving ? "Saving..." : "Create"}
                </button>
                <button
                    type="button"
                    className={styles.cancelButton}
                    onClick={onCancel}
                    disabled={isSaving}
                    aria-disabled={isSaving}
                >
                    Cancel
                </button>
            </div>
        </form>
    );
};

export default CreateBuildingForm;
