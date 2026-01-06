/**
 * ItemQueryKeys.js
 *
 * Canonical React Query keys for Item-related queries & mutations.
 * Follows Bulletproof React and jobQueryKeys for consistency.
 */

/**
 * Top-level item query cache key.
 * @constant
 * @type {Array}
 */
export const ITEM = ["item"];

/**
 * itemKeys
 * - Factory for all canonical item query/mutation keys.
 *
 * @constant
 * @type {{
 *   all: Array,
 *   lists: () => Array,
 *   list: (filters?: object) => Array,
 *   search: (searchParams?: object) => Array,
 *   detail: (itemId: number|string) => Array,
 *   details: (itemId: number|string) => Array,
 *   create: () => Array,
 *   update: (itemId: number|string) => Array,
 *   remove: (itemId: number|string) => Array,
 *   batchRemove: () => Array,
 * }}
 */
export const itemKeys = {
    /**
     * Root key for all item queries.
     * @type {Array}
     */
    all: ITEM,

    /**
     * items lists root key.
     * @function
     * @returns {Array}
     */
    lists: () => [...itemKeys.all, "lists"],

    /**
     * Key for a filtered/paginated items list.
     * @function
     * @param {object} [filters={}]
     * @returns {Array}
     */
    list: (filters = {}) => [...itemKeys.lists(), { filters }],

    /**
     * Key for server-side item search (Meilisearch).
     * @function
     * @param {object} [searchParams={}]
     * @returns {Array}
     */
    search: (searchParams = {}) => [...itemKeys.all, "search", { searchParams }],

    /**
     * Key for single item summary/detail (by id).
     * @function
     * @param {number|string} itemId
     * @returns {Array}
     */
    detail: (itemId) => [...itemKeys.all, "detail", itemId],

    /**
     * Key for expanded details (GET /details).
     * @function
     * @param {number|string} itemId
     * @returns {Array}
     */
    details: (itemId) => [...itemKeys.all, "details", itemId],

    /**
     * Key for create-item mutation.
     * @function
     * @returns {Array}
     */
    create: () => [...itemKeys.all, "create"],

    /**
     * Key for update-item mutation.
     * @function
     * @param {number|string} itemId
     * @returns {Array}
     */
    update: (itemId) => [...itemKeys.detail(itemId), "update"],

    /**
     * Key for delete-item mutation.
     * @function
     * @param {number|string} itemId
     * @returns {Array}
     */
    remove: (itemId) => [...itemKeys.detail(itemId), "remove"],

    /**
     * Key for batch remove mutation.
     * @function
     * @returns {Array}
     */
    batchRemove: () => [...itemKeys.all, "batch-remove"],
};

export default itemKeys;