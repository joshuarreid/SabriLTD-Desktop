/**
 * UserApiClient
 * - Specialized API client for user endpoints.
 * - Implements public user list fetching, get current user (/me), and follows Bulletproof React conventions.
 *
 * @module UserApiClient
 */

import ApiClient from "../ApiClient";

/**
 * Standardized logger for debugging and traceability.
 * Never logs sensitive data.
 * @constant
 * @type {{info: Function, error: Function}}
 */
const logger = {
    info: (...args) => console.log('[UserApiClient]', ...args),
    error: (...args) => console.error('[UserApiClient]', ...args),
};

/**
 * Retrieves the session token from Electron main process via preload bridge.
 * @async
 * @function getTokenFromElectron
 * @returns {Promise<string|null>} The authentication token, or null if unavailable.
 */
const getTokenFromElectron = async () => {
    logger.info('getTokenFromElectron called');
    if (window.electronAPI && window.electronAPI.tokenGet) {
        try {
            const { success, token } = await window.electronAPI.tokenGet();
            logger.info('getTokenFromElectron response', { success });
            return success ? token : null;
        } catch (error) {
            logger.error('getTokenFromElectron error', error);
            return null;
        }
    }
    logger.error('Electron ipc not available; token-get skipped');
    return null;
};

/**
 * UserApiClient
 * Handles API requests to user endpoints, including public listing and /me endpoint.
 *
 * @class
 * @extends ApiClient
 */
export default class UserApiClient extends ApiClient {
    /**
     * Creates an instance of UserApiClient.
     * Uses baseURL from env API_URL unless overridden.
     *
     * @param {Object} [options={}]
     * @param {string} [options.baseURL] - Optional override for API base URL.
     * @param {number} [options.timeout=10000] - Request timeout in ms.
     */
    constructor({ baseURL, timeout = 10000 } = {}) {
        super({ baseURL, timeout, apiPath: '/api/users' });
        logger.info('UserApiClient initialized');
    }

    /**
     * Fetches the public list of users (minimal info, no auth required).
     * Makes GET request to `/public-list`.
     *
     * @async
     * @returns {Promise<Object>} API response with array of user objects { userId, name }
     * @throws {Error} If the request fails (network, 500, etc).
     */
    async fetchPublicList() {
        logger.info('fetchPublicList called');
        try {
            const response = await this.get('/public-list');
            logger.info('fetchPublicList success', { count: Array.isArray(response?.data) ? response.data.length : 0 });
            return response;
        } catch (error) {
            logger.error('fetchPublicList failed', error);
            throw error;
        }
    }

    /**
     * Fetches details for the currently authenticated user using /me endpoint.
     * Uses Electron IPC preload bridge to retrieve the token and attaches it as Authorization header.
     *
     * @async
     * @function fetchMe
     * @returns {Promise<Object>} API response with user object.
     * @throws {Error} If the request fails (network, 401, 500, etc).
     */
    async fetchMe() {
        logger.info('fetchMe called');
        try {
            const token = await getTokenFromElectron();
            if (!token) {
                logger.error('fetchMe failed: No token available');
                throw new Error('No authentication token found');
            }
            // Headers must be passed as the third options argument (see ApiClient.get signature)
            const response = await this.get('/me', {}, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            logger.info('fetchMe success', { userId: response?.data?.userId });
            return response;
        } catch (error) {
            logger.error('fetchMe failed', error);
            throw error;
        }
    }
}