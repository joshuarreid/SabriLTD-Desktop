/**
 * useEditUserProfileModal
 * Encapsulates draft state, validation, and input logic for Add/Edit user Profile modals.
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
import type { ChangeEvent, FormEvent } from "react";
import { useCreateUser, useUpdateUser } from "./useUsers";

export type UserProfileDraft = { name: string; email: string };
export type UserProfile = UserProfileDraft & { userId?: number };

const logger = {
    info: (...args: unknown[]) => console.log("[useEditUserProfileModal]", ...args),
    error: (...args: unknown[]) => console.error("[useEditUserProfileModal]", ...args),
};

type UseEditUserProfileModalReturn = {
    draft: UserProfileDraft;
    formError: string | null;
    setFormError: (err: string | null) => void;
    handleChange: (e: ChangeEvent<HTMLInputElement>) => void;
    handleSubmit: (
        e: FormEvent,
        onSave: (userId: number | null, payload: UserProfileDraft) => void
    ) => void;
    resetDraft: () => void;
};

export const useEditUserProfileModal = (
    user: UserProfile | null,
    isSaving: boolean
): UseEditUserProfileModalReturn => {
    const [draft, setDraft] = useState<UserProfileDraft>({ name: "", email: "" });
    const [formError, setFormError] = useState<string | null>(null);
    const createUserMutation = useCreateUser();
    const updateUserMutation = useUpdateUser();

    useEffect(() => {
        if (user) setDraft({ name: user.name || "", email: user.email || "" });
        setFormError(null);
        logger.info("Initialized modal draft for user", user);
    }, [user]);

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setDraft((prev) => ({ ...prev, [name]: value }));
        setFormError(null);
    };

    const handleSubmit = (
        e: FormEvent,
        onSave: (userId: number | null, payload: UserProfileDraft) => void
    ) => {
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
        if (user && user.userId) {
            updateUserMutation.mutate(
                { userId: user.userId, payload: { name: draft.name.trim(), email: draft.email.trim() } },
                {
                    onSuccess: () => onSave(user.userId, { name: draft.name.trim(), email: draft.email.trim() }),
                    onError: (err: any) => setFormError(err?.message || "Failed to update user."),
                }
            );
        } else {
            createUserMutation.mutate(
                { name: draft.name.trim(), email: draft.email.trim(), password: "" }, // password handling TBD
                {
                    onSuccess: (created: any) => onSave(created?.userId ?? null, { name: draft.name.trim(), email: draft.email.trim() }),
                    onError: (err: any) => setFormError(err?.message || "Failed to create user."),
                }
            );
        }
    };

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