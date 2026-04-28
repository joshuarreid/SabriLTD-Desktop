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
 * - Creates a new inventory item (POST /api/item).
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
 * - Fetches item with optional filters, pagination, and sorting.
 *
 * @async
 * @function getAllItems
 * @param {Object} [params={}] - Optional query params.
 * @returns {Promise<Object>} Normalized list response.
 * @throws {Error} If the request fails.
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
 * - Fetches single item by id.
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
 * - Fetches full details for given item id.
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
 * - Updates an existing item by id.
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
 * - Deletes an item by id.
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
 * - Deletes multiple item with batch endpoint.
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
 * - Full text and advanced filter/search for item (POST /api/item/search).
 * - Payload: { query, filters, page, size, sort, includeArchived }
 * - Returns: { hits, hitsCount, totalHits, page, size, sort }
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
