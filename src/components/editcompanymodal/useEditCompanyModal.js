/**
 * useEditCompanyModal
 *
 * Manages draft state, input, and validation logic for Add/Edit Company modals.
 *
 * @param {object|null} company - If editing: existing company object; if adding: {name:'',address:'',phone:'',website:''}.
 * @param {boolean} isSaving - Whether the save operation is in progress.
 * @returns {{
 *   draft: { name:string, address:string, phone:string, website:string },
 *   formError: string|null,
 *   setFormError: (err: string|null) => void,
 *   handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void,
 *   handleSubmit: (e: React.FormEvent, onSave: Function) => void,
 *   resetDraft: () => void
 * }}
 */

import { useState, useEffect } from "react";

/**
 * logger for useEditCompanyModal.
 * @constant
 */
const logger = {
    info: (...args) => console.log("[useEditCompanyModal]", ...args),
    error: (...args) => console.error("[useEditCompanyModal]", ...args),
};

/**
 * useEditCompanyModal
 * @param {object|null} company
 * @param {boolean} isSaving
 * @returns {object}
 */
export const useEditCompanyModal = (company, isSaving) => {
    const [draft, setDraft] = useState({
        name: "",
        address: "",
        phone: "",
        website: "",
    });
    const [formError, setFormError] = useState(null);

    useEffect(() => {
        if (company) {
            setDraft({
                name: company.name || "",
                address: company.address || "",
                phone: company.phone || "",
                website: company.website || "",
            });
        } else {
            setDraft({ name: "", address: "", phone: "", website: "" });
        }
        setFormError(null);
        logger.info("Initialized company draft", company);
    }, [company]);

    /**
     * handleChange
     * Updates draft field and clears form error.
     * @param {React.ChangeEvent<HTMLInputElement>} e
     */
    const handleChange = (e) => {
        const { name, value } = e.target;
        setDraft((prev) => ({ ...prev, [name]: value }));
        setFormError(null);
    };

    /**
     * handleSubmit
     * Validates and submits company data via onSave callback.
     * - Requires non-empty name.
     * - Prevents saving unchanged data in edit mode.
     *
     * @param {React.FormEvent} e
     * @param {function} onSave - (companyId: number|null, payload: object) => void
     */
    const handleSubmit = (e, onSave) => {
        e.preventDefault();
        if (!draft.name || !draft.name.trim()) {
            setFormError("Name is required.");
            logger.error("Validation failed: missing company name");
            return;
        }

        const trimmed = {
            name: draft.name.trim(),
            address: (draft.address || "").trim(),
            phone: (draft.phone || "").trim(),
            website: (draft.website || "").trim(),
        };

        // If editing and no changes, prevent submit
        if (
            company &&
            trimmed.name === (company.name || "") &&
            trimmed.address === (company.address || "") &&
            trimmed.phone === (company.phone || "") &&
            trimmed.website === (company.website || "")
        ) {
            setFormError("No changes to save.");
            logger.info("handleSubmit aborted: no changes detected");
            return;
        }

        logger.info("Submitting company save", { id: company?.companyId ?? null, ...trimmed });
        try {
            onSave(company ? company.companyId : null, trimmed);
        } catch (err) {
            logger.error("onSave threw an error", err);
            setFormError(err?.message || "Failed to save.");
        }
    };

    /**
     * resetDraft
     * Resets draft to incoming company values (or empty).
     */
    const resetDraft = () => {
        if (company) {
            setDraft({
                name: company.name || "",
                address: company.address || "",
                phone: company.phone || "",
                website: company.website || "",
            });
        } else {
            setDraft({ name: "", address: "", phone: "", website: "" });
        }
        setFormError(null);
        logger.info("Company draft reset");
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

export default useEditCompanyModal;