import { useState, useCallback } from 'react';
import { useQuery, useMutation, UseMutationResult } from '@tanstack/react-query';
import { useAuth } from '../../features/auth/hooks/useAuth';
import { login } from '../../features/auth/api/auth';
import { getPublicUsers } from '../../features/user/api/user';
import { userKeys } from '../../features/user/api/userQueryKeys';

// --- Types ---
type PublicUser = {
    id: number;
    username: string;
    [key: string]: any;
};

type LoginMutationVars = { passcode: string };

type LoginMutationResult = string; // Assuming login returns a token string

type LoginScreenStep = 'select' | 'password';

type UseLoginScreenReturn = {
    isAuthenticated: boolean;
    isLoadingUsers: boolean;
    usersError: string | null;
    publicUsers?: PublicUser[];
    selectedUserId: string;
    setSelectedUserId: (id: string) => void;
    step: LoginScreenStep;
    selectUser: (userId: string) => void;
    continueToPassword: () => void;
    backToSelect: () => void;
    handleLoginSubmit: (vars: LoginMutationVars) => void;
    mutationIsPending: boolean;
    error: string | null;
    resetError: () => void;
};

/**
 * Standardized logger for debugging and traceability.
 * Never logs sensitive data.
 * @constant
 */
const logger = {
    info: (...args: unknown[]) => console.log('[useLoginScreen]', ...args),
    error: (...args: unknown[]) => console.error('[useLoginScreen]', ...args),
};

/**
 * useLoginScreen
 * - Custom hook for auth screen logic and state.
 * - Fetches username list (cached up to 24h), manages selection, mutation, redirect, errors, and UI step flow.
 *
 * @returns {object} All state and handlers for the auth screen
 */
export const useLoginScreen = (): UseLoginScreenReturn => {
    const [error, setError] = useState<string | null>(null);
    const [selectedUserId, setSelectedUserId] = useState<string>('');
    const [step, setStep] = useState<LoginScreenStep>('select');
    const { isAuthenticated, setToken } = useAuth();

    // Public users query - cache 24h (staleTime), cacheTime optional (default 5min)
    const {
        data: publicUsers,
        isPending: isLoadingUsers,
        isError: hasUsersError,
        error: usersFetchError,
    } = useQuery<PublicUser[], Error>({
        queryKey: userKeys.public(),
        queryFn: getPublicUsers,
        staleTime: 24 * 60 * 60 * 1000,
        cacheTime: 25 * 60 * 60 * 1000,
    });

    // Login mutation
    const mutation: UseMutationResult<LoginMutationResult, Error, LoginMutationVars> = useMutation<LoginMutationResult, Error, LoginMutationVars>({
        mutationFn: async ({ passcode }) => {
            logger.info('auth mutationFn called', { userId: Number(selectedUserId) });
            // Ensure login returns a string (token)
            const result = await login(Number(selectedUserId), passcode);
            if (typeof result !== 'string') throw new Error('Invalid login response');
            return result;
        },
        onSuccess: async (token) => {
            logger.info('auth mutation onSuccess', { token: !!token });
            try {
                await setToken(token);
                // Removed navigation logic
            } catch (navError: any) {
                logger.error('navigation after auth failed', navError);
                setError('Login succeeded but navigation failed.');
            }
        },
        onError: (err: Error) => {
            logger.error('auth mutation onError', err);
            setError(err?.message || 'Login failed');
        }
    });

    const selectUser = useCallback((userId: string) => {
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
        ({ passcode }: LoginMutationVars) => {
            setError(null);
            mutation.mutate({ passcode });
        },
        [mutation]
    );

    const resetError = useCallback(() => setError(null), []);

    return {
        isAuthenticated,
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