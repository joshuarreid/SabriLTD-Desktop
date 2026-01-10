import ConditionApiClient from "./conditionApiClient";

/**
 * Singleton instance of ConditionApiClient.
 * Ensures all condition API requests are routed through a preconfigured client.
 *
 * @constant
 * @type {ConditionApiClient}
 */
const apiClient = new ConditionApiClient();

/**
 * Condition module logger (standardized).
 *
 * @constant
 */
const logger = {
    info: (...args) => console.log('[condition]', ...args),
    error: (...args) => console.error('[condition]', ...args),
};

/**
 * Creates a new condition (requires authentication).
 *
 * @async
 * @function createCondition
 * @param {{name: string}} condition - Condition payload (must be one of the allowed names)
 * @returns {Promise<{conditionId: number, name: string}>} Condition object
 * @throws {Error} If request fails: duplicate, invalid, or server error
 */
export async function createCondition(condition) {
    logger.info('createCondition called', { name: condition?.name });
    try {
        const response = await apiClient.createCondition(condition);
        return response?.data || null;
    } catch (error) {
        logger.error('createCondition failed', error);
        throw error;
    }
}

/**
 * Fetches all conditions.
 *
 * @async
 * @function getAllConditions
 * @returns {Promise<Array<{conditionId: number, name: string}>>} Array of condition objects
 * @throws {Error} If request fails (network, auth, or server error).
 */
export async function getAllConditions() {
    logger.info('getAllConditions called');
    try {
        const response = await apiClient.fetchAllConditions();
        return response?.data || [];
    } catch (error) {
        logger.error('getAllConditions failed', error);
        throw error;
    }
}

/**
 * Fetches a condition by conditionId.
 *
 * @async
 * @function getConditionById
 * @param {number} conditionId
 * @returns {Promise<{conditionId: number, name: string}>} Condition object
 * @throws {Error} If not found or request fails.
 */
export async function getConditionById(conditionId) {
    logger.info('getConditionById called', { conditionId });
    try {
        const response = await apiClient.fetchConditionById(conditionId);
        return response?.data || null;
    } catch (error) {
        logger.error('getConditionById failed', error);
        throw error;
    }
}

/**
 * Updates an existing condition by conditionId.
 *
 * @async
 * @function updateCondition
 * @param {number} conditionId - The condition id to update
 * @param {{name: string}} condition - The updated condition object (name must be allowed)
 * @returns {Promise<{conditionId: number, name: string}>} Updated condition object
 * @throws {Error} If not found, validation fails, duplicate, or request fails.
 */
export async function updateCondition(conditionId, condition) {
    logger.info('updateCondition called', { conditionId });
    try {
        const response = await apiClient.updateCondition(conditionId, condition);
        return response?.data || null;
    } catch (error) {
        logger.error('updateCondition failed', error);
        throw error;
    }
}

/**
 * Deletes a condition by conditionId.
 *
 * @async
 * @function deleteCondition
 * @param {number} conditionId - The conditionId to delete
 * @returns {Promise<void>} Resolves on success or throws if failed
 * @throws {Error} If not found or request fails.
 */
export async function deleteCondition(conditionId) {
    logger.info('deleteCondition called', { conditionId });
    try {
        await apiClient.deleteCondition(conditionId);
    } catch (error) {
        logger.error('deleteCondition failed', error);
        throw error;
    }
}