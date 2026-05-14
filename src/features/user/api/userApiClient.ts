/**
 * UserApiClient
 * - Specialized API client for user endpoints.
 * - Implements public user list fetching, user CRUD endpoints, and follows Bulletproof React conventions.
 *
 * @module UserApiClient
 */

import ApiClient from "../../../api/ApiClient";
import {
    PublicUser,
    User,
    UserCreateInput,
    UserUpdateInput,
    UserResponse,
    UserListResponse,
    PublicUserListResponse
} from "./user.types";

/**
 * Standardized logger for debugging and traceability.
 * Never logs sensitive data.
 * @constant
 * @type {{info: Function, error: Function}}
 */
const logger = {
    info: (...args: unknown[]) => console.log('[UserApiClient]', ...args),
    error: (...args: unknown[]) => console.error('[UserApiClient]', ...args),
};

/**
 * Retrieves the session token from Electron main process via preload bridge.
 * @async
 * @function getTokenFromElectron
 * @returns {Promise<string|null>} The authentication token, or null if unavailable.
 */
const getTokenFromElectron = async (): Promise<string | null> => {
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
 * UserApiClient
 * Handles API requests to user endpoints, including CRUD, public listing, and /me endpoint.
 *
 * @class
 * @extends ApiClient
 */
export default class UserApiClient extends ApiClient {
    /**
     * Creates an instance of UserApiClient.
     * Uses baseURL from env API_URL unless overridden.
     *
     * @param {Object} [options={}]
     * @param {string} [options.baseURL] - Optional override for API base URL.
     * @param {number} [options.timeout=10000] - Request timeout in ms.
     */
    constructor({ baseURL, timeout = 10000 }: { baseURL?: string; timeout?: number } = {}) {
        super({ baseURL, timeout, apiPath: '/api/users' });
        logger.info('UserApiClient initialized');
    }

    /**
     * Fetches the public list of users (minimal info, no auth required).
     * Makes GET request to `/public-list`.
     *
     * @async
     * @returns {Promise<Object>} API response with array of user objects { userId, name }
     * @throws {Error} If the request fails (network, 500, etc).
     */
    async fetchPublicList(): Promise<{ data: PublicUserListResponse }> {
        logger.info('fetchPublicList called - full payload', {});
        try {
            const response = await this.get('/public-list');
            logger.info('fetchPublicList response', response);
            return response;
        } catch (error) {
            logger.error('fetchPublicList failed', error);
            throw error;
        }
    }

    /**
     * Fetches details for the currently authenticated user using /me endpoint.
     * Uses Electron IPC preload bridge to retrieve the token and attaches it as Authorization header.
     *
     * @async
     * @function fetchMe
     * @returns {Promise<Object>} API response with user object.
     * @throws {Error} If the request fails (network, 401, 500, etc).
     */
    async fetchMe(): Promise<{ data: UserResponse }> {
        logger.info('fetchMe called - full payload', {});
        try {
            const token = await getTokenFromElectron();
            if (!token) {
                logger.error('fetchMe failed: No token available');
                throw new Error('No authentication token found');
            }
            const response = await this.get('/me', {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            logger.info('fetchMe response', response);
            return response;
        } catch (error) {
            logger.error('fetchMe failed', error);
            throw error;
        }
    }

    /**
     * Fetches the list of all users (requires authentication).
     * @async
     * @returns {Promise<Object>} API response with array of user objects
     * @throws {Error} If the request fails (network, 401, 500, etc).
     */
    async fetchAllUsers(): Promise<{ data: UserListResponse }> {
        logger.info('fetchAllUsers called - full payload', {});
        try {
            const token = await getTokenFromElectron();
            if (!token) throw new Error('No authentication token found');
            const response = await this.get('/', {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            logger.info('fetchAllUsers response', response);
            return response;
        } catch (error) {
            logger.error('fetchAllUsers failed', error);
            throw error;
        }
    }

    /**
     * Fetches a specific user by user ID (requires authentication).
     * @async
     * @param {number} userId - The user ID to retrieve.
     * @returns {Promise<Object>} API response with user object
     * @throws {Error} If user does not exist or request fails.
     */
    async fetchUserById(userId: number): Promise<{ data: UserResponse }> {
        logger.info('fetchUserById called - full payload', { userId });
        try {
            const token = await getTokenFromElectron();
            if (!token) throw new Error('No authentication token found');
            const response = await this.get(`/${userId}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            logger.info('fetchUserById response', response);
            return response;
        } catch (error) {
            logger.error('fetchUserById failed', error);
            throw error;
        }
    }

    /**
     * Creates a new user (requires authentication).
     * @async
     * @param {Object} payload - The user object { name, email }
     * @returns {Promise<Object>} API response with newly created user
     * @throws {Error} If request fails, email is duplicate, or validation fails.
     */
    async createUser(user: UserCreateInput): Promise<{ data: UserResponse }> {
        logger.info('createUser called', { name: user?.name });
        try {
            const token = await getTokenFromElectron();
            if (!token) throw new Error('No authentication token found');
            const response = await this.post('/', user, {
                headers: { Authorization: `Bearer ${token}` }
            });
            logger.info('createUser response', response);
            return response;
        } catch (error) {
            logger.error('createUser failed', error);
            throw error;
        }
    }

    /**
     * Updates an existing user by userId (requires authentication).
     * @async
     * @param {number} userId - The user ID to update
     * @param {Object} payload - Updated user inputfields { name, email }
     * @returns {Promise<Object>} API response with updated user
     * @throws {Error} If not found, validation fails, or request fails.
     */
    async updateUser(userId: number, user: UserUpdateInput): Promise<{ data: UserResponse }> {
        logger.info('updateUser called', { userId });
        try {
            const token = await getTokenFromElectron();
            if (!token) throw new Error('No authentication token found');
            const response = await this.put(`/${userId}`, user, {
                headers: { Authorization: `Bearer ${token}` }
            });
            logger.info('updateUser response', response);
            return response;
        } catch (error) {
            logger.error('updateUser failed', error);
            throw error;
        }
    }

    /**
     * Deletes a user by userId (requires authentication).
     * @async
     * @param {number} userId - The user ID to delete.
     * @returns {Promise<Object>} API success response or throws
     * @throws {Error} If user is not found or request fails.
     */
    async deleteUser(userId: number): Promise<void> {
        logger.info('deleteUser called', { userId });
        try {
            const token = await getTokenFromElectron();
            if (!token) throw new Error('No authentication token found');
            await this.delete(`/${userId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
        } catch (error) {
            logger.error('deleteUser failed', error);
            throw error;
        }
    }
}