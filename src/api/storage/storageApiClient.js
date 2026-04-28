import ApiClient from "../ApiClient.ts";

/**
 * logger for StorageApiClient - robust, standardized, no sensitive data.
 * @constant
 * @type {{info: Function, error: Function}}
 */
const logger = {
    info: (...args) => console.log('[StorageApiClient]', ...args),
    error: (...args) => console.error('[StorageApiClient]', ...args),
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
 * StorageApiClient
 * Handles API requests to storage endpoints, including CRUD and list/query.
 *
 * @class
 * @extends ApiClient
 */
export default class StorageApiClient extends ApiClient {
    /**
     * Instantiates the StorageApiClient using standardized apiPath.
     * @param {Object} [options={}]
     * @param {string} [options.baseURL] - The API base url.
     * @param {number} [options.timeout=10000] - Request timeout in ms.
     */
    constructor({ baseURL, timeout = 10000 } = {}) {
        super({ baseURL, timeout, apiPath: '/api/storage' });
        logger.info('StorageApiClient initialized');
    }

    /**
     * Creates a new storage location (requires authentication).
     * @async
     * @param {Object} payload - { name, description, buildingId }
     * @returns {Promise<Object>} API response with new storage object.
     * @throws {Error} On request failure, duplicate, or validation error.
     */
    async createStorage(payload) {
        logger.info('createStorage called', { name: payload?.name });
        try {
            const token = await getTokenFromElectron();
            if (!token) {
                logger.error('createStorage failed: No token available');
                throw new Error('No authentication token found');
            }
            const response = await this.post('', payload, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            logger.info('createStorage success', { storageId: response?.data?.storageId });
            return response;
        } catch (error) {
            logger.error('createStorage failed', error);
            throw error;
        }
    }

    /**
     * Retrieves all storage records, optionally filtered by buildingId. Requires authentication.
     * @async
     * @param {Object} [params={}] - e.g. { buildingId, page, size }
     * @returns {Promise<Object>} API response with array of storage objects.
     * @throws {Error} On network or server error.
     */
    async fetchAllStorage(params = {}) {
        logger.info('fetchAllStorage called', params);
        try {
            const token = await getTokenFromElectron();
            if (!token) {
                logger.error('fetchAllStorage failed: No token available');
                throw new Error('No authentication token found');
            }
            const response = await this.get('', params, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            logger.info(
                'fetchAllStorage success',
                { count: Array.isArray(response?.data?.data) ? response.data.data.length : 0 }
            );
            return response;
        } catch (error) {
            logger.error('fetchAllStorage failed', error);
            throw error;
        }
    }

    /**
     * Fetches a specific storage record by storageId (requires authentication).
     * @async
     * @param {number} storageId - The storage ID.
     * @returns {Promise<Object>} API response with storage object.
     * @throws {Error} If fetch fails or not found.
     */
    async fetchStorageById(storageId) {
        logger.info('fetchStorageById called', { storageId });
        try {
            const token = await getTokenFromElectron();
            if (!token) {
                logger.error('fetchStorageById failed: No token available');
                throw new Error('No authentication token found');
            }
            const response = await this.get(`/${storageId}`, {}, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            logger.info('fetchStorageById success', { storageId: response?.data?.storageId });
            return response;
        } catch (error) {
            logger.error('fetchStorageById failed', error);
            throw error;
        }
    }

    /**
     * Updates a storage record by storageId (requires authentication).
     * @async
     * @param {number} storageId - Storage ID to update.
     * @param {Object} payload - Fields to update: { name, description, buildingId }
     * @returns {Promise<Object>} API response with updated storage.
     * @throws {Error} If not found or request fails.
     */
    async updateStorage(storageId, payload) {
        logger.info('updateStorage called', { storageId });
        try {
            const token = await getTokenFromElectron();
            if (!token) {
                logger.error('updateStorage failed: No token available');
                throw new Error('No authentication token found');
            }
            const response = await this.put(`/${storageId}`, payload, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            logger.info('updateStorage success', { storageId: response?.data?.storageId });
            return response;
        } catch (error) {
            logger.error('updateStorage failed', error);
            throw error;
        }
    }

    /**
     * Deletes a storage record by storageId (requires authentication).
     * @async
     * @param {number} storageId - The storage ID to delete.
     * @returns {Promise<Object>} API success response or throws.
     * @throws {Error} If delete fails or storage not found.
     */
    async deleteStorage(storageId) {
        logger.info('deleteStorage called', { storageId });
        try {
            const token = await getTokenFromElectron();
            if (!token) {
                logger.error('deleteStorage failed: No token available');
                throw new Error('No authentication token found');
            }
            const response = await this.delete(`/${storageId}`, {}, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            logger.info('deleteStorage success', { storageId });
            return response;
        } catch (error) {
            logger.error('deleteStorage failed', error);
            throw error;
        }
    }
}