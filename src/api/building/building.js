import BuildingApiClient from "./buildingApiClient.js";

/**
 * Singleton instance of BuildingApiClient.
 * Ensures all building API requests are routed through a preconfigured client.
 *
 * @constant
 * @type {BuildingApiClient}
 */
const apiClient = new BuildingApiClient();

/**
 * Building module logger (standardized).
 *
 * @constant
 */
const logger = {
    info: (...args) => console.log('[building]', ...args),
    error: (...args) => console.error('[building]', ...args),
};

/**
 * Creates a new building (requires authentication).
 *
 * @async
 * @function createBuilding
 * @param {{name: string, address: string, manager: string}} building - Building payload
 * @returns {Promise<{buildingId: number, name: string, address: string, manager: string}>} Building object
 * @throws {Error} If request fails: duplicate, invalid, or server error
 */
export async function createBuilding(building) {
    logger.info('createBuilding called', { name: building?.name });
    try {
        const response = await apiClient.createBuilding(building);
        return response?.data || null;
    } catch (error) {
        logger.error('createBuilding failed', error);
        throw error;
    }
}

/**
 * Fetches all buildings (supports filters, pagination, and sorting).
 *
 * @async
 * @function getAllBuildings
 * @param {Object} [params={}] - Optional params: { page, size, sortField, sortOrder, name }
 * @returns {Promise<Array<{buildingId: number, name: string, address: string, manager: string}>>} Building objects
 * @throws {Error} If request fails (network, 401, 500, etc).
 */
export async function getAllBuildings(params = {}) {
    logger.info('getAllBuildings called', params);
    try {
        const response = await apiClient.fetchAllBuildings(params);
        return response?.data || [];
    } catch (error) {
        logger.error('getAllBuildings failed', error);
        throw error;
    }
}

/**
 * Fetches a building by buildingId (requires authentication).
 *
 * @async
 * @function getBuildingById
 * @param {number} buildingId
 * @returns {Promise<{buildingId: number, name: string, address: string, manager: string}>} Building object
 * @throws {Error} If building not found or request fails.
 */
export async function getBuildingById(buildingId) {
    logger.info('getBuildingById called', { buildingId });
    try {
        const response = await apiClient.fetchBuildingById(buildingId);
        return response?.data || null;
    } catch (error) {
        logger.error('getBuildingById failed', error);
        throw error;
    }
}

/**
 * Updates an existing building by buildingId (requires authentication).
 *
 * @async
 * @function updateBuilding
 * @param {number} buildingId - The building id to update
 * @param {{name: string, address: string, manager: string}} building - The inputfields to update
 * @returns {Promise<{buildingId: number, name: string, address: string, manager: string}>} Updated building
 * @throws {Error} If not found, validation fails, or request fails.
 */
export async function updateBuilding(buildingId, building) {
    logger.info('updateBuilding called', { buildingId });
    try {
        const response = await apiClient.updateBuilding(buildingId, building);
        return response?.data || null;
    } catch (error) {
        logger.error('updateBuilding failed', error);
        throw error;
    }
}

/**
 * Deletes a building by buildingId (requires authentication).
 *
 * @async
 * @function deleteBuilding
 * @param {number} buildingId - The buildingId to delete
 * @returns {Promise<void>} Resolves on success or throws if failed
 * @throws {Error} If build is not found or request fails.
 */
export async function deleteBuilding(buildingId) {
    logger.info('deleteBuilding called', { buildingId });
    try {
        await apiClient.deleteBuilding(buildingId);
    } catch (error) {
        logger.error('deleteBuilding failed', error);
        throw error;
    }
}

/**
 * Fetches all buildings with their storage (authenticated aggregate endpoint).
 *
 * @async
 * @function getBuildingsWithStorage
 * @param {Object} [params={}] - Optional: pagination/sort/filter params
 * @returns {Promise<Array>} Buildings with storage array ({buildingId, name, address, manager, storage: [...]})
 * @throws {Error} If request fails.
 */
export async function getBuildingsWithStorage(params = {}) {
    logger.info('getBuildingsWithStorage called', params);
    try {
        const response = await apiClient.fetchBuildingsWithStorage(params);
        return response?.data || [];
    } catch (error) {
        logger.error('getBuildingsWithStorage failed', error);
        throw error;
    }
}