/**
 * Query keys for Condition-related TanStack queries & mutations.
 * Follows canonical key patterns to prevent cache bugs and ensure uniform query shapes.
 *
 * @see https://tanstack.com/query/latest/docs/framework/react/guides/query-keys
 */

/**
 * Top-level condition query cache key.
 * @constant
 * @type {Array}
 */
export const CONDITION = ['condition'];

/**
 * Canonical Condition query/mutation cache keys.
 *
 * Usage examples:
 *   conditionKeys.lists()                             // ['condition', 'lists']
 *   conditionKeys.list({ name })                      // ['condition', 'lists', { filters: { name } }]
 *   conditionKeys.detail(2)                           // ['condition', 'detail', 2]
 *   conditionKeys.create()                            // ['condition', 'create']
 *   conditionKeys.update(2)                           // ['condition', 'detail', 2, 'update']
 *   conditionKeys.remove(2)                           // ['condition', 'detail', 2, 'remove']
 */
export const conditionKeys = {
    /**
     * The root key for all condition queries.
     * @type {Array}
     */
    all: CONDITION,

    /**
     * Key for all condition lists (with/without filters/pagination).
     * @returns {Array}
     */
    lists: () => [...conditionKeys.all, 'lists'],

    /**
     * Key for a filtered conditions list.
     * @param {object} filters
     * @returns {Array}
     */
    list: (filters = {}) => [...conditionKeys.lists(), { filters }],

    /**
     * Key for a single condition detail by id.
     * @param {number|string} conditionId
     * @returns {Array}
     */
    detail: (conditionId) => [...conditionKeys.all, 'detail', conditionId],

    /**
     * Key for the create condition mutation.
     * @returns {Array}
     */
    create: () => [...conditionKeys.all, 'create'],

    /**
     * Key for the update condition mutation.
     * @param {number|string} conditionId
     * @returns {Array}
     */
    update: (conditionId) => [...conditionKeys.detail(conditionId), 'update'],

    /**
     * Key for the delete condition mutation.
     * @param {number|string} conditionId
     * @returns {Array}
     */
    remove: (conditionId) => [...conditionKeys.detail(conditionId), 'remove'],
};