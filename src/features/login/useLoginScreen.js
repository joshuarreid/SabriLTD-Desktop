/**
 * useLoginScreen
 * - Custom hook for login screen logic and state.
 * - Fetches username list, manages selection, mutation, redirect, and errors.
 */

import { useState, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from './useAuth';
import { login } from '../../api/auth/auth';
import { getPublicUsers } from '../../api/user/user';
import { userKeys } from '../../api/user/userQueryKeys';

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
 * @returns {object} All state and handlers for the login screen
 */
export const useLoginScreen = () => {
    const [error, setError] = useState(null);
    const [selectedUserId, setSelectedUserId] = useState('');
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
            await setToken(token);
            navigate('/', { replace: true });
        },
        onError: (error) => {
            logger.error('login mutation onError', error);
            setError(error?.message || 'Login failed');
        }
    });

    /**
     * Handler for changing the selected user in the dropdown or tile.
     * @param {string} userId
     */
    const handleUserSelect = useCallback((eOrUserId) => {
        // Handles both event from <select> and direct userId from tile
        let newUserId;
        if (typeof eOrUserId === 'string') {
            newUserId = eOrUserId;
        } else if (eOrUserId && eOrUserId.target) {
            newUserId = eOrUserId.target.value;
        }
        setSelectedUserId(newUserId);
        setError(null);
    }, []);

    /**
     * Handles form submission for login.
     * @param {{passcode: string}} formValues
     */
    const handleLoginSubmit = useCallback(
        ({ passcode }) => {
            setError(null);
            mutation.mutate({ passcode });
        },
        [selectedUserId, mutation]
    );

    /** Used for LoginForm to reset error state on user input */
    const resetError = useCallback(() => setError(null), []);

    // Early redirect if already authenticated
    const redirectElement = isAuthenticated ? <Navigate to="/" replace /> : null;

    return {
        isAuthenticated,
        isLoadingUsers,
        usersError: hasUsersError ? usersFetchError?.message || 'Could not load user list.' : null,
        error,
        publicUsers,
        selectedUserId,
        setSelectedUserId, // <-- FIX: Add this so tiles can call it!
        handleUserSelect,
        handleLoginSubmit,
        mutationIsPending: mutation.isPending,
        resetError,
        redirectElement,
    };
};