/**
 * useEditBuildingModal
 * Manages draft state, input, and validation logic for Add/Edit Building modals.
 *
 * @param {object|null} building - If editing: existing building object; if adding: {name: "", address: "", manager: ""}.
 * @param {boolean} isSaving - Whether the save operation is in progress.
 * @returns {{
 *   draft: { name: string; address: string; manager: string };
 *   formError: string|null;
 *   setFormError: (err: string|null) => void;
 *   handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
 *   handleSubmit: (e: React.FormEvent, onSave: (buildingId: number|null, payload: {name: string; address: string; manager: string}) => void) => void;
 *   resetDraft: () => void;
 * }}
 */
import { useState, useEffect } from "react";

const logger = {
    info: (...args) => console.log("[useEditBuildingModal]", ...args),
    error: (...args) => console.error("[useEditBuildingModal]", ...args),
};

export const useEditBuildingModal = (building, isSaving) => {
    const [draft, setDraft] = useState({ name: "", address: "", manager: "" });
    const [formError, setFormError] = useState(null);

    useEffect(() => {
        if (building) setDraft({ name: building.name || "", address: building.address || "", manager: building.manager || "" });
        setFormError(null);
        logger.info("Initialized modal draft for building", building);
    }, [building]);

    /**
     * Handles input field changes for name/address/manager.
     * @param {object} e - React.ChangeEvent
     */
    const handleChange = (e) => {
        const { name, value } = e.target;
        setDraft((prev) => ({ ...prev, [name]: value }));
        setFormError(null);
    };

    /**
     * Validates and submits the edit/add building form.
     * @param {React.FormEvent} e
     * @param {function} onSave
     */
    const handleSubmit = (e, onSave) => {
        e.preventDefault();
        if (!draft.name.trim() || !draft.address.trim() || !draft.manager.trim()) {
            setFormError("Name, address and manager are required.");
            logger.error("Validation error on save: missing fields");
            return;
        }
        if (
            building &&
            draft.name.trim() === (building.name || "") &&
            draft.address.trim() === (building.address || "") &&
            draft.manager.trim() === (building.manager || "")
        ) {
            setFormError("No changes to save.");
            return;
        }
        logger.info("Saving building edit", { id: building && building.buildingId, ...draft });
        onSave(building ? building.buildingId : null, { name: draft.name.trim(), address: draft.address.trim(), manager: draft.manager.trim() });
    };

    /** Resets the draft/fields to default values. */
    const resetDraft = () => {
        if (building) setDraft({ name: building.name || "", address: building.address || "", manager: building.manager || "" });
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