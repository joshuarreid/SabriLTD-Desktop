import ApiClient from "../ApiClient";

/**
 * logger for ItemApiClient.
 *
 * @constant
 * @type {{info: Function, error: Function}}
 */
const logger = {
    info: (...args) => console.log("[ItemApiClient]", ...args),
    error: (...args) => console.error("[ItemApiClient]", ...args),
};

/**
 * Retrieves the session token from Electron main process via preload bridge.
 *
 * @async
 * @function getTokenFromElectron
 * @returns {Promise<string|null>} The authentication token, or null if unavailable.
 */
const getTokenFromElectron = async () => {
    logger.info("getTokenFromElectron called");
    if (window.electronAPI && window.electronAPI.tokenGet) {
        try {
            const { success, token } = await window.electronAPI.tokenGet();
            logger.info("getTokenFromElectron response", { success });
            return success ? token : null;
        } catch (error) {
            logger.error("getTokenFromElectron error", error);
            return null;
        }
    }
    logger.error("Electron ipc not available; token-get skipped");
    return null;
};

/**
 * ItemApiClient
 * - Concrete ApiClient for /api/items endpoints.
 * - Normalizes wrapped responses into { status, data, meta, transactionId, errors }.
 *
 * @class
 * @extends ApiClient
 */
export default class ItemApiClient extends ApiClient {
    /**
     * Creates an instance of ItemApiClient.
     *
     * @param {Object} [options={}] - Optional overrides.
     * @param {string} [options.baseURL] - Optional base URL override.
     * @param {number} [options.timeout=10000] - Request timeout in ms.
     */
    constructor({ baseURL, timeout = 10000 } = {}) {
        super({ baseURL, timeout, apiPath: "/api/items" });
        logger.info("ItemApiClient initialized");
    }

