/**
 * useEditStorageModal
 * Manages draft state, input, and validation logic for Add/Edit Storage modals.
 *
 * @param {object|null} storage - If editing: existing storage object; if adding: {name: "", description: ""}
 * @param {boolean} isSaving - Whether the save operation is in progress.
 * @returns {{
 *   draft: { name: string; description: string };
 *   formError: string|null;
 *   setFormError: (err: string|null) => void;
 *   handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
 *   handleSubmit: (e: React.FormEvent, buildingId: number, onSave: (storageId: number|null, payload: {name: string; description: string; buildingId: number}) => void) => void;
 *   resetDraft: () => void;
 * }}
 */
import { useState, useEffect } from "react";

const logger = {
    info: (...args) => console.log("[useEditStorageModal]", ...args),
    error: (...args) => console.error("[useEditStorageModal]", ...args),
};

export const useEditStorageModal = (storage, isSaving) => {
    const [draft, setDraft] = useState({ name: "", description: "" });
    const [formError, setFormError] = useState(null);

    useEffect(() => {
        if (storage) setDraft({
            name: storage.name || "",
            description: storage.description || "",
        });
        setFormError(null);
        logger.info("Initialized modal draft for storage", storage);
    }, [storage]);

    /**
     * Handles input field changes for name/description.
     * @param {object} e - React.ChangeEvent
     */
    const handleChange = (e) => {
        const { name, value } = e.target;
        setDraft((prev) => ({ ...prev, [name]: value }));
        setFormError(null);
    };

    /**
     * Validates and submits the edit/add storage form.
     * @param {React.FormEvent} e
     * @param {number|string} buildingId - The building ID to send in payload (NOT from draft!)
     * @param {function} onSave - (storageId, { name, description, buildingId })
     */
    const handleSubmit = (e, buildingId, onSave) => {
        e.preventDefault();
        if (!draft.name.trim()) {
            setFormError("Name is required.");
            logger.error("Validation error on save: missing name");
            return;
        }
        if (draft.name.trim().length > 18) {
            setFormError("Name must be at most 18 characters.");
            logger.error("Validation error on save: name too long");
            return;
        }
        if (
            storage &&
            draft.name.trim() === (storage.name || "") &&
            (draft.description || "") === (storage.description || "")
        ) {
            setFormError("No changes to save.");
            return;
        }
        logger.info("Saving storage edit", { id: storage && storage.storageId, ...draft, buildingId });
        onSave(
            storage ? storage.storageId : null,
            {
                name: draft.name.trim(),
                description: draft.description || "",
                buildingId: buildingId,
            }
        );
    };

    /** Resets the draft/inputfields to default values. */
    const resetDraft = () => {
        if (storage) setDraft({
            name: storage.name || "",
            description: storage.description || "",
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