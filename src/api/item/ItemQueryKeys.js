/**
 * ItemQueryKeys.js
 *
 * Canonical React Query keys for Item-related queries & mutations.
 * Mirrors the pattern used by jobQueryKeys to prevent cache bugs
 * and to keep query key shapes consistent across the app.
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
 * - Factory for canonical Item query/mutation cache keys.
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
 *   batchRemove: () => Array
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
     * Key for all item lists (with/without filters/pagination).
     * Typically used for general item collection queries.
     *
     * @function
     * @returns {Array} React Query key for items lists root.
     */
    lists: () => [...itemKeys.all, "lists"],

    /**
     * Key for a filtered items list.
     * Encodes filters & pagination into the key.
     *
     * @function
     * @param {object} [filters={}] - Arbitrary filters, e.g. { page:1, size:25, archived:false }.
     * @returns {Array} React Query key including filters.
     */
    list: (filters = {}) => [...itemKeys.lists(), { filters }],

    /**
     * Key for server-side item search (Meilisearch-backed).
     * Intended for POST /api/items/search with body params.
     *
     * @function
     * @param {object} [searchParams={}] - Search params, e.g. { query:'laptop', page:1, size:25 }.
     * @returns {Array} React Query key including search params.
     */
    search: (searchParams = {}) => [...itemKeys.all, "search", { searchParams }],

    /**
     * Key for a single basic item detail by id.
     * Maps to GET /api/items/{itemId}.
     *
     * @function
     * @param {number|string} itemId - Item identifier.
     * @returns {Array} React Query key for a specific item detail.
     */
    detail: (itemId) => [...itemKeys.all, "detail", itemId],

    /**
     * Key for expanded item details (GET /api/items/{itemId}/details).
     *
     * @function
     * @param {number|string} itemId - Item identifier.
     * @returns {Array} React Query key for expanded item details.
     */
    details: (itemId) => [...itemKeys.all, "details", itemId],

    /**
     * Key for create-item mutation.
     *
     * @function
     * @returns {Array} React Query key for create-item mutation.
     */
    create: () => [...itemKeys.all, "create"],

    /**
     * Key for update-item mutation.
     *
     * @function
     * @param {number|string} itemId - Item identifier.
     * @returns {Array} React Query key for update-item mutation.
     */
    update: (itemId) => [...itemKeys.detail(itemId), "update"],

    /**
     * Key for delete-item mutation.
     *
     * @function
     * @param {number|string} itemId - Item identifier.
     * @returns {Array} React Query key for delete-item mutation.
     */
    remove: (itemId) => [...itemKeys.detail(itemId), "remove"],

    /**
     * Key for batch delete-items mutation.
     *
     * @function
     * @returns {Array} React Query key for batch-delete mutation.
     */
    batchRemove: () => [...itemKeys.all, "batch-remove"],
};

export default itemKeys;