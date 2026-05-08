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
import type { Company } from "../api/company.types";

interface UseEditCompanyModalReturn {
    draft: Company;
    formError: string | null;
    setFormError: (err: string | null) => void;
    handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleSubmit: (e: React.FormEvent, onSave: (companyId: number | null, payload: Company) => void) => void;
    resetDraft: () => void;
}

export const useEditCompanyModal = (
    company: Company | null,
    isSaving: boolean
): UseEditCompanyModalReturn => {
    const [draft, setDraft] = useState<Company>({
        name: "",
        address: "",
        phone: "",
        website: "",
    });
    const [formError, setFormError] = useState<string | null>(null);

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
    }, [company]);

    /**
     * handleChange
     * Updates draft field and clears form error.
     * @param {React.ChangeEvent<HTMLInputElement>} e
     */
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
     * @param {function} onSave - (companyId: number|null, payload: Company) => void
     */
    const handleSubmit = (
        e: React.FormEvent,
        onSave: (companyId: number | null, payload: Company) => void
    ) => {
        e.preventDefault();
        if (!draft.name || !draft.name.trim()) {
            setFormError("Name is required.");
            return;
        }

        const trimmed: Company = {
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
            return;
        }
        try {
            onSave(company ? company.companyId ?? null : null, trimmed);
        } catch (err: any) {
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