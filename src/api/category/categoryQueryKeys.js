/**
 * Query keys for Tag Category-related TanStack queries & mutations.
 * Follows canonical key patterns to prevent cache bugs and ensure uniform query shapes.
 *
 * @see https://tanstack.com/query/latest/docs/framework/react/guides/query-keys
 */

/**
 * Top-level tag category query cache key.
 * @constant
 * @type {Array}
 */
export const CATEGORY = ['category'];

/**
 * Canonical Tag Category query/mutation cache keys.
 *
 * Usage examples:
 *   categoryKeys.lists()                                 // ['category', 'lists']
 *   categoryKeys.list({ sortField, name })               // ['category', 'lists', { filters: { sortField, name } }]
 *   categoryKeys.detail(501)                             // ['category', 'detail', 501]
 *   categoryKeys.withTags()                              // ['category', 'with-tags']
 *   categoryKeys.withTagsList({ name: 'Item Type' })     // ['category', 'with-tags-list', { filters: { name: 'Item Type' } }]
 *   categoryKeys.create()                                // ['category', 'create']
 *   categoryKeys.update(501)                             // ['category', 'detail', 501, 'update']
 *   categoryKeys.remove(501)                             // ['category', 'detail', 501, 'remove']
 */
export const categoryKeys = {
    /**
     * The root key for all tag category queries.
     * @type {Array}
     */
    all: CATEGORY,

    /**
     * Key for all tag category lists (with/without filters/pagination).
     * @returns {Array}
     */
    lists: () => [...categoryKeys.all, 'lists'],

    /**
     * Key for a filtered tag categories list.
     * @param {object} filters
     * @returns {Array}
     */
    list: (filters = {}) => [...categoryKeys.lists(), { filters }],

    /**
     * Key for a single tag category detail by id.
     * @param {number|string} categoryId
     * @returns {Array}
     */
    detail: (categoryId) => [...categoryKeys.all, 'detail', categoryId],

    /**
     * Key for tag categories-with-tags (aggregate endpoint).
     * @returns {Array}
     */
    withTags: () => [...categoryKeys.all, 'with-tags'],

    /**
     * Key for tag categories-with-tags with filters.
     * @param {object} filters
     * @returns {Array}
     */
    withTagsList: (filters = {}) => [...categoryKeys.all, 'with-tags-list', { filters }],

    /**
     * Key for the create tag category mutation.
     * @returns {Array}
     */
    create: () => [...categoryKeys.all, 'create'],

    /**
     * Key for the update tag category mutation.
     * @param {number|string} categoryId
     * @returns {Array}
     */
    update: (categoryId) => [...categoryKeys.detail(categoryId), 'update'],

    /**
     * Key for the delete tag category mutation.
     * @param {number|string} categoryId
     * @returns {Array}
     */
    remove: (categoryId) => [...categoryKeys.detail(categoryId), 'remove'],
};