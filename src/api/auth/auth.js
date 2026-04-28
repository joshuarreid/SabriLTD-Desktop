import AuthApiClient from "./authApiClient.js";

/**
 * Singleton instance of AuthApiClient.
 * Ensures all auth requests are routed through a preconfigured client.
 *
 * @constant
 * @type {AuthApiClient}
 */
const apiClient = new AuthApiClient();

/**
 * Performs auth by sending credentials to /api/auth/auth.
 * Returns the session token or full session payload.
 *
 * @async
 * @function login
 * @param {number} userId - Unique user ID (numeric, required)
 * @param {string} passcode - User's password/passcode (required)
 * @returns {Promise<string|Object>} JWT token string, or session data object if no token found.
 * @throws {Error} If the request fails (network, 401, 500, etc).
 */
export async function login(userId, passcode) {
    logger.info('auth called', { userId });

    try {
        // Validate parameters
        if (
            typeof userId === "undefined" ||
            userId === null ||
            isNaN(Number(userId))
        ) {
            throw new Error("userId (number) is required for auth");
        }
        if (!passcode || typeof passcode !== "string" || passcode.trim() === "") {
            throw new Error("passcode (string) is required for auth");
        }

        // Call AuthApiClient.auth({ userId, passcode }), returns full API response shape
        const response = await apiClient.login({ userId, passcode });

        // Defensive: API wraps payload as { status, data, transactionId, errors }
        // Prefer to return data.token, fallback to all data
        if (response?.data?.token) {
            logger.info('auth successful (token received)', { userId });
            return response.data.token;
        }
        logger.info('auth successful (no token field)', { userId });
        return response.data;
    } catch (error) {
        logger.error('auth failed', error);
        throw error;
    }
}

/**
 * Logs out the current session using /api/auth/logout.
 *
 * @async
 * @function logout
 * @param {string} token - JWT session token (required, typically from secure store)
 * @returns {Promise<Object>} API response confirming logout.
 * @throws {Error} If token is missing or request fails (401, 500, etc).
 */
export async function logout(token) {
    logger.info('logout called');
    try {
        if (!token || typeof token !== "string" || token.trim() === "") {
            throw new Error("JWT token is required for logout");
        }
        const response = await apiClient.logout(token);
        logger.info('logout successful');
        return response.data; // expects shape: { result: "logged out" }
    } catch (error) {
        logger.error('logout failed', error);
        throw error;
    }
}

/**
 * Auth module logger (standardized).
 *
 * @constant
 */
const logger = {
    info: (...args) => console.log('[auth]', ...args),
    error: (...args) => console.error('[auth]', ...args),
};