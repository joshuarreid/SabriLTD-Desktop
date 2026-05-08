/**
 * CategoryApiClient
 * - Specialized API client for Tag Category endpoints.
 * - Implements category CRUD, audited responses, filtering, pagination, and advanced with-tag aggregation.
 *
 * @module CategoryApiClient
 */

import ApiClient from "../ApiClient.ts";

/**
 * Standardized logger for debugging and traceability.
 * Never logs sensitive data.
 * @constant
 * @type {{info: Function, error: Function}}
 */
const logger = {
    info: (...args) => console.log('[CategoryApiClient]', ...args),
    error: (...args) => console.error('[CategoryApiClient]', ...args),
};

/**
 * Retrieves the session token from Electron main process via preload bridge.
 * @async
 * @function getTokenFromElectron
 * @returns {Promise<string|null>} The authentication token, or null if unavailable.
 */
const getTokenFromElectron = async () => {
    logger.info('getTokenFromElectron called');
    if (window.electronAPI && window.electronAPI.tokenGet) {
        try {
            const { success, token } = await window.electronAPI.tokenGet();
            logger.info('getTokenFromElectron response', { success });
            return success ? token : null;
        } catch (error) {
            logger.error('getTokenFromElectron error', error);
            return null;
        }
    }
    logger.error('Electron ipc not available; token-get skipped');
    return null;
};

/**
 * CategoryApiClient
 * Handles API requests to tag category endpoints, including CRUD and with-tag aggregate endpoints.
 *
 * @class
 * @extends ApiClient
 */
export default class CategoryApiClient extends ApiClient {
    /**
     * Creates an instance of CategoryApiClient.
     * Uses baseURL from env API_URL unless overridden.
     *
     * @param {Object} [options={}]
     * @param {string} [options.baseURL] - Optional override for API base URL.
     * @param {number} [options.timeout=10000] - Request timeout in ms.
     */
    constructor({ baseURL, timeout = 10000 } = {}) {
        super({ baseURL, timeout, apiPath: '/api/tag-categories' });
        logger.info('CategoryApiClient initialized');
    }

    /**
     * Creates a new tag category (requires authentication).
     * @async
     * @param {Object} payload - The category inputfields { name }
     * @returns {Promise<Object>} API response with new category
     * @throws {Error} If request fails or validation error.
     */
    async createCategory(payload) {
        logger.info('createCategory called', { name: payload?.name });
        try {
            const token = await getTokenFromElectron();
            if (!token) {
                logger.error('createCategory failed: No token available');
                throw new Error('No authentication token found');
            }
            const response = await this.post('/', payload, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            logger.info('createCategory success', { categoryId: response?.data?.categoryId });
            return response;
        } catch (error) {
            logger.error('createCategory failed', error);
            throw error;
        }
    }

    /**
     * Fetches all tag categories (supports pagination, sorting). Requires authentication.
     * @async
     * @param {Object} [params={}] - Optional filter and pagination params, e.g. { page, size, sortField, sortOrder }
     * @returns {Promise<Object>} API response with array of tag category objects
     * @throws {Error} If request fails.
     */
    async fetchAllCategories(params = {}) {
        logger.info('fetchAllCategories called', params);
        try {
            const token = await getTokenFromElectron();
            if (!token) {
                logger.error('fetchAllCategories failed: No token available');
                throw new Error('No authentication token found');
            }
            const response = await this.get('/', params, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            logger.info('fetchAllCategories success', { count: Array.isArray(response?.data) ? response.data.length : 0 });
            return response;
        } catch (error) {
            logger.error('fetchAllCategories failed', error);
            throw error;
        }
    }

    /**
     * Fetches a specific tag category by id (requires authentication).
     * @async
     * @param {number} categoryId
     * @returns {Promise<Object>} API response with tag category object
     * @throws {Error} If category not found or request fails.
     */
    async fetchCategoryById(categoryId) {
        logger.info('fetchCategoryById called', { categoryId });
        try {
            const token = await getTokenFromElectron();
            if (!token) {
                logger.error('fetchCategoryById failed: No token available');
                throw new Error('No authentication token found');
            }
            const response = await this.get(`/${categoryId}`, {}, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            logger.info('fetchCategoryById success', { categoryId: response?.data?.categoryId });
            return response;
        } catch (error) {
            logger.error('fetchCategoryById failed', error);
            throw error;
        }
    }

    /**
     * Updates an existing tag category by id (requires authentication).
     * @async
     * @param {number} categoryId - The category id to update
     * @param {Object} payload - The inputfields to update { name }
     * @returns {Promise<Object>} API response with updated category
     * @throws {Error} If not found, validation fails, or request fails.
     */
    async updateCategory(categoryId, payload) {
        logger.info('updateCategory called', { categoryId });
        try {
            const token = await getTokenFromElectron();
            if (!token) {
                logger.error('updateCategory failed: No token available');
                throw new Error('No authentication token found');
            }
            const response = await this.put(`/${categoryId}`, payload, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            logger.info('updateCategory success', { categoryId: response?.data?.categoryId });
            return response;
        } catch (error) {
            logger.error('updateCategory failed', error);
            throw error;
        }
    }

    /**
     * Deletes a tag category by id (requires authentication).
     * @async
     * @param {number} categoryId - The tag category id to delete
     * @returns {Promise<void>} Resolves on success or throws if failed
     * @throws {Error} If category is not found or request fails.
     */
    async deleteCategory(categoryId) {
        logger.info('deleteCategory called', { categoryId });
        try {
            const token = await getTokenFromElectron();
            if (!token) {
                logger.error('deleteCategory failed: No token available');
                throw new Error('No authentication token found');
            }
            await this.delete(`/${categoryId}`, {}, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            logger.info('deleteCategory success', { categoryId });
        } catch (error) {
            logger.error('deleteCategory failed', error);
            throw error;
        }
    }

    /**
     * Fetches all tag categories with their tag (advanced aggregate endpoint).
     * @async
     * @function fetchCategoriesWithTags
     * @param {Object} [params={}] - Optional: pagination/sort/filter params
     * @returns {Promise<Object>} API response with array of category-with-tag objects
     * @throws {Error} If request fails.
     */
    async fetchCategoriesWithTags(params = {}) {
        logger.info('fetchCategoriesWithTags called', params);
        try {
            const token = await getTokenFromElectron();
            if (!token) {
                logger.error('fetchCategoriesWithTags failed: No token available');
                throw new Error('No authentication token found');
            }
            const response = await this.get('/with-tags', params, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            logger.info('fetchCategoriesWithTags success', { count: Array.isArray(response?.data) ? response.data.length : 0 });
            return response;
        } catch (error) {
            logger.error('fetchCategoriesWithTags failed', error);
            throw error;
        }
    }
}