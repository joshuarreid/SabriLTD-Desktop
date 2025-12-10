/**
 * UserApiClient
 * - Specialized API client for user endpoints.
 * - Implements public user list fetching and follows Bulletproof React conventions.
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
 * UserApiClient
 * Handles API requests to user endpoints, including public listing.
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
     * Makes GET request to `/api/users/public-list`.
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
}