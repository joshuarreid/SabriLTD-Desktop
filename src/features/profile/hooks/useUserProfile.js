/**
 * useUserProfile
 * - Custom hook for user profile edit form logic.
 * - Consumes useCurrentUser for initial population.
 * - Handles local form state, change/reset/submit.
 * - No mutation API yet.
 *
 * @module useUserProfile
 */

import { useState, useCallback, useEffect } from 'react';
import {useCurrentUser} from "../../navigationbar/hooks/useCurrentUser";


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
 * - Handles local form state and validation for editing user profile.
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

    /**
     * Effect: Keep local form state in sync with loaded user.
     */
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
     * Handles form submission.
     * @param {React.FormEvent} e
     */
    const handleSubmit = useCallback((e) => {
        e.preventDefault();
        logger.info('handleSubmit', profile);

        // Example validation (expand based on business rules)
        if (!profile.name.trim() || !profile.email.trim()) {
            setFormError('Both name and email are required.');
            return;
        }
        // No API mutation wired up yet; show log only
        logger.info('Pretend to submit profile changes:', profile);
        setFormError('Profile updating is not yet implemented.');
    }, [profile]);

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
    };
};