    /**
     * createItem
     * - Calls POST /api/items to create a new item.
     *
     * @async
     * @function createItem
     * @param {Object} payload - ItemRequest payload.
     * @returns {Promise<Object>} Raw normalized API response.
     * @throws {Error} If validation fails, duplicate, or server error.
     */
    async createItem(payload) {
        logger.info("createItem called", { name: payload?.name });
        try {
            const token = await getTokenFromElectron();
            if (!token) {
                logger.error("createItem failed: No token available");
                throw new Error("No authentication token found");
            }

            const raw = await this.post("", payload, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            logger.info("createItem success", {
                itemId: raw?.data?.itemId ?? raw?.data?.id ?? null,
            });

            return raw;
        } catch (error) {
            logger.error("createItem failed", error);
            throw error;
        }
    }

    /**
     * fetchAllItems
     * - Calls GET /api/items with optional filters/pagination/sorting.
     *
     * Backend returns a wrapped response at the top level:
     * {
     *   status: "OK",
     *   page: 1,
     *   size: 25,
     *   totalRecords: 33,
     *   totalPages: 2,
     *   filterCriteria: {...},
     *   sortField: "...",
     *   sortOrder: "...",
     *   data: [ ...ItemResponse ],
     *   transactionId: "...",
     *   errors: [...]
     * }
     *
     * @async
     * @function fetchAllItems
     * @param {Object} [params={}] - Query params: { page, size, sortField, sortOrder, ...filters }.
     * @returns {Promise<{
     *   status?: string,
     *   data: Array,
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
     * @throws {Error} If the request fails.
     */
    async fetchAllItems(params = {}) {
        logger.info("fetchAllItems called", params);
        try {
            const token = await getTokenFromElectron();
            if (!token) {
                logger.error("fetchAllItems failed: No token available");
                throw new Error("No authentication token found");
            }

            // Use '' (empty string) to avoid trailing-slash issues.
            const raw = await this.get("", params, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const meta = {
                page: raw?.page ?? null,
                size: raw?.size ?? null,
                totalRecords: raw?.totalRecords ?? null,
                totalPages: raw?.totalPages ?? null,
                filterCriteria: raw?.filterCriteria ?? null,
                sortField: raw?.sortField ?? null,
                sortOrder: raw?.sortOrder ?? null,
                totalRelatedCount: raw?.totalRelatedCount ?? null,
            };

            const itemsArray = Array.isArray(raw?.data) ? raw.data : [];

            logger.info("fetchAllItems success", {
                count: itemsArray.length,
                meta,
            });

            return {
                status: raw?.status,
                data: itemsArray,
                meta,
                transactionId: raw?.transactionId,
                errors: raw?.errors ?? null,
            };
        } catch (error) {
            logger.error("fetchAllItems failed", error);
            throw error;
        }
    }

    /**
     * fetchItemById
     * - Calls GET /api/items/{itemId}.
     *
     * @async
     * @function fetchItemById
     * @param {number} itemId - Item identifier.
     * @returns {Promise<Object>} Raw response with ItemResponse in `data`.
     * @throws {Error} If not found or request fails.
     */
    async fetchItemById(itemId) {
        logger.info("fetchItemById called", { itemId });
        try {
            const token = await getTokenFromElectron();
            if (!token) {
                logger.error("fetchItemById failed: No token available");
                throw new Error("No authentication token found");
            }
            const raw = await this.get(`${itemId}`, {}, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            logger.info("fetchItemById success", {
                itemId: raw?.data?.itemId ?? itemId,
            });
            return raw;
        } catch (error) {
            logger.error("fetchItemById failed", error);
            throw error;
        }
    }

    /**
     * fetchItemDetails
     * - Calls GET /api/items/{itemId}/details for expanded details.
     *
     * @async
     * @function fetchItemDetails
     * @param {number} itemId - Item identifier.
     * @returns {Promise<Object>} Raw response with ItemDetailsResponse in `data`.
     * @throws {Error} If not found or request fails.
     */
    async fetchItemDetails(itemId) {
        logger.info("fetchItemDetails called", { itemId });
        try {
            const token = await getTokenFromElectron();
            if (!token) {
                logger.error("fetchItemDetails failed: No token available");
                throw new Error("No authentication token found");
            }
            const raw = await this.get(`${itemId}/details`, {}, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            logger.info("fetchItemDetails success", {
                itemId: raw?.data?.itemId ?? itemId,
            });
            return raw;
        } catch (error) {
            logger.error("fetchItemDetails failed", error);
            throw error;
        }
    }

    /**
     * updateItem
     * - Calls PUT /api/items/{itemId} to update an existing item.
     *
     * @async
     * @function updateItem
     * @param {number} itemId - Item identifier.
     * @param {Object} payload - ItemRequest payload.
     * @returns {Promise<Object>} Raw response with ItemResponse in `data`.
     * @throws {Error} If not found, validation fails, or request fails.
     */
    async updateItem(itemId, payload) {
        logger.info("updateItem called", { itemId });
        try {
            const token = await getTokenFromElectron();
            if (!token) {
                logger.error("updateItem failed: No token available");
                throw new Error("No authentication token found");
            }
            const raw = await this.put(`${itemId}`, payload, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            logger.info("updateItem success", {
                itemId: raw?.data?.itemId ?? itemId,
            });
            return raw;
        } catch (error) {
            logger.error("updateItem failed", error);
            throw error;
        }
    }

    /**
     * deleteItem
     * - Calls DELETE /api/items/{itemId}`.
     *
     * @async
     * @function deleteItem
     * @param {number} itemId - Item identifier to delete.
     * @returns {Promise<Object>} Raw API response.
     * @throws {Error} If item not found or request fails.
     */
    async deleteItem(itemId) {
        logger.info("deleteItem called", { itemId });
        try {
            const token = await getTokenFromElectron();
            if (!token) {
                logger.error("deleteItem failed: No token available");
                throw new Error("No authentication token found");
            }
            const raw = await this.delete(`${itemId}`, {}, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            logger.info("deleteItem success", { itemId });
            return raw;
        } catch (error) {
            logger.error("deleteItem failed", error);
            throw error;
        }
    }

    /**
     * deleteItemsBatch
     * - Calls DELETE /api/items/batch with an array of itemIds.
     *
     * @async
     * @function deleteItemsBatch
     * @param {Array<number>} itemIds - Array of item identifiers to delete.
     * @returns {Promise<Object>} Raw API response.
     * @throws {Error} If request fails.
     */
    async deleteItemsBatch(itemIds) {
        logger.info("deleteItemsBatch called", {
            count: Array.isArray(itemIds) ? itemIds.length : 0,
        });
        try {
            const token = await getTokenFromElectron();
            if (!token) {
                logger.error("deleteItemsBatch failed: No token available");
                throw new Error("No authentication token found");
            }
            const raw = await this.delete("batch", itemIds, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            logger.info("deleteItemsBatch success", {
                count: Array.isArray(itemIds) ? itemIds.length : 0,
            });
            return raw;
        } catch (error) {
            logger.error("deleteItemsBatch failed", error);
            throw error;
        }
    }

    /**
     * searchItems
     * - Calls POST /api/items/search for Meilisearch-backed item search.
     *
     * Backend contracts:
     *   Request: { query, filters, page, size, sort, ... }
     *   Response wrapper:
     *   {
     *     status: "OK",
     *     data: { hits, hitsCount, totalHits, page, size, sort },
     *     transactionId,
     *     errors
     *   }
     *
     * @async
     * @function searchItems
     * @param {Object} payload - ItemSearchRequest payload.
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
     * @throws {Error} If token missing or request fails.
     */
    async searchItems(payload) {
        logger.info("searchItems called", payload);
        try {
            const token = await getTokenFromElectron();
            if (!token) {
                logger.error("searchItems failed: No token available");
                throw new Error("No authentication token found");
            }

            const raw = await this.post("search", payload, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const searchData = raw?.data ?? null;

            logger.info("searchItems success", {
                hitsCount: searchData?.hitsCount ?? 0,
                totalHits: searchData?.totalHits ?? 0,
            });

            // For search we keep the structure under data, meta is not used.
            return {
                status: raw?.status,
                data: searchData,
                meta: null,
                transactionId: raw?.transactionId,
                errors: raw?.errors ?? null,
            };
        } catch (error) {
            logger.error("searchItems failed", error);
            throw error;
        }
    }
}