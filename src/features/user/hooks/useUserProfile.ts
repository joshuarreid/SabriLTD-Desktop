import { useState, useCallback, useEffect, useRef } from "react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { useCurrentUser } from "./useCurrentUser";
import { updateUser } from "../../../api/user/user";
import { userKeys } from "../../../api/user/userQueryKeys";
import type { ChangeEvent, FormEvent } from "react";

export type User = {
    userId: number;
    name: string;
    email: string;
    [key: string]: any;
};

type ProfileDraft = { name: string; email: string };
type SaveState = 'idle' | 'saving' | 'saved' | 'error';

type UseUserProfileReturn = {
    user: User | null;
    loading: boolean;
    error: Error | null;
    profile: ProfileDraft;
    formError: string | null;
    handleChange: (e: ChangeEvent<HTMLInputElement>) => void;
    handleSubmit: (e: FormEvent) => void;
    handleReset: () => void;
    isSaving: boolean;
    hasChanges: boolean;
    saveState: SaveState;
};

/**
 * Logger for useUserProfile module.
 * @constant
 */
const logger = {
    info: (...args: unknown[]) => console.log('[useUserProfile]', ...args),
    error: (...args: unknown[]) => console.error('[useUserProfile]', ...args),
};

/**
 * Checks if the local profile state differs from the user from the API.
 * @param {{name: string, email: string}} profile
 * @param {object} user
 * @returns {boolean}
 */
const isChanged = (profile: ProfileDraft, user: User | null): boolean => (
    !!user && (
        String(profile.name).trim() !== String(user.name).trim() ||
        String(profile.email).trim() !== String(user.email).trim()
    )
);

/**
 * Custom hook for advanced profile form UX, robust cache invalidation, and
 * green checkmark persist until next user change.
 *
 * @returns {{
 *   user: object | null,
 *   loading: boolean,
 *   error: any,
 *   profile: { name: string, email: string },
 *   formError: string | null,
 *   handleChange: function,
 *   handleSubmit: function,
 *   handleReset: function,
 *   isSaving: boolean,
 *   hasChanges: boolean,
 *   saveState: string
 * }}
 */
export const useUserProfile = (): UseUserProfileReturn => {
    logger.info('useUserProfile called');

    const {
        user,
        loading,
        error,
    } = useCurrentUser();

    const [profile, setProfile] = useState<ProfileDraft>({ name: '', email: '' });
    const [formError, setFormError] = useState<string | null>(null);
    const [saveState, setSaveState] = useState<SaveState>('idle');

    // Used to run "profile sync" effect only after certain updates (not after EVERY user change)
    const initialLoad = useRef(true);
    const queryClient = useQueryClient();

    // 🟢 Only sync profile ONCE on mount, or if real new user auth occurs
    useEffect(() => {
        if (user && initialLoad.current) {
            setProfile({ name: user.name, email: user.email });
            initialLoad.current = false;
            logger.info('Profile state initialized from user', user);
        }
    }, [user && user.userId]); // Only react to userId change (new auth), not every server update

    // When user edits, mark saveState idle
    const handleChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setProfile((prev) => ({
            ...prev,
            [name]: value,
        }));
        setFormError(null);
        setSaveState('idle');
        logger.info('Profile field changed', { [name]: value });
    }, []);

    const hasChanges = isChanged(profile, user);

    /**
     * Calls updateUser and invalidates all cache for current user on success.
     */
    const { mutate: updateProfile, isPending: isSaving } = useMutation({
        mutationFn: async (fields: ProfileDraft) => {
            logger.info('updateProfile mutationFn called', { fields });
            if (!user) throw new Error('No user to update');
            return await updateUser(user.userId, fields);
        },
        onSuccess: async (data) => {
            logger.info('Profile updated successfully', { data });
            if (!user) return;
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: userKeys.me() }),
                queryClient.invalidateQueries({ queryKey: userKeys.detail(user.userId) }),
                queryClient.invalidateQueries({ queryKey: userKeys.lists() }),
                queryClient.invalidateQueries({ queryKey: userKeys.public() }),
                queryClient.invalidateQueries({ queryKey: userKeys.publicList() }),
            ]);
            setFormError(null);
            setSaveState('saved'); // Stay saved until user types again
        },
        onError: (err: any) => {
            logger.error('Profile update failed', err);
            setFormError(err?.message || 'Failed to update profile. Please try again.');
            setSaveState('error');
        }
    });

    const handleSubmit = useCallback((e: FormEvent) => {
        e.preventDefault();
        if (!hasChanges || isSaving) return;

        logger.info('handleSubmit', profile);

        if (!profile.name.trim() || !profile.email.trim()) {
            setFormError('Both name and email are required.');
            logger.error('Profile validation failed: missing name or email');
            return;
        }

        setSaveState('saving');
        updateProfile(profile);
        logger.info('Profile update triggered');
    }, [profile, hasChanges, isSaving, updateProfile]);

    /**
     * Resets form state to latest user from API and clears Saved state.
     */
    const handleReset = useCallback(() => {
        if (user) {
            setProfile({ name: user.name, email: user.email });
            setFormError(null);
            setSaveState('idle');
            logger.info('Profile form reset');
        }
    }, [user]);

    return {
        user: user ?? null,
        loading,
        error: error ?? null,
        profile,
        formError,
        handleChange,
        handleSubmit,
        handleReset,
        isSaving,
        hasChanges,
        saveState,
    };
};