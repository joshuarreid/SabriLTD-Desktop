/**
 * Query keys for Storage-related TanStack queries & mutations.
 * Follows canonical key patterns to prevent cache bugs and ensure uniform query shapes.
 *
 * @see https://tanstack.com/query/latest/docs/framework/react/guides/query-keys
 */

/**
 * Top-level storage query cache key.
 * @constant
 * @type {Array}
 */
export const STORAGE = ['storage'];

/**
 * Canonical Storage query/mutation cache keys.
 *
 * Usage examples:
 *   storageKeys.lists()                             // ['storage', 'lists']
 *   storageKeys.list({ sortField, name })           // ['storage', 'lists', { filters: { sortField, name } }]
 *   storageKeys.detail(501)                         // ['storage', 'detail', 501]
 *   storageKeys.create()                            // ['storage', 'create']
 *   storageKeys.update(501)                         // ['storage', 'detail', 501, 'update']
 *   storageKeys.remove(501)                         // ['storage', 'detail', 501, 'remove']
 */
export const storageKeys = {
    /**
     * The root key for all storage queries.
     * @type {Array}
     */
    all: STORAGE,

    /**
     * Key for all storage lists (with/without filters/pagination).
     * @returns {Array}
     */
    lists: () => [...storageKeys.all, 'lists'],

    /**
     * Key for a filtered storage list.
     * @param {object} filters
     * @returns {Array}
     */
    list: (filters = {}) => [...storageKeys.lists(), { filters }],

    /**
     * Key for a single storage detail by id.
     * @param {number|string} storageId
     * @returns {Array}
     */
    detail: (storageId) => [...storageKeys.all, 'detail', storageId],

    /**
     * Key for the create storage mutation.
     * @returns {Array}
     */
    create: () => [...storageKeys.all, 'create'],

    /**
     * Key for the update storage mutation.
     * @param {number|string} storageId
     * @returns {Array}
     */
    update: (storageId) => [...storageKeys.detail(storageId), 'update'],

    /**
     * Key for the delete storage mutation.
     * @param {number|string} storageId
     * @returns {Array}
     */
    remove: (storageId) => [...storageKeys.detail(storageId), 'remove'],
};