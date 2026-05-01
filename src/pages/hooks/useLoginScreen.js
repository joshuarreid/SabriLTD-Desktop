import { useState, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../../features/auth/hooks/useAuth.tsx';
import { login } from '../../api/auth/auth.js';
import { getPublicUsers } from '../../api/user/user.js';
import { userKeys } from '../../api/user/userQueryKeys.js';

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
 * useLoginScreen
 * - Custom hook for auth screen logic and state.
 * - Fetches username list (cached up to 24h), manages selection, mutation, redirect, errors, and UI step flow.
 *
 * @returns {object} All state and handlers for the auth screen
 */
export const useLoginScreen = () => {
    const [error, setError] = useState(null);
    const [selectedUserId, setSelectedUserId] = useState('');
    const [step, setStep] = useState('select');
    const navigate = useNavigate();
    const { isAuthenticated, setToken } = useAuth();

    // Public users query - cache 24h (staleTime), cacheTime optional (default 5min)
    const {
        data: publicUsers,
        isPending: isLoadingUsers,
        isError: hasUsersError,
        error: usersFetchError,
    } = useQuery({
        queryKey: userKeys.public(), // Use public() for now (no filters)
        queryFn: getPublicUsers,
        staleTime: 24 * 60 * 60 * 1000, // 24 hours in ms
        cacheTime: 25 * 60 * 60 * 1000, // 25 hours, so data isn't immediately evicted after staling (optional)
    });

    // Login mutation
    const mutation = useMutation({
        mutationFn: async ({ passcode }) => {
            logger.info('auth mutationFn called', { userId: Number(selectedUserId) });
            return await login(Number(selectedUserId), passcode);
        },
        onSuccess: async (token) => {
            logger.info('auth mutation onSuccess', { token: !!token });
            try {
                await setToken(token);
                navigate('/', { replace: true });
            } catch (navError) {
                logger.error('navigation after auth failed', navError);
                setError('Login succeeded but navigation failed.');
            }
        },
        onError: (err) => {
            logger.error('auth mutation onError', err);
            setError(err?.message || 'Login failed');
        }
    });

    // ...rest of hook remains the same...
    const selectUser = useCallback((userId) => {
        logger.info('selectUser called', { userId });
        setSelectedUserId(userId);
        setError(null);
    }, []);

    const continueToPassword = useCallback(() => {
        if (!selectedUserId) {
            logger.info('continueToPassword prevented — no user selected');
            return;
        }
        logger.info('continueToPassword', { selectedUserId });
        setError(null);
        setStep('password');
    }, [selectedUserId]);

    const backToSelect = useCallback(() => {
        logger.info('backToSelect called');
        setStep('select');
        setError(null);
    }, []);

    const handleLoginSubmit = useCallback(
        ({ passcode }) => {
            setError(null);
            mutation.mutate({ passcode });
        },
        [mutation]
    );

    const resetError = useCallback(() => setError(null), []);
    const redirectElement = isAuthenticated ? <Navigate to="/" replace /> : null;

    return {
        isAuthenticated,
        redirectElement,
        isLoadingUsers,
        usersError: hasUsersError ? usersFetchError?.message || 'Could not load user list.' : null,
        publicUsers,
        selectedUserId,
        setSelectedUserId,
        step,
        selectUser,
        continueToPassword,
        backToSelect,
        handleLoginSubmit,
        mutationIsPending: mutation.isPending,
        error,
        resetError,
    };
};