/**
 * useLoginScreen
 * - Custom hook for login screen logic and state.
 * - Fetches username list, manages selection, mutation, redirect, errors, and UI step flow.
 *
 * @module useLoginScreen
 */

import { useState, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from './useAuth';
import { login } from '../../../api/auth/auth';
import { getPublicUsers } from '../../../api/user/user';
import { userKeys } from '../../../api/user/userQueryKeys';

/**
 * Standardized logger for debugging and traceability.
 * Never logs sensitive data.
 * @constant
 */
const logger = {
    info: (...args) => console.log('[useLoginScreen]', ...args),
    error: (...args) => console.error('[useLoginScreen]', ...args),
};

/**
 * Custom hook for login modal/screen logic.
 *
 * Responsibilities moved out of LoginScreen.jsx:
 *  - UI step flow (select | password)
 *  - user selection handler
 *  - continue/back handlers
 *
 * Side effects:
 *  - Fetch public users
 *  - Perform login mutation and navigation
 *
 * @returns {object} All state and handlers for the login screen
 */
export const useLoginScreen = () => {
    const [error, setError] = useState(null);
    const [selectedUserId, setSelectedUserId] = useState('');
    const [step, setStep] = useState('select');
    const navigate = useNavigate();
    const { isAuthenticated, setToken } = useAuth();

    // Public users query
    const {
        data: publicUsers,
        isPending: isLoadingUsers,
        isError: hasUsersError,
        error: usersFetchError,
    } = useQuery({
        queryKey: userKeys.public(),
        queryFn: getPublicUsers,
        staleTime: 1000 * 60 * 5,
    });

    // Login mutation
    const mutation = useMutation({
        mutationFn: async ({ passcode }) => {
            logger.info('login mutationFn called', { userId: Number(selectedUserId) });
            return await login(Number(selectedUserId), passcode);
        },
        onSuccess: async (token) => {
            logger.info('login mutation onSuccess', { token: !!token });
            try {
                await setToken(token);
                navigate('/', { replace: true });
            } catch (navError) {
                logger.error('navigation after login failed', navError);
                setError('Login succeeded but navigation failed.');
            }
        },
        onError: (err) => {
            logger.error('login mutation onError', err);
            setError(err?.message || 'Login failed');
        }
    });

    /**
     * Handler for selecting a user (from tile or select).
     *
     * @param {string} userId - ID of the selected user
     * @returns {void}
     */
    const selectUser = useCallback((userId) => {
        logger.info('selectUser called', { userId });
        setSelectedUserId(userId);
        setError(null);
    }, []);

    /**
     * Continue to the password step.
     * - Validates that a user is selected first.
     *
     * @returns {void}
     */
    const continueToPassword = useCallback(() => {
        if (!selectedUserId) {
            logger.info('continueToPassword prevented — no user selected');
            return;
        }
        logger.info('continueToPassword', { selectedUserId });
        setError(null);
        setStep('password');
    }, [selectedUserId]);

    /**
     * Go back to user selection step.
     *
     * @returns {void}
     */
    const backToSelect = useCallback(() => {
        logger.info('backToSelect called');
        setStep('select');
        setError(null);
    }, []);

    /**
     * Handles form submission for login.
     *
     * @param {{passcode: string}} formValues
     * @returns {void}
     */
    const handleLoginSubmit = useCallback(
        ({ passcode }) => {
            setError(null);
            mutation.mutate({ passcode });
        },
        [mutation]
    );

    /** Used for LoginForm to reset error state on user input */
    const resetError = useCallback(() => setError(null), []);

    // Early redirect if already authenticated
    const redirectElement = isAuthenticated ? <Navigate to="/" replace /> : null;

    return {
        // auth / redirects
        isAuthenticated,
        redirectElement,

        // fetch status / data
        isLoadingUsers,
        usersError: hasUsersError ? usersFetchError?.message || 'Could not load user list.' : null,
        publicUsers,

        // selection & UI flow
        selectedUserId,
        setSelectedUserId, // kept for compatibility if needed
        step,
        selectUser,
        continueToPassword,
        backToSelect,

        // login flow
        handleLoginSubmit,
        mutationIsPending: mutation.isPending,
        error,
        resetError,
    };
};