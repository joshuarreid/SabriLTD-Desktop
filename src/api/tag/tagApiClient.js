import ApiClient from "../ApiClient.ts";

/**
 * Standardized logger for debugging and traceability.
 * Never logs sensitive data.
 * @constant
 * @type {{info: Function, error: Function}}
 */
const logger = {
    info: (...args) => console.log('[TagApiClient]', ...args),
    error: (...args) => console.error('[TagApiClient]', ...args),
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
 * TagApiClient
 * Handles API requests to tag endpoints, including CRUD.
 *
 * @class
 * @extends ApiClient
 */
export default class TagApiClient extends ApiClient {
    /**
     * Creates an instance of TagApiClient.
     * Uses baseURL from env API_URL unless overridden.
     *
     * @param {Object} [options={}]
     * @param {string} [options.baseURL] - Optional override for API base URL.
     * @param {number} [options.timeout=10000] - Request timeout in ms.
     */
    constructor({ baseURL, timeout = 10000 } = {}) {
        // NOTE: apiPath MUST NOT have trailing slash, so that
        // ApiClient._buildUrl + get() produce "/api/tags?categoryId=5"
        // and NOT "/api/tags/?categoryId=5" (which your backend rejects)
        super({ baseURL, timeout, apiPath: '/api/tags' });
        logger.info('TagApiClient initialized');
    }

    /**
     * Creates a new tag (requires authentication).
     * @async
     * @param {Object} payload - The tag inputfields { categoryId, name, updatedBy }
     * @returns {Promise<Object>} API response with new tag
     * @throws {Error} If request fails or validation error.
     */
    async createTag(payload) {
        logger.info('createTag called', { name: payload?.name, categoryId: payload?.categoryId });
        try {
            const token = await getTokenFromElectron();
            if (!token) {
                logger.error('createTag failed: No token available');
                throw new Error('No authentication token found');
            }
            // Storage client posts to '' (no trailing slash) – do the same here
            const response = await this.post('', payload, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            logger.info('createTag success', { tagId: response?.data?.tagId });
            return response;
        } catch (error) {
            logger.error('createTag failed', error);
            throw error;
        }
    }

    /**
     * Fetches all tag, optionally filtered by categoryId. Requires authentication.
     * Matches StorageApiClient pattern to avoid double slashes.
     *
     * @async
     * @param {Object} [params={}] - Optional filter and pagination params, e.g. { page, size, sortField, sortOrder, name, categoryId }
     * @returns {Promise<Object>} API response with array of tag objects
     * @throws {Error} If request fails.
     */
    async fetchAllTags(params = {}) {
        logger.info('fetchAllTags called', params);
        try {
            const token = await getTokenFromElectron();
            if (!token) {
                logger.error('fetchAllTags failed: No token available');
                throw new Error('No authentication token found');
            }
            // IMPORTANT: use '' (no trailing slash) just like fetchAllStorage does,
            // so ApiClient.get builds "/api/tags?categoryId=5" instead of "/api/tags/?categoryId=5"
            const response = await this.get('', params, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            logger.info(
                'fetchAllTags success',
                { count: Array.isArray(response?.data?.data) ? response.data.data.length : 0 },
            );
            return response;
        } catch (error) {
            logger.error('fetchAllTags failed', error);
            throw error;
        }
    }

    /**
     * Fetches a specific tag by id (requires authentication).
     * @async
     * @param {number} tagId
     * @returns {Promise<Object>} API response with tag object
     * @throws {Error} If tag not found or request fails.
     */
    async fetchTagById(tagId) {
        logger.info('fetchTagById called', { tagId });
        try {
            const token = await getTokenFromElectron();
            if (!token) {
                logger.error('fetchTagById failed: No token available');
                throw new Error('No authentication token found');
            }
            const response = await this.get(`/${tagId}`, {}, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            logger.info('fetchTagById success', { tagId: response?.data?.tagId });
            return response;
        } catch (error) {
            logger.error('fetchTagById failed', error);
            throw error;
        }
    }

    /**
     * Updates an existing tag by id (requires authentication).
     * @async
     * @param {number} tagId - The tag id to update
     * @param {Object} payload - The inputfields to update { categoryId, name, updatedBy }
     * @returns {Promise<Object>} API response with updated tag
     * @throws {Error} If not found, validation fails, or request fails.
     */
    async updateTag(tagId, payload) {
        logger.info('updateTag called', { tagId });
        try {
            const token = await getTokenFromElectron();
            if (!token) {
                logger.error('updateTag failed: No token available');
                throw new Error('No authentication token found');
            }
            const response = await this.put(`/${tagId}`, payload, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            logger.info('updateTag success', { tagId: response?.data?.tagId });
            return response;
        } catch (error) {
            logger.error('updateTag failed', error);
            throw error;
        }
    }

    /**
     * Deletes a tag by id (requires authentication).
     * @async
     * @param {number} tagId - The tag id to delete
     * @returns {Promise<void>} Resolves on success or throws if failed
     * @throws {Error} If tag is not found or request fails.
     */
    async deleteTag(tagId) {
        logger.info('deleteTag called', { tagId });
        try {
            const token = await getTokenFromElectron();
            if (!token) {
                logger.error('deleteTag failed: No token available');
                throw new Error('No authentication token found');
            }
            await this.delete(`/${tagId}`, {}, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            logger.info('deleteTag success', { tagId });
        } catch (error) {
            logger.error('deleteTag failed', error);
            throw error;
        }
    }
}