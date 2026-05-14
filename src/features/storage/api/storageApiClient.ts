import ApiClient from "../../../api/ApiClient";
import { Storage, StorageResponse, StorageListResponse } from "./storage.types";

/**
 * logger for StorageApiClient - robust, standardized, no sensitive data.
 * @constant
 * @type {{info: Function, error: Function}}
 */
const logger: { info: (...args: any[]) => void; error: (...args: any[]) => void } = {
    info: (...args: any[]) => console.log('[StorageApiClient]', ...args),
    error: (...args: any[]) => console.error('[StorageApiClient]', ...args),
};

/**
 * Retrieves the session token from Electron main process via preload bridge.
 * @async
 * @function getTokenFromElectron
 * @returns {Promise<string|null>} The authentication token, or null if unavailable.
 */
const getTokenFromElectron = async (): Promise<string | null> => {
    logger.info('getTokenFromElectron called');
    if (window.electronAPI && window.electronAPI.tokenGet) {
        try {
            const { success, token } = await window.electronAPI.tokenGet();
            logger.info('getTokenFromElectron response', { success });
            return success ? token ?? null : null;
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
    constructor({ baseURL, timeout = 10000 }: { baseURL?: string; timeout?: number } = {}) {
        super({ baseURL, timeout, apiPath: '/api/storage' });
        logger.info('StorageApiClient initialized');
    }

    /**
     * Creates a new storage location (requires authentication).
     * @async
     * @param {Storage} payload - { name, description, buildingId }
     * @returns {Promise<StorageResponse>} API response with new storage object.
     * @throws {Error} On request failure, duplicate, or validation error.
     */
    async createStorage(payload: Storage): Promise<StorageResponse> {
        logger.info('createStorage called - full payload', payload);
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
            logger.info('createStorage response', response);
            return response as StorageResponse;
        } catch (error) {
            logger.error('createStorage failed', error);
            throw error;
        }
    }

    /**
     * Retrieves all storage records, optionally filtered by buildingId. Requires authentication.
     * @async
     * @param {Partial<Storage> & { page?: number; size?: number }} [params={}] - e.g. { buildingId, page, size }
     * @returns {Promise<StorageListResponse>} API response with array of storage objects.
     * @throws {Error} On network or server error.
     */
    async fetchAllStorage(params: Partial<Storage> & { page?: number; size?: number } = {}): Promise<StorageListResponse> {
        logger.info('fetchAllStorage called - full payload', params);
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
            logger.info('fetchAllStorage response', response);
            return response as StorageListResponse;
        } catch (error) {
            logger.error('fetchAllStorage failed', error);
            throw error;
        }
    }

    /**
     * Fetches a specific storage record by storageId (requires authentication).
     * @async
     * @param {number} storageId - The storage ID.
     * @returns {Promise<StorageResponse>} API response with storage object.
     * @throws {Error} If fetch fails or not found.
     */
    async fetchStorageById(storageId: number): Promise<StorageResponse> {
        logger.info('fetchStorageById called - full payload', { storageId });
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
            logger.info('fetchStorageById response', response);
            return response as StorageResponse;
        } catch (error) {
            logger.error('fetchStorageById failed', error);
            throw error;
        }
    }

    /**
     * Updates a storage record by storageId (requires authentication).
     * @async
     * @param {number} storageId - Storage ID to update.
     * @param {Storage} payload - Fields to update: { name, description, buildingId }
     * @returns {Promise<StorageResponse>} API response with updated storage.
     * @throws {Error} If not found or request fails.
     */
    async updateStorage(storageId: number, payload: Storage): Promise<StorageResponse> {
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
            return response as StorageResponse;
        } catch (error) {
            logger.error('updateStorage failed', error);
            throw error;
        }
    }

    /**
     * Deletes a storage record by storageId (requires authentication).
     * @async
     * @param {number} storageId - The storage ID to delete.
     * @returns {Promise<StorageResponse>} API success response or throws.
     * @throws {Error} If delete fails or storage not found.
     */
    async deleteStorage(storageId: number): Promise<StorageResponse> {
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
            return response as StorageResponse;
        } catch (error) {
            logger.error('deleteStorage failed', error);
            throw error;
        }
    }
}