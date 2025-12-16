/**
 * useEditStorageModal
 * Manages draft state, input, and validation logic for Add/Edit Storage modals.
 *
 * @param {object|null} storage - If editing: existing storage object; if adding: {name: "", description: "", buildingId: ""}
 * @param {boolean} isSaving - Whether the save operation is in progress.
 * @returns {{
 *   draft: { name: string; description: string; buildingId: string|number };
 *   formError: string|null;
 *   setFormError: (err: string|null) => void;
 *   handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
 *   handleSubmit: (e: React.FormEvent, onSave: (storageId: number|null, payload: {name: string; description: string; buildingId: number}) => void) => void;
 *   resetDraft: () => void;
 * }}
 */
import { useState, useEffect } from "react";

const logger = {
    info: (...args) => console.log("[useEditStorageModal]", ...args),
    error: (...args) => console.error("[useEditStorageModal]", ...args),
};

export const useEditStorageModal = (storage, isSaving) => {
    const [draft, setDraft] = useState({ name: "", description: "", buildingId: "" });
    const [formError, setFormError] = useState(null);

    useEffect(() => {
        if (storage) setDraft({
            name: storage.name || "",
            description: storage.description || "",
            buildingId: storage.buildingId || "",
        });
        setFormError(null);
        logger.info("Initialized modal draft for storage", storage);
    }, [storage]);

    /**
     * Handles input field changes for name/description/buildingId.
     * @param {object} e - React.ChangeEvent
     */
    const handleChange = (e) => {
        const { name, value } = e.target;
        setDraft((prev) => ({ ...prev, [name]: name === "buildingId" ? value.replace(/\D/, "") : value }));
        setFormError(null);
    };

    /**
     * Validates and submits the edit/add storage form.
     * @param {React.FormEvent} e
     * @param {function} onSave
     */
    const handleSubmit = (e, onSave) => {
        e.preventDefault();
        if (!draft.name.trim() || !draft.description.trim() || !draft.buildingId) {
            setFormError("Name, description and building ID are required.");
            logger.error("Validation error on save: missing fields");
            return;
        }
        if (
            storage &&
            draft.name.trim() === (storage.name || "") &&
            draft.description.trim() === (storage.description || "") &&
            String(draft.buildingId) === String(storage.buildingId || "")
        ) {
            setFormError("No changes to save.");
            return;
        }
        logger.info("Saving storage edit", { id: storage && storage.storageId, ...draft });
        // Parse ID as number for the payload
        onSave(storage ? storage.storageId : null, { name: draft.name.trim(), description: draft.description.trim(), buildingId: Number(draft.buildingId) });
    };

    /** Resets the draft/fields to default values. */
    const resetDraft = () => {
        if (storage) setDraft({
            name: storage.name || "",
            description: storage.description || "",
            buildingId: storage.buildingId || "",
        });
        setFormError(null);
        logger.info("Form draft reset");
    };

    return {
        draft,
        formError,
        setFormError,
        handleChange,
        handleSubmit,
        resetDraft,
    };
};