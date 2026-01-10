import CategoryApiClient from "./categoryApiClient";

/**
 * Singleton instance of CategoryApiClient.
 * Ensures all category API requests are routed through a preconfigured client.
 *
 * @constant
 * @type {CategoryApiClient}
 */
const apiClient = new CategoryApiClient();

/**
 * Category module logger (standardized).
 *
 * @constant
 */
const logger = {
    info: (...args) => console.log('[category]', ...args),
    error: (...args) => console.error('[category]', ...args),
};

/**
 * Creates a new tag category (requires authentication).
 *
 * @async
 * @function createCategory
 * @param {{name: string}} category - Category payload
 * @returns {Promise<{categoryId: number, name: string, dateAdded: string, dateUpdated: string | null}>} Category object
 * @throws {Error} If request fails: duplicate, invalid, or server error
 */
export async function createCategory(category) {
    logger.info('createCategory called', { name: category?.name });
    try {
        const response = await apiClient.createCategory(category);
        return response?.data || null;
    } catch (error) {
        logger.error('createCategory failed', error);
        throw error;
    }
}

/**
 * Fetches all tag categories (supports filters, pagination, and sorting).
 *
 * @async
 * @function getAllCategories
 * @param {Object} [params={}] - Optional params: { page, size, sortField, sortOrder, name }
 * @returns {Promise<Array<{categoryId: number, name: string, dateAdded: string, dateUpdated: string|null}>>} Category objects
 * @throws {Error} If request fails (network, 401, 500, etc).
 */
export async function getAllCategories(params = {}) {
    logger.info('getAllCategories called', params);
    try {
        const response = await apiClient.fetchAllCategories(params);
        return response?.data || [];
    } catch (error) {
        logger.error('getAllCategories failed', error);
        throw error;
    }
}

/**
 * Fetches a tag category by categoryId (requires authentication).
 *
 * @async
 * @function getCategoryById
 * @param {number} categoryId
 * @returns {Promise<{categoryId: number, name: string, dateAdded: string, dateUpdated: string|null}>} Category object
 * @throws {Error} If category not found or request fails.
 */
export async function getCategoryById(categoryId) {
    logger.info('getCategoryById called', { categoryId });
    try {
        const response = await apiClient.fetchCategoryById(categoryId);
        return response?.data || null;
    } catch (error) {
        logger.error('getCategoryById failed', error);
        throw error;
    }
}

/**
 * Updates an existing tag category by categoryId (requires authentication).
 *
 * @async
 * @function updateCategory
 * @param {number} categoryId - The category id to update
 * @param {{name: string}} category - The inputfields to update
 * @returns {Promise<{categoryId: number, name: string, dateAdded: string, dateUpdated: string|null}>} Updated category
 * @throws {Error} If not found, validation fails, or request fails.
 */
export async function updateCategory(categoryId, category) {
    logger.info('updateCategory called', { categoryId });
    try {
        const response = await apiClient.updateCategory(categoryId, category);
        return response?.data || null;
    } catch (error) {
        logger.error('updateCategory failed', error);
        throw error;
    }
}

/**
 * Deletes a category by categoryId (requires authentication).
 *
 * @async
 * @function deleteCategory
 * @param {number} categoryId - The categoryId to delete
 * @returns {Promise<void>} Resolves on success or throws if failed
 * @throws {Error} If category is not found or request fails.
 */
export async function deleteCategory(categoryId) {
    logger.info('deleteCategory called', { categoryId });
    try {
        await apiClient.deleteCategory(categoryId);
    } catch (error) {
        logger.error('deleteCategory failed', error);
        throw error;
    }
}

/**
 * Fetches all tag categories with their tags (authenticated aggregate endpoint).
 *
 * @async
 * @function getCategoriesWithTags
 * @param {Object} [params={}] - Optional: pagination/sort/filter params
 * @returns {Promise<Array>} Categories with tags array ({categoryId, name, tags: [...]})
 * @throws {Error} If request fails.
 */
export async function getCategoriesWithTags(params = {}) {
    logger.info('getCategoriesWithTags called', params);
    try {
        const response = await apiClient.fetchCategoriesWithTags(params);
        return response?.data || [];
    } catch (error) {
        logger.error('getCategoriesWithTags failed', error);
        throw error;
    }
}