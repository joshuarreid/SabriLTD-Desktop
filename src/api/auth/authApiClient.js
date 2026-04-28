import ApiClient from "../ApiClient.js";

/**
 * AuthApiClient
 * - Specialized API client for authentication endpoints (`/api/auth`).
 * - Implements auth/logout and leverages the Bulletproof React API conventions.
 *
 * @class
 * @extends ApiClient
 */
const logger = {
    info: (...args) => console.log('[AuthApiClient]', ...args),
    error: (...args) => console.error('[AuthApiClient]', ...args),
};

/**
 * Maps API errors for the Auth API to user-friendly messages and error codes.
 *
 * @param {Object} error - The error object thrown by ApiClient.
 * @returns {Error} A normalized error with status and code, or the original error if unknown.
 */
function normalizeAuthError(error) {
    // The ApiClient _normalizeError returns: { message, status, data, originalError }
    const { status, data } = error;

    // Per SabriLTD docs, typical error type is in data.errors[0]?.type, e.g. UNAUTHORIZED or AUTH_ERROR.
    const errorType = data?.errors?.[0]?.type;
    const errorMsg = data?.errors?.[0]?.message || error.message;

    if (status === 401 || errorType === "UNAUTHORIZED" ) {
        const err = new Error(errorMsg || "Invalid user ID or passcode.");
        err.code = "UNAUTHORIZED";
        err.status = 401;
        return err;
    }

    if (status === 500 || errorType === "AUTH_ERROR") {
        const err = new Error(errorMsg || "Unexpected authentication error. Please try again.");
        err.code = "AUTH_ERROR";
        err.status = 500;
        return err;
    }

    // Fallback for any custom API errors
    if (data?.errors?.length) {
        const err = new Error(errorMsg);
        err.code = errorType || "AUTH_ERROR";
        err.status = status || 500;
        return err;
    }

    // Fallback to generic handler
    return error instanceof Error ? error : new Error(errorMsg || "Authentication error");
}

export default class AuthApiClient extends ApiClient {
    /**
     * Creates an instance of AuthApiClient.
     *
     * Uses baseURL from env API_URL unless overridden. Sets scope to `/api/auth`.
     *
     * @param {Object} [options={}]
     * @param {string} [options.baseURL] - Optional override for API base URL.
     * @param {number} [options.timeout=10000] - Request timeout in ms.
     */
    constructor({ baseURL, timeout = 10000 } = {}) {
        super({ baseURL, timeout, apiPath: '/api/auth' });
        logger.info('AuthApiClient initialized');
    }

    /**
     * Logs in a user via POST /auth.
     *
     * @async
     * @param {Object} credentials
     * @param {number} credentials.userId - Unique user ID.
     * @param {string} credentials.passcode - User's password or code.
     * @returns {Promise<Object>} API response with session/token data.
     * @throws {Error} If the request fails (401, 500, network, etc).
     */
    async login({ userId, passcode }) {
        logger.info('auth called', { userId });
        try {
            if (typeof userId === 'undefined' || !passcode) {
                throw new Error('userId and passcode are required for auth');
            }
            const response = await this.post('/login', { userId, passcode });
            logger.info('auth success', { userId });
            return response;
        } catch (error) {
            logger.error('auth failed', error);
            throw normalizeAuthError(error);
        }
    }

    /**
     * Logs out the current session via POST /logout.
     * The caller must provide the JWT token as Authorization header ("Bearer ...").
     *
     * @async
     * @param {string} token - JWT token for the current session.
     * @returns {Promise<Object>} Logout confirmation from API.
     * @throws {Error} If the request fails (missing/invalid token, 401, etc).
     */
    async logout(token) {
        logger.info('logout called');
        try {
            if (!token) {
                throw new Error('Token is required for logout');
            }
            const headers = {
                Authorization: `Bearer ${token}`,
            };
            const response = await this.post('/logout', null, { headers });
            logger.info('logout success');
            return response;
        } catch (error) {
            logger.error('logout failed:', error);
            throw normalizeAuthError(error);
        }
    }
}