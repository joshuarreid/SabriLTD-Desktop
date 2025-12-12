/**
 * useUserProfile
 * - Custom hook for user profile edit form logic.
 * - Consumes useCurrentUser for initial population.
 * - Handles local form state, update mutation, cache invalidation, and error handling.
 *
 * @module useUserProfile
 */

import { useState, useCallback, useEffect } from 'react';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { useCurrentUser } from "../../navigationbar/hooks/useCurrentUser";
import { updateUser } from "../../../api/user/user";
import { userKeys } from "../../../api/user/userQueryKeys";

/**
 * Logger for useUserProfile module.
 * @constant
 */
const logger = {
    info: (...args) => console.log('[useUserProfile]', ...args),
    error: (...args) => console.error('[useUserProfile]', ...args),
};

/**
 * useUserProfile
 * - Handles local form state, update mutation, and query cache invalidation for editing user profile.
 * - Resynchronizes form state any time user changes.
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
 *   isSaving: boolean
 * }}
 */
export const useUserProfile = () => {
    logger.info('useUserProfile called');
    const {
        user,
        loading,
        error,
    } = useCurrentUser();

    const [profile, setProfile] = useState({ name: '', email: '' });
    const [formError, setFormError] = useState(null);

    /** @type {import('@tanstack/react-query').QueryClient} */
    const queryClient = useQueryClient();

    useEffect(() => {
        if (user) {
            setProfile({ name: user.name, email: user.email });
        }
    }, [user]);

    /**
     * Handles input changes for profile fields.
     * @param {React.ChangeEvent<HTMLInputElement>} e
     */
    const handleChange = useCallback((e) => {
        const { name, value } = e.target;
        setProfile((prev) => ({
            ...prev,
            [name]: value,
        }));
        setFormError(null);
    }, []);

    /**
     * useMutation for user update.
     * Calls updateUser API and then invalidates all user-related caches.
     */
    const { mutate: updateProfile, isPending: isSaving } = useMutation({
        mutationFn: async (fields) => {
            logger.info('updateProfile mutationFn called', { userId: user.userId, fields });
            return await updateUser(user.userId, fields);
        },
        onSuccess: async (data) => {
            logger.info('Profile updated successfully', { data });
            // Invalidate all relevant user queries after update
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: userKeys.me() }),
                queryClient.invalidateQueries({ queryKey: userKeys.detail(user.userId) }),
                queryClient.invalidateQueries({ queryKey: userKeys.lists() }),
                queryClient.invalidateQueries({ queryKey: userKeys.public() }),
                queryClient.invalidateQueries({ queryKey: userKeys.publicList() }),
            ]);
            setFormError(null);
        },
        onError: (err) => {
            logger.error('Profile update failed', err);
            setFormError(err?.message || 'Failed to update profile. Please try again.');
        }
    });

    /**
     * Handles form submission, updates profile via API, and invalidates caches.
     * @param {React.FormEvent} e
     */
    const handleSubmit = useCallback((e) => {
        e.preventDefault();
        logger.info('handleSubmit', profile);

        // Simple validation
        if (!profile.name.trim() || !profile.email.trim()) {
            setFormError('Both name and email are required.');
            return;
        }

        updateProfile(profile);
        // Only depend on profile & updateProfile to avoid stale refs.
        // user change triggers useEffect to reset profile instead.
    }, [profile, updateProfile]);

    /**
     * Resets the form to the current user values.
     */
    const handleReset = useCallback(() => {
        if (user) {
            setProfile({ name: user.name, email: user.email });
            setFormError(null);
        }
    }, [user]);

    return {
        user,
        loading,
        error,
        profile,
        formError,
        handleChange,
        handleSubmit,
        handleReset,
        isSaving,
    };
};