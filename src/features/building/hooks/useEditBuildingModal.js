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

/**
 * Standardized logger for useEditBuildingModal.
 * @constant
 */
const logger = {
    info: (...args) => console.log("[useEditBuildingModal]", ...args),
    error: (...args) => console.error("[useEditBuildingModal]", ...args),
};

/**
 * Custom hook for managing the edit/add modal state and logic for buildings.
 *
 * @param {object|null} building - The current building to edit or an empty draft for add.
 * @param {boolean} isSaving - Whether a save operation is in progress.
 * @returns {object} Modal draft state, error, and helpers
 */
export const useEditBuildingModal = (building, isSaving) => {
    const [draft, setDraft] = useState({ name: "", address: "", manager: "" });
    const [formError, setFormError] = useState(null);

    useEffect(() => {
        if (building) setDraft({
            name: building.name || "",
            address: building.address || "",
            manager: building.manager || ""
        });
        setFormError(null);
        logger.info("Initialized modal draft for building", building);
    }, [building]);

    /**
     * Updates a field in the draft state and clears form error.
     * @param {object} e - React.ChangeEvent
     */
    const handleChange = (e) => {
        const { name, value } = e.target;
        setDraft((prev) => ({ ...prev, [name]: value }));
        setFormError(null);
    };

    /**
     * Validates and submits the edit/add building form.
     * - All inputfields required, trimmed
     * - No unchanged submit in edit mode
     * @param {React.FormEvent} e
     * @param {function} onSave - (buildingId, payload)
     */
    const handleSubmit = (e, onSave) => {
        e.preventDefault();
        if (!draft.name.trim() || !draft.address.trim() || !draft.manager.trim()) {
            setFormError("Name, address and manager are required.");
            logger.error("Validation error on save: missing inputfields");
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
        onSave(
            building ? building.buildingId : null,
            {
                name: draft.name.trim(),
                address: draft.address.trim(),
                manager: draft.manager.trim(),
            }
        );
    };

    /**
     * Resets the draft/inputfields to default values and clears form error.
     */
    const resetDraft = () => {
        if (building) setDraft({
            name: building.name || "",
            address: building.address || "",
            manager: building.manager || ""
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