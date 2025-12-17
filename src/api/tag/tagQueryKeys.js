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
 *   tagKeys.lists()                         // ['tag', 'lists']
 *   tagKeys.list({ sortField, name })       // ['tag', 'lists', { filters: { sortField, name } }]
 *   tagKeys.detail(1001)                    // ['tag', 'detail', 1001]
 *   tagKeys.create()                        // ['tag', 'create']
 *   tagKeys.update(1001)                    // ['tag', 'detail', 1001, 'update']
 *   tagKeys.remove(1001)                    // ['tag', 'detail', 1001, 'remove']
 */
export const tagKeys = {
    /**
     * The root key for all tag queries.
     * @type {Array}
     */
    all: TAG,

    /**
     * Key for all tag lists (with/without filters/pagination).
     * @returns {Array}
     */
    lists: () => [...tagKeys.all, 'lists'],

    /**
     * Key for a filtered tag list.
     * @param {object} filters
     * @returns {Array}
     */
    list: (filters = {}) => [...tagKeys.lists(), { filters }],

    /**
     * Key for a single tag detail by id.
     * @param {number|string} tagId
     * @returns {Array}
     */
    detail: (tagId) => [...tagKeys.all, 'detail', tagId],

    /**
     * Key for the create tag mutation.
     * @returns {Array}
     */
    create: () => [...tagKeys.all, 'create'],

    /**
     * Key for the update tag mutation.
     * @param {number|string} tagId
     * @returns {Array}
     */
    update: (tagId) => [...tagKeys.detail(tagId), 'update'],

    /**
     * Key for the delete tag mutation.
     * @param {number|string} tagId
     * @returns {Array}
     */
    remove: (tagId) => [...tagKeys.detail(tagId), 'remove'],
};