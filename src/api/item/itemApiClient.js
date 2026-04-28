import ApiClient from "../ApiClient.ts";

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
 * getTokenFromElectron
 * - Retrieves the session token from Electron via the preload bridge.
 *
 * @async
 * @function getTokenFromElectron
 * @returns {Promise<string|null>} The authentication token or null if unavailable.
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
 * - Handles all API calls for item CRUD and search.
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
     * - POST /api/items
     *
     * @async
     * @param {Object} payload - ItemRequest payload.
     * @returns {Promise<Object>} Normalized API response.
     * @throws {Error} If creation fails.
     */
    async createItem(payload) {
        logger.info("createItem called", { name: payload?.name });
        try {
            const token = await getTokenFromElectron();
            if (!token) throw new Error("No authentication token found");
            const raw = await this.post("", payload, {
                headers: { Authorization: `Bearer ${token}` },
            });
            logger.info("createItem success", { itemId: raw?.data?.itemId });
            return raw;
        } catch (error) {
            logger.error("createItem failed", error);
            throw error;
        }
    }

    /**
     * fetchAllItems
     * - GET /api/items
     *
     * @async
     * @param {Object} [params={}] - Query params e.g. { page, size, filters }
     * @returns {Promise<Object>} Normalized list response.
     * @throws {Error} If the request fails.
     */
    async fetchAllItems(params = {}) {
        logger.info("fetchAllItems called", params);
        try {
            const token = await getTokenFromElectron();
            if (!token) throw new Error("No authentication token found");
            const raw = await this.get("", params, {
                headers: { Authorization: `Bearer ${token}` },
            });

            // Compose "meta" in the same format as jobs
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
            logger.info("fetchAllItems success", { count: itemsArray.length, meta });
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
     * - GET /api/items/{itemId}
     */
    async fetchItemById(itemId) {
        logger.info("fetchItemById called", { itemId });
        try {
            const token = await getTokenFromElectron();
            if (!token) throw new Error("No authentication token found");
            const raw = await this.get(`${itemId}`, {}, {
                headers: { Authorization: `Bearer ${token}` },
            });
            logger.info("fetchItemById success", { itemId: raw?.data?.itemId ?? itemId });
            return raw;
        } catch (error) {
            logger.error("fetchItemById failed", error);
            throw error;
        }
    }

    /**
     * fetchItemDetails
     * - GET /api/items/{itemId}/details
     * - Uses an extended timeout (60 seconds) because the details
     *   aggregation endpoint is more expensive than other item calls.
     *
     * @async
     * @param {number|string} itemId
     * @returns {Promise<Object>} Raw API response { status, data, ... }.
     * @throws {Error} If the request fails or times out.
     */
    async fetchItemDetails(itemId) {
        logger.info("fetchItemDetails called", { itemId });
        try {
            const token = await getTokenFromElectron();
            if (!token) throw new Error("No authentication token found");

            // Override default 10s timeout with 60s specifically for /details
            const raw = await this.get(
                `${itemId}/details`,
                {},
                {
                    headers: { Authorization: `Bearer ${token}` },
                    timeout: 60_000, // 60 seconds
                },
            );

            logger.info("fetchItemDetails success", {
                itemId: raw?.data?.itemId ?? itemId,
            });
            return raw;
        } catch (error) {
            logger.error("fetchItemDetails failed", {
                message: error?.message,
                status: error?.status ?? null,
                data: error?.data ?? null,
                originalError: error,
            });
            throw error;
        }
    }

    /**
     * updateItem
     * - PUT /api/items/{itemId}
     */
    async updateItem(itemId, payload) {
        logger.info("updateItem called", { itemId });
        try {
            const token = await getTokenFromElectron();
            if (!token) throw new Error("No authentication token found");
            const raw = await this.put(`${itemId}`, payload, {
                headers: { Authorization: `Bearer ${token}` },
            });
            logger.info("updateItem success", { itemId: raw?.data?.itemId ?? itemId });
            return raw;
        } catch (error) {
            logger.error("updateItem failed", error);
            throw error;
        }
    }

    /**
     * deleteItem
     * - DELETE /api/items/{itemId}
     */
    async deleteItem(itemId) {
        logger.info("deleteItem called", { itemId });
        try {
            const token = await getTokenFromElectron();
            if (!token) throw new Error("No authentication token found");
            const raw = await this.delete(`${itemId}`, {}, {
                headers: { Authorization: `Bearer ${token}` },
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
     * - DELETE /api/items/batch
     * @param {Array<number>} itemIds
     */
    async deleteItemsBatch(itemIds) {
        logger.info("deleteItemsBatch called", { count: Array.isArray(itemIds) ? itemIds.length : 0 });
        try {
            const token = await getTokenFromElectron();
            if (!token) throw new Error("No authentication token found");
            const raw = await this.delete("batch", itemIds, {
                headers: { Authorization: `Bearer ${token}` },
            });
            logger.info("deleteItemsBatch success", { count: Array.isArray(itemIds) ? itemIds.length : 0 });
            return raw;
        } catch (error) {
            logger.error("deleteItemsBatch failed", error);
            throw error;
        }
    }

    /**
     * searchItems
     * - POST /api/items/search (Meilisearch-powered)
     * @param {Object} payload - { query, filters, page, size, sort }
     * @returns {Promise<Object>} Search results, shape: { hits, totalHits, ... }
     */
    async searchItems(payload) {
        logger.info("searchItems called", payload);
        try {
            const token = await getTokenFromElectron();
            if (!token) throw new Error("No authentication token found");
            const raw = await this.post("search", payload, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const searchData = raw?.data ?? null;
            logger.info("searchItems success", {
                hitsCount: searchData?.hitsCount ?? 0,
                totalHits: searchData?.totalHits ?? 0,
            });
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