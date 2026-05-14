/**
 * BuildingApiClient
 * - Specialized API client for Building endpoints.
 * - Implements building CRUD, audited responses, filtering, pagination, and follows Bulletproof React conventions.
 *
 * @module BuildingApiClient
 */

import ApiClient from "../../../api/ApiClient.ts";

/**
 * Standardized logger for debugging and traceability.
 * Never logs sensitive data.
 * @constant
 * @type {{info: Function, error: Function}}
 */
const logger = {
    info: (...args) => console.log('[BuildingApiClient]', ...args),
    error: (...args) => console.error('[BuildingApiClient]', ...args),
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
 * BuildingApiClient
 * Handles API requests to building endpoints, including CRUD and with-storage aggregation endpoints.
 *
 * @class
 * @extends ApiClient
 */
export default class BuildingApiClient extends ApiClient {
    /**
     * Creates an instance of BuildingApiClient.
     * Uses baseURL from env API_URL unless overridden.
     *
     * @param {Object} [options={}]
     * @param {string} [options.baseURL] - Optional override for API base URL.
     * @param {number} [options.timeout=10000] - Request timeout in ms.
     */
    constructor({ baseURL, timeout = 10000 } = {}) {
        super({ baseURL, timeout, apiPath: '/api/buildings' });
        logger.info('BuildingApiClient initialized');
    }

    /**
     * Creates a new building (requires authentication).
     * @async
     * @param {Object} payload - The building inputfields { name, address, manager }
     * @returns {Promise<Object>} API response with new building
     * @throws {Error} If request fails, duplicate/invalid, or validation error.
     */
    async createBuilding(payload) {
        logger.info('createBuilding called - full payload', payload);
        try {
            const token = await getTokenFromElectron();
            if (!token) {
                logger.error('createBuilding failed: No token available');
                throw new Error('No authentication token found');
            }
            const response = await this.post('/', payload, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            logger.info('createBuilding response', response);
            return response;
        } catch (error) {
            logger.error('createBuilding failed', error);
            throw error;
        }
    }

    /**
     * Fetches all buildings (supports filters, pagination, and sorting). Requires authentication.
     * @async
     * @param {Object} [params={}] - Optional filter and pagination params, e.g. { page, size, sortField, sortOrder, name }
     * @returns {Promise<Object>} API response with array of building objects
     * @throws {Error} If request fails (network, 401, 500, etc).
     */
    async fetchAllBuildings(params = {}) {
        logger.info('fetchAllBuildings called - full payload', params);
        try {
            const token = await getTokenFromElectron();
            if (!token) {
                logger.error('fetchAllBuildings failed: No token available');
                throw new Error('No authentication token found');
            }
            const response = await this.get('/', params, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            logger.info('fetchAllBuildings response', response);
            return response;
        } catch (error) {
            logger.error('fetchAllBuildings failed', error);
            throw error;
        }
    }

    /**
     * Fetches a specific building by building ID (requires authentication).
     * @async
     * @param {number} buildingId - The building ID to retrieve.
     * @returns {Promise<Object>} API response with building object
     * @throws {Error} If building does not exist or request fails.
     */
    async fetchBuildingById(buildingId) {
        logger.info('fetchBuildingById called - full payload', { buildingId });
        try {
            const token = await getTokenFromElectron();
            if (!token) {
                logger.error('fetchBuildingById failed: No token available');
                throw new Error('No authentication token found');
            }
            const response = await this.get(`/${buildingId}`, {}, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            logger.info('fetchBuildingById response', response);
            return response;
        } catch (error) {
            logger.error('fetchBuildingById failed', error);
            throw error;
        }
    }

    /**
     * Updates an existing building by buildingId (requires authentication).
     * @async
     * @param {number} buildingId - The building ID to update
     * @param {Object} payload - The inputfields to update { name, address, manager }
     * @returns {Promise<Object>} API response with updated building
     * @throws {Error} If not found, validation fails, or request fails.
     */
    async updateBuilding(buildingId, payload) {
        logger.info('updateBuilding called', { buildingId });
        try {
            const token = await getTokenFromElectron();
            if (!token) {
                logger.error('updateBuilding failed: No token available');
                throw new Error('No authentication token found');
            }
            const response = await this.put(`/${buildingId}`, payload, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            logger.info('updateBuilding success', { buildingId: response?.data?.buildingId });
            return response;
        } catch (error) {
            logger.error('updateBuilding failed', error);
            throw error;
        }
    }

    /**
     * Deletes a building by buildingId (requires authentication).
     * @async
     * @param {number} buildingId - The building ID to delete.
     * @returns {Promise<Object>} API success response (204) or throws
     * @throws {Error} If building is not found or request fails.
     */
    async deleteBuilding(buildingId) {
        logger.info('deleteBuilding called', { buildingId });
        try {
            const token = await getTokenFromElectron();
            if (!token) {
                logger.error('deleteBuilding failed: No token available');
                throw new Error('No authentication token found');
            }
            const response = await this.delete(`/${buildingId}`, {}, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            logger.info('deleteBuilding success', { buildingId });
            return response;
        } catch (error) {
            logger.error('deleteBuilding failed', error);
            throw error;
        }
    }

    /**
     * Fetches all buildings along with their storage (with advanced aggregation), authenticated.
     * @async
     * @param {Object} [params={}] - Optional filter, pagination, sorting params.
     * @returns {Promise<Object>} API response with array of building-with-storage objects
     * @throws {Error} If request fails (network, 401, 500, etc).
     */
    async fetchBuildingsWithStorage(params = {}) {
        logger.info('fetchBuildingsWithStorage called', params);
        try {
            const token = await getTokenFromElectron();
            if (!token) {
                logger.error('fetchBuildingsWithStorage failed: No token available');
                throw new Error('No authentication token found');
            }
            const response = await this.get('/with-storage', params, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            logger.info('fetchBuildingsWithStorage success', { count: Array.isArray(response?.data) ? response.data.length : 0 });
            return response;
        } catch (error) {
            logger.error('fetchBuildingsWithStorage failed', error);
            throw error;
        }
    }
}