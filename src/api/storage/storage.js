import StorageApiClient from "./storageApiClient";

/**
 * Singleton instance of StorageApiClient.
 * Ensures all storage API requests are routed through a preconfigured client.
 *
 * @constant
 * @type {StorageApiClient}
 */
const apiClient = new StorageApiClient();

/**
 * Storage module logger (standardized).
 *
 * @constant
 */
const logger = {
    info: (...args) => console.log('[storage]', ...args),
    error: (...args) => console.error('[storage]', ...args),
};

/**
 * Creates a new storage location (requires authentication).
 *
 * @async
 * @function createStorage
 * @param {{name: string, description: string, buildingId: number}} storage - Storage payload.
 * @returns {Promise<{storageId: number, name: string, description: string, buildingId: number}>} Storage object.
 * @throws {Error} If request fails: duplicate, invalid, or server error.
 */
export async function createStorage(storage) {
    logger.info('createStorage called', { name: storage?.name });
    try {
        const response = await apiClient.createStorage(storage);
        return response?.data || null;
    } catch (error) {
        logger.error('createStorage failed', error);
        throw error;
    }
}

/**
 * Fetches all storage locations (optionally filtered by buildingId, supports pagination).
 *
 * @async
 * @function getAllStorage
 * @param {Object} [params={}] - Optional params: { buildingId, page, size }
 * @returns {Promise<Array<{storageId: number, name: string, description: string, buildingId: number}>>} Storage objects.
 * @throws {Error} If request fails (network, 401, 500, etc).
 */
export async function getAllStorage(params = {}) {
    logger.info('getAllStorage called', params);
    try {
        const response = await apiClient.fetchAllStorage(params);
        return response?.data || [];
    } catch (error) {
        logger.error('getAllStorage failed', error);
        throw error;
    }
}

/**
 * Fetches a storage location by storageId (requires authentication).
 *
 * @async
 * @function getStorageById
 * @param {number} storageId
 * @returns {Promise<{storageId: number, name: string, description: string, buildingId: number}>} Storage object.
 * @throws {Error} If storage is not found or request fails.
 */
export async function getStorageById(storageId) {
    logger.info('getStorageById called', { storageId });
    try {
        const response = await apiClient.fetchStorageById(storageId);
        return response?.data || null;
    } catch (error) {
        logger.error('getStorageById failed', error);
        throw error;
    }
}

/**
 * Updates an existing storage location by storageId (requires authentication).
 *
 * @async
 * @function updateStorage
 * @param {number} storageId - The storage id to update.
 * @param {{name: string, description: string, buildingId: number}} storage - The fields to update.
 * @returns {Promise<{storageId: number, name: string, description: string, buildingId: number}>} Updated storage.
 * @throws {Error} If not found, validation fails, or request fails.
 */
export async function updateStorage(storageId, storage) {
    logger.info('updateStorage called', { storageId });
    try {
        const response = await apiClient.updateStorage(storageId, storage);
        return response?.data || null;
    } catch (error) {
        logger.error('updateStorage failed', error);
        throw error;
    }
}

/**
 * Deletes a storage location by storageId (requires authentication).
 *
 * @async
 * @function deleteStorage
 * @param {number} storageId - The storageId to delete.
 * @returns {Promise<void>} Resolves on success or throws if failed.
 * @throws {Error} If storage is not found or request fails.
 */
export async function deleteStorage(storageId) {
    logger.info('deleteStorage called', { storageId });
    try {
        await apiClient.deleteStorage(storageId);
    } catch (error) {
        logger.error('deleteStorage failed', error);
        throw error;
    }
}