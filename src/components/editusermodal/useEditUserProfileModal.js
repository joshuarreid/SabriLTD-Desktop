/**
 * useEditUserProfileModal
 * Encapsulates draft state, validation, and input logic for Add/Edit User Profile modals.
 *
 * @param {object|null} user - If editing: existing user object. If adding: `{ name: "", email: "" }`.
 * @param {boolean} isSaving - Whether the save operation is in progress.
 * @returns {{
 *   draft: { name: string; email: string };
 *   formError: string|null;
 *   setFormError: (err: string|null) => void;
 *   handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
 *   handleSubmit: (e: React.FormEvent, onSave: (userId: number|null, payload: {name: string; email: string}) => void) => void;
 *   resetDraft: () => void;
 * }}
 */
import { useState, useEffect } from "react";

const logger = {
    info: (...args) => console.log("[useEditUserProfileModal]", ...args),
    error: (...args) => console.error("[useEditUserProfileModal]", ...args),
};

export const useEditUserProfileModal = (user, isSaving) => {
    const [draft, setDraft] = useState({ name: "", email: "" });
    const [formError, setFormError] = useState(null);

    useEffect(() => {
        if (user) setDraft({ name: user.name || "", email: user.email || "" });
        setFormError(null);
        logger.info("Initialized modal draft for user", user);
    }, [user]);

    /**
     * Handles input field changes for user name/email.
     * @param {object} e - React.ChangeEvent
     */
    const handleChange = (e) => {
        const { name, value } = e.target;
        setDraft((prev) => ({ ...prev, [name]: value }));
        setFormError(null);
    };

    /**
     * Validates and submits the edit/add user form.
     * @param {React.FormEvent} e
     * @param {function} onSave
     */
    const handleSubmit = (e, onSave) => {
        e.preventDefault();
        if (!draft.name.trim() || !draft.email.trim()) {
            setFormError("Both name and email are required.");
            logger.error("Validation error on save: missing name/email");
            return;
        }
        if (
            user &&
            draft.name.trim() === (user.name || "") &&
            draft.email.trim() === (user.email || "")
        ) {
            setFormError("No changes to save.");
            return;
        }
        logger.info("Saving user edit", { id: user && user.userId, ...draft });
        onSave(user ? user.userId : null, { name: draft.name.trim(), email: draft.email.trim() });
    };

    /** Resets the draft/fields to default values. */
    const resetDraft = () => {
        if (user) setDraft({ name: user.name || "", email: user.email || "" });
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