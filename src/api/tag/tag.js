import TagApiClient from "./tagApiClient";

/**
 * Singleton instance of TagApiClient.
 * Ensures all tag API requests are routed through a preconfigured client.
 *
 * @constant
 * @type {TagApiClient}
 */
const apiClient = new TagApiClient();

/**
 * Tag module logger (standardized).
 *
 * @constant
 * @type {{info: Function, error: Function}}
 */
const logger = {
    info: (...args) => console.log("[tag]", ...args),
    error: (...args) => console.error("[tag]", ...args),
};

/**
 * Creates a new tag (requires authentication).
 *
 * @async
 * @function createTag
 * @param {{categoryId: number, name: string, updatedBy?: number}} tag - Tag payload.
 * @returns {Promise<{tagId: number, categoryId: number, name: string, updatedBy: number, dateAdded: string, dateUpdated: string|null}>} Tag object from API response.
 * @throws {Error} If request fails: duplicate, invalid, or server error.
 */
export async function createTag(tag) {
    logger.info("createTag called", { name: tag?.name, categoryId: tag?.categoryId });
    try {
        const response = await apiClient.createTag(tag);
        // API wraps payload in { status, data, meta?, transactionId, errors }
        return response?.data || null;
    } catch (error) {
        logger.error("createTag failed", error);
        throw error;
    }
}

/**
 * Fetches all tags (supports filters, pagination, sorting, and optional categoryId filter).
 * Follows Storage API pattern by returning the unwrapped data array.
 *
 * @async
 * @function getAllTags
 * @param {Object} [params={}] - Optional params: { page, size, sortField, sortOrder, name, categoryId }.
 * @returns {Promise<Array<{tagId: number, categoryId: number, name: string, updatedBy: number, dateAdded: string, dateUpdated: string|null}>>} Tag objects.
 * @throws {Error} If request fails (network, 401, 500, etc).
 */
export async function getAllTags(params = {}) {
    logger.info("getAllTags called", params);
    try {
        const response = await apiClient.fetchAllTags(params);
        // Sabri API: { status, data: [...], meta, transactionId, errors }
        return response?.data || [];
    } catch (error) {
        logger.error("getAllTags failed", error);
        throw error;
    }
}

/**
 * Fetches a tag by tagId (requires authentication).
 *
 * @async
 * @function getTagById
 * @param {number} tagId - Unique tag identifier.
 * @returns {Promise<{tagId: number, categoryId: number, name: string, updatedBy: number, dateAdded: string, dateUpdated: string|null}>} Tag object or null if not found.
 * @throws {Error} If tag not found or request fails.
 */
export async function getTagById(tagId) {
    logger.info("getTagById called", { tagId });
    try {
        const response = await apiClient.fetchTagById(tagId);
        return response?.data || null;
    } catch (error) {
        logger.error("getTagById failed", error);
        throw error;
    }
}

/**
 * Updates an existing tag by tagId (requires authentication).
 *
 * @async
 * @function updateTag
 * @param {number} tagId - The tag id to update.
 * @param {{categoryId: number, name: string, updatedBy?: number}} tag - The inputfields to update.
 * @returns {Promise<{tagId: number, categoryId: number, name: string, updatedBy: number, dateAdded: string, dateUpdated: string|null}>} Updated tag from API.
 * @throws {Error} If not found, validation fails, or request fails.
 */
export async function updateTag(tagId, tag) {
    logger.info("updateTag called", { tagId });
    try {
        const response = await apiClient.updateTag(tagId, tag);
        return response?.data || null;
    } catch (error) {
        logger.error("updateTag failed", error);
        throw error;
    }
}

/**
 * Deletes a tag by tagId (requires authentication).
 *
 * @async
 * @function deleteTag
 * @param {number} tagId - The tagId to delete.
 * @returns {Promise<void>} Resolves on success or throws if failed.
 * @throws {Error} If tag is not found or request fails.
 */
export async function deleteTag(tagId) {
    logger.info("deleteTag called", { tagId });
    try {
        await apiClient.deleteTag(tagId);
    } catch (error) {
        logger.error("deleteTag failed", error);
        throw error;
    }
}