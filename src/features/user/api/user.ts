import UserApiClient from "./userApiClient";
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
 * Singleton instance of UserApiClient.
 * Ensures all user API requests are routed through a preconfigured client.
 *
 * @constant
 * @type {UserApiClient}
 */
const apiClient = new UserApiClient();

/**
 * user module logger (standardized).
 *
 * @constant
 */
const logger = {
    info: (...args: unknown[]) => console.log('[user]', ...args),
    error: (...args: unknown[]) => console.error('[user]', ...args),
};

/**
 * Fetches the list of user display names and their IDs from the public endpoint.
 *
 * @async
 * @function getPublicUsers
 * @returns {Promise<PublicUserListResponse>} Array of public user objects
 * @throws {Error} If the request fails (network, 500, etc).
 */
export async function getPublicUsers(): Promise<PublicUserListResponse> {
    logger.info('getPublicUsers called');
    try {
        const response = await apiClient.fetchPublicList();
        return response?.data as PublicUserListResponse || [];
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
 * @returns {Promise<UserResponse>} user object
 * @throws {Error} If the request fails (network, 401, 500, etc).
 */
export async function getMe(): Promise<UserResponse> {
    logger.info('getMe called');
    try {
        const response = await apiClient.fetchMe();
        return response?.data as UserResponse || null;
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
 * @returns {Promise<UserListResponse>} user objects
 * @throws {Error} If the request fails (network, 401, 500, etc).
 */
export async function getAllUsers(): Promise<UserListResponse> {
    logger.info('getAllUsers called');
    try {
        const response = await apiClient.fetchAllUsers();
        return response?.data as UserListResponse || [];
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
 * @returns {Promise<UserResponse>} user object
 * @throws {Error} If user is not found or request fails.
 */
export async function getUserById(userId: number): Promise<UserResponse> {
    logger.info('getUserById called', { userId });
    try {
        const response = await apiClient.fetchUserById(userId);
        return response?.data as UserResponse || null;
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
 * @param {UserCreateInput} user - The user payload
 * @returns {Promise<UserResponse>} New user object
 * @throws {Error} If request fails, duplicate email, or validation error.
 */
export async function createUser(user: UserCreateInput): Promise<UserResponse> {
    logger.info('createUser called', { name: user?.name });
    try {
        const response = await apiClient.createUser(user);
        return response?.data as UserResponse || null;
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
 * @param {UserUpdateInput} user - The inputfields to update
 * @returns {Promise<UserResponse>} Updated user
 * @throws {Error} If not found, validation fails, or request fails.
 */
export async function updateUser(userId: number, user: UserUpdateInput): Promise<UserResponse> {
    logger.info('updateUser called', { userId });
    try {
        const response = await apiClient.updateUser(userId, user);
        return response?.data as UserResponse || null;
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
export async function deleteUser(userId: number): Promise<void> {
    logger.info('deleteUser called', { userId });
    try {
        await apiClient.deleteUser(userId);
        // The server returns 204 NO CONTENT on success, so nothing to return
    } catch (error) {
        logger.error('deleteUser failed', error);
        throw error;
    }
}