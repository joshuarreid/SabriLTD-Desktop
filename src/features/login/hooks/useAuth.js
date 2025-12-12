/**
 * Auth context and hook for managing login state and token, using Keytar via Electron Preload Bridge.
 * This is a context-layer abstraction for auth session.
 */

import React, { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext();

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
const saveToken = async (token) => {
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
 * AuthProvider - Supplies login state and actions.
 * @param {object} props
 * @param {React.ReactNode} props.children
 * @returns {JSX.Element}
 */
export const AuthProvider = ({ children }) => {
    const [token, setTokenState] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadToken().then((tok) => {
            setTokenState(tok);
            setLoading(false);
        });
    }, []);

    /**
     * Sets new JWT token and persists in Keytar via preload bridge.
     * @param {string} tok
     */
    const setToken = async (tok) => {
        await saveToken(tok);
        setTokenState(tok);
    };

    /**
     * Logs out the user, removes token.
     */
    const logout = async () => {
        await clearToken();
        setTokenState(null);
    };

    // Memoized context value
    const value = React.useMemo(
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
 * @returns {object} Auth context value
 */
export const useAuth = () => {
    return useContext(AuthContext);
};