/**
 * Query keys for Building-related TanStack queries & mutations.
 * Follows canonical key patterns to prevent cache bugs and ensure uniform query shapes.
 *
 * @see https://tanstack.com/query/latest/docs/framework/react/guides/query-keys
 */

/**
 * Top-level building query cache key.
 * @constant
 * @type {Array}
 */
export const BUILDING = ['building'];

/**
 * Canonical Building query/mutation cache keys.
 *
 * Usage examples:
 *   buildingKeys.lists()                             // ['building', 'lists']
 *   buildingKeys.list({ sortField, name })           // ['building', 'lists', { filters: { sortField, name } }]
 *   buildingKeys.detail(501)                         // ['building', 'detail', 501]
 *   buildingKeys.withStorage()                       // ['building', 'with-storage']
 *   buildingKeys.withStorageList({ name: 'HQ' })     // ['building', 'with-storage-list', { filters: { name: 'HQ' } }]
 *   buildingKeys.create()                            // ['building', 'create']
 *   buildingKeys.update(501)                         // ['building', 'detail', 501, 'update']
 *   buildingKeys.remove(501)                         // ['building', 'detail', 501, 'remove']
 */
export const buildingKeys = {
    /**
     * The root key for all building queries.
     * @type {Array}
     */
    all: BUILDING,

    /**
     * Key for all building lists (with/without filters/pagination).
     * @returns {Array}
     */
    lists: () => [...buildingKeys.all, 'lists'],

    /**
     * Key for a filtered buildings list.
     * @param {object} filters
     * @returns {Array}
     */
    list: (filters = {}) => [...buildingKeys.lists(), { filters }],

    /**
     * Key for a single building detail by id.
     * @param {number|string} buildingId
     * @returns {Array}
     */
    detail: (buildingId) => [...buildingKeys.all, 'detail', buildingId],

    /**
     * Key for buildings-with-storage (aggregate endpoint).
     * @returns {Array}
     */
    withStorage: () => [...buildingKeys.all, 'with-storage'],

    /**
     * Key for buildings-with-storage with filters.
     * @param {object} filters
     * @returns {Array}
     */
    withStorageList: (filters = {}) => [...buildingKeys.all, 'with-storage-list', { filters }],

    /**
     * Key for the create building mutation.
     * @returns {Array}
     */
    create: () => [...buildingKeys.all, 'create'],

    /**
     * Key for the update building mutation.
     * @param {number|string} buildingId
     * @returns {Array}
     */
    update: (buildingId) => [...buildingKeys.detail(buildingId), 'update'],

    /**
     * Key for the delete building mutation.
     * @param {number|string} buildingId
     * @returns {Array}
     */
    remove: (buildingId) => [...buildingKeys.detail(buildingId), 'remove'],
};