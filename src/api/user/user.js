import UserApiClient from "./userApiClient";

/**
 * Singleton instance of UserApiClient.
 * Ensures all user API requests are routed through a preconfigured client.
 *
 * @constant
 * @type {UserApiClient}
 */
const apiClient = new UserApiClient();

/**
 * User module logger (standardized).
 *
 * @constant
 */
const logger = {
    info: (...args) => console.log('[user]', ...args),
    error: (...args) => console.error('[user]', ...args),
};

/**
 * Fetches the list of user display names and their IDs from the public endpoint.
 *
 * @async
 * @function getPublicUsers
 * @returns {Promise<Array<{userId: number, name: string}>>} Array of public user objects
 * @throws {Error} If the request fails (network, 500, etc).
 */
export async function getPublicUsers() {
    logger.info('getPublicUsers called');
    try {
        const response = await apiClient.fetchPublicList();
        return response?.data || [];
    } catch (error) {
        logger.error('getPublicUsers failed', error);
        throw error;
    }
}

/**
 * Fetches the current authenticated user by token using /me endpoint.
 *
 * @async
 * @function getMe
 * @returns {Promise<{userId: number, name: string, email: string, dateAdded: string, dateUpdated: string}>} User object
 * @throws {Error} If the request fails (network, 401, 500, etc).
 */
export async function getMe() {
    logger.info('getMe called');
    try {
        const response = await apiClient.fetchMe();
        return response?.data || null;
    } catch (error) {
        logger.error('getMe failed', error);
        throw error;
    }
}

/**
 * Fetches all users (requires authentication).
 *
 * @async
 * @function getAllUsers
 * @returns {Promise<Array<{userId: number, name: string, email: string, dateAdded: string, dateUpdated: string}>>} User objects
 * @throws {Error} If the request fails (network, 401, 500, etc).
 */
export async function getAllUsers() {
    logger.info('getAllUsers called');
    try {
        const response = await apiClient.fetchAllUsers();
        return response?.data || [];
    } catch (error) {
        logger.error('getAllUsers failed', error);
        throw error;
    }
}

/**
 * Fetches a user by userId (requires authentication).
 *
 * @async
 * @function getUserById
 * @param {number} userId - The user ID to fetch
 * @returns {Promise<{userId: number, name: string, email: string, dateAdded: string, dateUpdated: string}>} User object
 * @throws {Error} If user is not found or request fails.
 */
export async function getUserById(userId) {
    logger.info('getUserById called', { userId });
    try {
        const response = await apiClient.fetchUserById(userId);
        return response?.data || null;
    } catch (error) {
        logger.error('getUserById failed', error);
        throw error;
    }
}

/**
 * Creates a new user (requires authentication).
 *
 * @async
 * @function createUser
 * @param {{name: string, email: string}} user - The user payload
 * @returns {Promise<{userId: number, name: string, email: string, dateAdded: string, dateUpdated: string}>} New user object
 * @throws {Error} If request fails, duplicate email, or validation error.
 */
export async function createUser(user) {
    logger.info('createUser called', { name: user?.name });
    try {
        const response = await apiClient.createUser(user);
        return response?.data || null;
    } catch (error) {
        logger.error('createUser failed', error);
        throw error;
    }
}

/**
 * Updates an existing user by userId (requires authentication).
 *
 * @async
 * @function updateUser
 * @param {number} userId - The ID to update
 * @param {{name: string, email: string}} user - The fields to update
 * @returns {Promise<{userId: number, name: string, email: string, dateAdded: string, dateUpdated: string}>} Updated user
 * @throws {Error} If not found, validation fails, or request fails.
 */
export async function updateUser(userId, user) {
    logger.info('updateUser called', { userId });
    try {
        const response = await apiClient.updateUser(userId, user);
        return response?.data || null;
    } catch (error) {
        logger.error('updateUser failed', error);
        throw error;
    }
}

/**
 * Deletes a user by userId (requires authentication).
 *
 * @async
 * @function deleteUser
 * @param {number} userId - The user ID to delete
 * @returns {Promise<void>} Resolves on success or throws if failed
 * @throws {Error} If user not found or request fails.
 */
export async function deleteUser(userId) {
    logger.info('deleteUser called', { userId });
    try {
        await apiClient.deleteUser(userId);
        // The server returns 204 NO CONTENT on success, so nothing to return
    } catch (error) {
        logger.error('deleteUser failed', error);
        throw error;
    }
}