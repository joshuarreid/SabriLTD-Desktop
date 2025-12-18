/**
 * Query keys for Tag-related TanStack queries & mutations.
 * Follows canonical key patterns to prevent cache bugs and ensure uniform query shapes.
 *
 * @see https://tanstack.com/query/latest/docs/framework/react/guides/query-keys
 */

/**
 * Top-level tag query cache key.
 * @constant
 * @type {Array}
 */
export const TAG = ['tag'];

/**
 * Canonical Tag query/mutation cache keys.
 *
 * Usage examples:
 *   tagKeys.lists()                          // ['tag', 'lists']
 *   tagKeys.list({ categoryId: 501 })        // ['tag', 'lists', { categoryId: 501 }]
 *   tagKeys.detail(1001)                     // ['tag', 'detail', 1001]
 *   tagKeys.create()                         // ['tag', 'create']
 *   tagKeys.update(1001)                     // ['tag', 'detail', 1001, 'update']
 *   tagKeys.remove(1001)                     // ['tag', 'detail', 1001, 'remove']
 */
export const tagKeys = {
    /**
     * The root key for all tag queries.
     * @type {Array}
     */
    all: TAG,

    /**
     * Key for all tag lists (with/without filters/pagination).
     *
     * @function lists
     * @returns {Array} The base list key for tags: ['tag', 'lists'].
     */
    lists: () => [...tagKeys.all, 'lists'],

    /**
     * Key for a filtered tag list.
     * Accepts plain filters (mirroring storageKeys.list) so we can include categoryId or
     * any other filter in a canonical way. These filters map directly to query params
     * for GET /api/tags (e.g., { categoryId, page, size, sortField, sortOrder, name }).
     *
     * @function list
     * @param {object} filters - Optional filters object, e.g. { categoryId: 501 }.
     * @returns {Array} Canonical query key for this filtered list.
     */
    list: (filters = {}) => [...tagKeys.lists(), { ...filters }],

    /**
     * Key for a single tag detail by id.
     *
     * @function detail
     * @param {number|string} tagId - Unique tag identifier.
     * @returns {Array} Detail query key.
     */
    detail: (tagId) => [...tagKeys.all, 'detail', tagId],

    /**
     * Key for the create tag mutation.
     *
     * @function create
     * @returns {Array} Create mutation key.
     */
    create: () => [...tagKeys.all, 'create'],

    /**
     * Key for the update tag mutation.
     *
     * @function update
     * @param {number|string} tagId - Tag identifier.
     * @returns {Array} Update mutation key.
     */
    update: (tagId) => [...tagKeys.detail(tagId), 'update'],

    /**
     * Key for the delete tag mutation.
     *
     * @function remove
     * @param {number|string} tagId - Tag identifier.
     * @returns {Array} Delete mutation key.
     */
    remove: (tagId) => [...tagKeys.detail(tagId), 'remove'],
};