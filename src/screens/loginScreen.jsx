/**
 * LoginScreen
 * - Auth UI for user login.
 * - Uses Bulletproof React structure and conventions.
 *
 * @module LoginScreen
 */

import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate, Navigate } from 'react-router-dom';
import { LoginForm } from '../features/login/LoginForm';
import { useAuth } from '../features/login/useAuth';
import { login } from '../api/auth/auth';

/**
 * Standardized logger for debugging and traceability.
 * Never logs sensitive data.
 * @constant
 * @type {{info: Function, error: Function}}
 */
const logger = {
    info: (...args) => console.log('[LoginScreen]', ...args),
    error: (...args) => console.error('[LoginScreen]', ...args),
};

/**
 * LoginScreen
 * Renders the login form and handles login logic.
 *
 * @returns {JSX.Element}
 */
const LoginScreen = () => {
    /**
     * Local error message state.
     * @type {[string|null, Function]}
     */
    const [error, setError] = useState(null);

    /**
     * Pull auth state and token setter from context.
     */
    const { isAuthenticated, setToken } = useAuth();

    /**
     * Declarative navigation for successful login.
     */
    const navigate = useNavigate();

    /**
     * useMutation hook for handling login mutation.
     * - Calls login API.
     * - On success, sets JWT token and navigates to '/'.
     * - On error, sets local error message.
     * @type {ReturnType<typeof useMutation>}
     */
    const mutation = useMutation({
        mutationFn: async ({ userId, passcode }) => {
            logger.info('login mutationFn called', { userId });
            return await login(userId, passcode);
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
     * Handles form submission from LoginForm component.
     * Clears previous errors, triggers mutation.
     *
     * @function
     * @param {{userId: number, passcode: string}} values
     */
    const handleSubmit = (values) => {
        logger.info('handleSubmit called', values);
        setError(null);
        mutation.mutate(values);
    };

    /**
     * Early route protection (redirect to home if already authenticated).
     */
    if (isAuthenticated) {
        logger.info('Already authenticated, redirecting to home');
        return <Navigate to="/" replace />;
    }

    return (
        <div className="login-screen">
            <h2>Login</h2>
            <LoginForm onSubmit={handleSubmit} isLoading={mutation.isPending} />
            {error && <div className="error-msg">{error}</div>}
        </div>
    );
};

export default LoginScreen;