// This file is migrated from useAuth.js to useAuth.ts for proper TypeScript support.
// ...existing code from useAuth.js...

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { userKeys } from '../../../api/user/userQueryKeys.js';

// Extend the Window interface for electronAPI
// This must be after imports and before any code using window.electronAPI

declare global {
    interface Window {
        electronAPI?: {
            tokenGet?: () => Promise<{ success: boolean; token?: string }>;
            tokenStore?: (token: string) => Promise<{ success: boolean }>;
            tokenDelete?: () => Promise<{ success: boolean }>;
        };
    }
}

/**
 * Logger for useAuth module.
 */
const logger = {
    info: (...args: unknown[]) => console.log('[useAuth]', ...args),
    error: (...args: unknown[]) => console.error('[useAuth]', ...args),
};

/**
 * TypeScript type for AuthContext value.
 */
export type AuthContextType = {
    token: string | null;
    isAuthenticated: boolean;
    setToken: (tok: string) => Promise<void>;
    logout: () => Promise<void>;
    loading: boolean;
};

/**
 * AuthContext - React Context for authentication and session.
 * @type {React.Context<AuthContextType>}
 */
const AuthContext = createContext<AuthContextType>({
    token: null,
    isAuthenticated: false,
    setToken: async () => {},
    logout: async () => {},
    loading: true
});

/**
 * Reads the stored auth token via secure IPC/keytar using Electron preload bridge.
 * @returns {Promise<string|null>}
 */
const loadToken = async () => {
    if (window.electronAPI && window.electronAPI.tokenGet) {
        const { success, token } = await window.electronAPI.tokenGet();
        return success ? token : null;
    }
    return null;
};

/**
 * Sets the auth token using keytar via Electron preload bridge.
 * @param {string} token
 * @returns {Promise<boolean>}
 */
const saveToken = async (token: string) => {
    if (window.electronAPI && window.electronAPI.tokenStore) {
        const { success } = await window.electronAPI.tokenStore(token);
        return !!success;
    }
    return false;
};

/**
 * Clears the auth token using keytar via Electron preload bridge.
 * @returns {Promise<void>}
 */
const clearToken = async () => {
    if (window.electronAPI && window.electronAPI.tokenDelete) {
        await window.electronAPI.tokenDelete();
    }
};

/**
 * AuthProvider - Supplies auth state and actions.
 * @param {object} props
 * @param {React.ReactNode} props.children
 * @returns {JSX.Element}
 */
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [token, setTokenState] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    const queryClient = useQueryClient();

    useEffect(() => {
        loadToken().then((tok) => {
            setTokenState(tok ?? null);
            setLoading(false);
        });
    }, []);

    /**
     * Sets new JWT token and persists in Keytar via preload bridge.
     * @param {string} tok
     */
    const setToken = async (tok: string) => {
        logger.info('setToken called');
        await saveToken(tok);
        setTokenState(tok);
    };

    /**
     * Logs out the user, removes token, and clears user-related cache.
     * @async
     */
    const logout = async () => {
        logger.info('logout called');
        await clearToken();
        setTokenState(null);
        queryClient.removeQueries(userKeys.me() as any); // clear user cache when logging out
    };

    // Memoized context value
    const value = React.useMemo<AuthContextType>(
        () => ({
            token,
            isAuthenticated: !!token,
            setToken,
            logout,
            loading
        }),
        [token, loading]
    );

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

/**
 * useAuth - Hook to access auth context.
 * @returns {AuthContextType} Auth context value
 */
export const useAuth = (): AuthContextType => {
    return useContext(AuthContext);
};
