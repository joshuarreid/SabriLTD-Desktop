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
        // Defensive: API wraps payload as { status, data, meta, transactionId, errors }
        return response?.data || [];
    } catch (error) {
        logger.error('getPublicUsers failed', error);
        throw error;
    }
}

/**
 * User module logger (standardized).
 *
 * @constant
 */
const logger = {
    info: (...args) => console.log('[user]', ...args),
    error: (...args) => console.error('[user]', ...args),
};