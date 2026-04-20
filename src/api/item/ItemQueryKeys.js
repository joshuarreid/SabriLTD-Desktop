/**
 * ItemQueryKeys.js
 *
 * Canonical React Query keys for Item-related queries & mutations.
 * Follows Bulletproof React and jobQueryKeys for consistency.
 *
 * Key goals:
 * - Stable key shapes
 * - Parameterized keys for filtered/paginated queries (especially search)
 * - Predictable prefixes for broad invalidation (itemKeys.all / itemKeys.lists / etc.)
 */

/**
 * Top-level item query cache key.
 *
 * @constant
 * @type {Array}
 */
export const ITEM = ["item"];

/**
 * itemKeys
 * - Factory for all canonical item query/mutation keys.
 *
 * IMPORTANT:
 * - Search keys MUST include the request params in the key, otherwise page 1 and page 2
 *   will collide and show identical cached results.
 * - This file preserves the existing canonical structure:
 *   - Root: ['item']
 *   - Lists: ['item','lists', { filters }]
 *   - Search: ['item','search', { searchParams }]
 *   - Detail/Details: ['item','detail', id] and ['item','details', id]
 *   - Mutations: create/update/remove/batchRemove
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
     *
     * @type {Array}
     */
    all: ITEM,

    /**
     * items lists root key.
     *
     * @function
     * @returns {Array}
     */
    lists: () => [...itemKeys.all, "lists"],

    /**
     * Key for a filtered/paginated items list.
     *
     * @function
     * @param {object} [filters={}]
     * @returns {Array}
     */
    list: (filters = {}) => [...itemKeys.lists(), { filters }],

    /**
     * Key for server-side item search (Meilisearch).
     *
     * Canonical shape:
     *   ['item', 'search', { searchParams }]
     *
     * Rules:
     * - searchParams MUST include page/size (and query/sort/filters/includeArchived when used),
     *   so each unique request gets a distinct cache entry.
     * - searchParams MUST be a plain JSON-serializable object (no functions/classes/Date instances).
     *
     * @function
     * @param {object} [searchParams={}] - ItemSearchRequest payload (query, filters, page, size, sort, includeArchived).
     * @returns {Array}
     */
    search: (searchParams = {}) => {
        const safeSearchParams = searchParams && typeof searchParams === "object" ? searchParams : {};
        return [...itemKeys.all, "search", { searchParams: safeSearchParams }];
    },

    /**
     * Key for single item summary/detail (by id).
     *
     * @function
     * @param {number|string} itemId
     * @returns {Array}
     */
    detail: (itemId) => [...itemKeys.all, "detail", itemId],

    /**
     * Key for expanded details (GET /details).
     *
     * @function
     * @param {number|string} itemId
     * @returns {Array}
     */
    details: (itemId) => [...itemKeys.all, "details", itemId],

    /**
     * Key for create-item mutation.
     *
     * @function
     * @returns {Array}
     */
    create: () => [...itemKeys.all, "create"],

    /**
     * Key for update-item mutation.
     *
     * @function
     * @param {number|string} itemId
     * @returns {Array}
     */
    update: (itemId) => [...itemKeys.detail(itemId), "update"],

    /**
     * Key for delete-item mutation.
     *
     * @function
     * @param {number|string} itemId
     * @returns {Array}
     */
    remove: (itemId) => [...itemKeys.detail(itemId), "remove"],

    /**
     * Key for batch remove mutation.
     *
     * @function
     * @returns {Array}
     */
    batchRemove: () => [...itemKeys.all, "batch-remove"],
};

export default itemKeys;