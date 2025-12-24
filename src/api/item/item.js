import ItemApiClient from "./itemApiClient";

/**
 * Singleton instance of ItemApiClient.
 *
 * @constant
 * @type {ItemApiClient}
 */
const apiClient = new ItemApiClient();

/**
 * logger for item module.
 *
 * @constant
 * @type {{info: Function, error: Function}}
 */
const logger = {
    info: (...args) => console.log("[item]", ...args),
    error: (...args) => console.error("[item]", ...args),
};

/**
 * createItem
 * - Creates a new Item (POST /api/items).
 *
 * @async
 * @function createItem
 * @param {Object} item - ItemRequest payload.
 * @returns {Promise<Object|null>} ItemResponse object or null.
 * @throws {Error} If the request fails or server returns an error.
 */
export async function createItem(item) {
    logger.info("createItem called", { name: item?.name });
    try {
        const response = await apiClient.createItem(item);
        return response?.data || null;
    } catch (error) {
        logger.error("createItem failed", error);
        throw error;
    }
}

/**
 * getAllItems
 * - Fetches items with optional filters, pagination, and sorting.
 *
 * Mirrors "Get Items" endpoint:
 *   GET /api/items?page=1&size=25&sortField=name&sortOrder=asc&archived=false
 *
 * @async
 * @function getAllItems
 * @param {Object} [params={}] - Optional query params.
 * @returns {Promise<{
 *   status?: string,
 *   data: Array<Object>,
 *   meta?: {
 *     page: number|null,
 *     size: number|null,
 *     totalRecords: number|null,
 *     totalPages: number|null,
 *     filterCriteria?: Record<string, any>|null,
 *     sortField?: string|null,
 *     sortOrder?: string|null,
 *     totalRelatedCount?: number|null
 *   },
 *   transactionId?: string,
 *   errors?: Array<any>|null
 * }>}
 * @throws {Error} If the request fails (network, 401, 500, etc).
 */
export async function getAllItems(params = {}) {
    logger.info("getAllItems called", params);
    try {
        const response = await apiClient.fetchAllItems(params);
        logger.info("getAllItems normalized response", {
            dataCount: Array.isArray(response?.data) ? response.data.length : 0,
            meta: response?.meta,
        });
        return response;
    } catch (error) {
        logger.error("getAllItems failed", error);
        throw error;
    }
}

/**
 * getItemById
 * - Fetches a single item by id (GET /api/items/{itemId}).
 *
 * @async
 * @function getItemById
 * @param {number} itemId - Item identifier.
 * @returns {Promise<Object|null>} ItemResponse object or null.
 * @throws {Error} If item not found or request fails.
 */
export async function getItemById(itemId) {
    logger.info("getItemById called", { itemId });
    try {
        const response = await apiClient.fetchItemById(itemId);
        return response?.data || null;
    } catch (error) {
        logger.error("getItemById failed", error);
        throw error;
    }
}

/**
 * getItemDetails
 * - Fetches expanded details for an item (GET /api/items/{itemId}/details).
 *
 * @async
 * @function getItemDetails
 * @param {number} itemId - Item identifier.
 * @returns {Promise<Object|null>} ItemDetailsResponse object or null.
 * @throws {Error} If item not found or request fails.
 */
export async function getItemDetails(itemId) {
    logger.info("getItemDetails called", { itemId });
    try {
        const response = await apiClient.fetchItemDetails(itemId);
        return response?.data || null;
    } catch (error) {
        logger.error("getItemDetails failed", error);
        throw error;
    }
}

/**
 * updateItem
 * - Updates an existing item (PUT /api/items/{itemId}).
 *
 * @async
 * @function updateItem
 * @param {number} itemId - Item identifier.
 * @param {Object} item - ItemRequest payload.
 * @returns {Promise<Object|null>} Updated ItemResponse or null.
 * @throws {Error} If not found, validation fails, or request fails.
 */
export async function updateItem(itemId, item) {
    logger.info("updateItem called", { itemId });
    try {
        const response = await apiClient.updateItem(itemId, item);
        return response?.data || null;
    } catch (error) {
        logger.error("updateItem failed", error);
        throw error;
    }
}

/**
 * deleteItem
 * - Deletes an item by id (DELETE /api/items/{itemId}).
 *   Behavior (soft vs hard delete) is controlled server-side.
 *
 * @async
 * @function deleteItem
 * @param {number} itemId - Item identifier.
 * @returns {Promise<void>} Resolves on success or throws if failed.
 * @throws {Error} If item not found or request fails.
 */
export async function deleteItem(itemId) {
    logger.info("deleteItem called", { itemId });
    try {
        await apiClient.deleteItem(itemId);
    } catch (error) {
        logger.error("deleteItem failed", error);
        throw error;
    }
}

/**
 * deleteItemsBatch
 * - Deletes multiple items in a single call (DELETE /api/items/batch).
 *
 * @async
 * @function deleteItemsBatch
 * @param {Array<number>} itemIds - Array of item identifiers.
 * @returns {Promise<void>} Resolves on success or throws if failed.
 * @throws {Error} If request fails.
 */
export async function deleteItemsBatch(itemIds) {
    logger.info("deleteItemsBatch called", {
        count: Array.isArray(itemIds) ? itemIds.length : 0,
    });
    try {
        await apiClient.deleteItemsBatch(itemIds);
    } catch (error) {
        logger.error("deleteItemsBatch failed", error);
        throw error;
    }
}

/**
 * searchItems
 * - Performs Meilisearch-backed item search (POST /api/items/search).
 *
 * @async
 * @function searchItems
 * @param {{
 *   query?: string,
 *   filters?: string,
 *   page?: number,
 *   size?: number,
 *   sort?: string,
 *   includeArchived?: boolean
 * }} params - Search payload.
 * @returns {Promise<{
 *   status?: string,
 *   data: {
 *     hits: Array,
 *     hitsCount: number,
 *     totalHits: number,
 *     page: number,
 *     size: number,
 *     sort?: string|null
 *   }|null,
 *   meta?: any,
 *   transactionId?: string,
 *   errors?: Array<any>|null
 * }>}
 * @throws {Error} If the request fails or search is invalid.
 */
export async function searchItems(params) {
    logger.info("searchItems called", params);
    try {
        const response = await apiClient.searchItems(params);
        return response;
    } catch (error) {
        logger.error("searchItems failed", error);
        throw error;
    }
}