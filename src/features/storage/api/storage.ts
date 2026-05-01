import StorageApiClient from "./storageApiClient";
import { Storage, StorageResponse, StorageListResponse } from "./storage.types";

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
const logger: { info: (...args: any[]) => void; error: (...args: any[]) => void } = {
    info: (...args: any[]) => console.log('[storage]', ...args),
    error: (...args: any[]) => console.error('[storage]', ...args),
};

/**
 * Creates a new storage location (requires authentication).
 *
 * @async
 * @function createStorage
 * @param {Storage} storage - Storage payload.
 * @returns {Promise<Storage | null>} Storage object.
 * @throws {Error} If request fails: duplicate, invalid, or server error.
 */
export async function createStorage(storage: Storage): Promise<Storage | null> {
    logger.info('createStorage called', { name: storage?.name });
    try {
        const response: StorageResponse = await apiClient.createStorage(storage);
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
 * @param {Partial<Storage> & { page?: number; size?: number }} [params={}] - Optional params: { buildingId, page, size }
 * @returns {Promise<Storage[]>} Storage objects.
 * @throws {Error} If request fails (network, 401, 500, etc).
 */
export async function getAllStorage(params: Partial<Storage> & { page?: number; size?: number } = {}): Promise<Storage[]> {
    logger.info('getAllStorage called', params);
    try {
        const response: StorageListResponse = await apiClient.fetchAllStorage(params);
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
 * @returns {Promise<Storage | null>} Storage object.
 * @throws {Error} If storage is not found or request fails.
 */
export async function getStorageById(storageId: number): Promise<Storage | null> {
    logger.info('getStorageById called', { storageId });
    try {
        const response: StorageResponse = await apiClient.fetchStorageById(storageId);
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
 * @param {Storage} storage - The inputfields to update.
 * @returns {Promise<Storage | null>} Updated storage.
 * @throws {Error} If not found, validation fails, or request fails.
 */
export async function updateStorage(storageId: number, storage: Storage): Promise<Storage | null> {
    logger.info('updateStorage called', { storageId });
    try {
        const response: StorageResponse = await apiClient.updateStorage(storageId, storage);
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
export async function deleteStorage(storageId: number): Promise<void> {
    logger.info('deleteStorage called', { storageId });
    try {
        await apiClient.deleteStorage(storageId);
    } catch (error) {
        logger.error('deleteStorage failed', error);
        throw error;
    }
}