/**
 * ConditionApiClient
 * - Specialized API client for Condition endpoints.
 * - Implements condition CRUD, audited responses, and follows Bulletproof React conventions.
 *
 * @module ConditionApiClient
 */

import ApiClient from "../ApiClient.ts";

/**
 * Standardized logger for debugging and traceability.
 * Never logs sensitive data.
 * @constant
 * @type {{info: Function, error: Function}}
 */
const logger = {
    info: (...args) => console.log('[ConditionApiClient]', ...args),
    error: (...args) => console.error('[ConditionApiClient]', ...args),
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
 * ConditionApiClient
 * Handles API requests to condition endpoints, including CRUD.
 *
 * @class
 * @extends ApiClient
 */
export default class ConditionApiClient extends ApiClient {
    /**
     * Creates an instance of ConditionApiClient.
     * Uses baseURL from env API_URL unless overridden.
     *
     * @param {Object} [options={}]
     * @param {string} [options.baseURL] - Optional override for API base URL.
     * @param {number} [options.timeout=10000] - Request timeout in ms.
     */
    constructor({ baseURL, timeout = 10000 } = {}) {
        super({ baseURL, timeout, apiPath: '/api/conditions' });
        logger.info('ConditionApiClient initialized');
    }

    /**
     * Creates a new condition (requires authentication).
     * @async
     * @param {Object} payload - The condition inputfields { name }
     * @returns {Promise<Object>} API response with new condition
     * @throws {Error} If request fails, duplicate/invalid, or validation error.
     */
    async createCondition(payload) {
        logger.info('createCondition called', { name: payload?.name });
        try {
            const token = await getTokenFromElectron();
            if (!token) {
                logger.error('createCondition failed: No token available');
                throw new Error('No authentication token found');
            }
            const response = await this.post('/', payload, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            logger.info('createCondition success', { conditionId: response?.data?.conditionId });
            return response;
        } catch (error) {
            logger.error('createCondition failed', error);
            throw error;
        }
    }

    /**
     * Fetches all conditions (requires authentication).
     * @async
     * @returns {Promise<Object>} API response with array of condition objects
     * @throws {Error} If request fails (network, 401, 500, etc).
     */
    async fetchAllConditions() {
        logger.info('fetchAllConditions called');
        try {
            const token = await getTokenFromElectron();
            if (!token) {
                logger.error('fetchAllConditions failed: No token available');
                throw new Error('No authentication token found');
            }
            const response = await this.get('/', {}, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            logger.info('fetchAllConditions success', { count: Array.isArray(response?.data) ? response.data.length : 0 });
            return response;
        } catch (error) {
            logger.error('fetchAllConditions failed', error);
            throw error;
        }
    }

    /**
     * Fetches a specific condition by conditionId (requires authentication).
     * @async
     * @param {number} conditionId - The condition ID to retrieve.
     * @returns {Promise<Object>} API response with condition object
     * @throws {Error} If condition does not exist or request fails.
     */
    async fetchConditionById(conditionId) {
        logger.info('fetchConditionById called', { conditionId });
        try {
            const token = await getTokenFromElectron();
            if (!token) {
                logger.error('fetchConditionById failed: No token available');
                throw new Error('No authentication token found');
            }
            const response = await this.get(`/${conditionId}`, {}, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            logger.info('fetchConditionById success', { conditionId: response?.data?.conditionId });
            return response;
        } catch (error) {
            logger.error('fetchConditionById failed', error);
            throw error;
        }
    }

    /**
     * Updates an existing condition by conditionId (requires authentication).
     * @async
     * @param {number} conditionId - The condition ID to update
     * @param {Object} payload - The updated condition { name }
     * @returns {Promise<Object>} API response with updated condition
     * @throws {Error} If not found, validation fails, duplicate, or request fails.
     */
    async updateCondition(conditionId, payload) {
        logger.info('updateCondition called', { conditionId });
        try {
            const token = await getTokenFromElectron();
            if (!token) {
                logger.error('updateCondition failed: No token available');
                throw new Error('No authentication token found');
            }
            const response = await this.put(`/${conditionId}`, payload, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            logger.info('updateCondition success', { conditionId: response?.data?.conditionId });
            return response;
        } catch (error) {
            logger.error('updateCondition failed', error);
            throw error;
        }
    }

    /**
     * Deletes a condition by conditionId (requires authentication).
     * @async
     * @param {number} conditionId - The condition ID to delete.
     * @returns {Promise<Object>} API success response (204) or throws
     * @throws {Error} If condition is not found or request fails.
     */
    async deleteCondition(conditionId) {
        logger.info('deleteCondition called', { conditionId });
        try {
            const token = await getTokenFromElectron();
            if (!token) {
                logger.error('deleteCondition failed: No token available');
                throw new Error('No authentication token found');
            }
            const response = await this.delete(`/${conditionId}`, {}, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            logger.info('deleteCondition success', { conditionId });
            return response;
        } catch (error) {
            logger.error('deleteCondition failed', error);
            throw error;
        }
    }
}