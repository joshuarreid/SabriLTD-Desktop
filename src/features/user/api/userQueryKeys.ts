/**
 * Query keys for user-related TanStack queries & mutations.
 *
 * Canonical, canonicalized shape to avoid cache bugs and ensure uniform query shape across the app.
 *
 * @see https://tanstack.com/query/latest/docs/framework/react/guides/query-keys
 */

/**
 * Top-level user query cache key.
 * @constant
 * @type {Array}
 */
export const USER = ['user'];

/**
 * Canonical user query/mutation cache keys.
 *
 * Usage examples:
 *   userKeys.lists()                       // ['user', 'lists']
 *   userKeys.list({ status: 'active' })    // ['user', 'lists', { filters: { status: 'active' } }]
 *   userKeys.detail(101)                   // ['user', 'detail', 101]
 *   userKeys.me()                          // ['user', 'me']
 *   userKeys.public()                      // ['user', 'public']
 *   userKeys.publicList({ q: 'Jane' })     // ['user', 'public-list', { filters: { q: 'Jane' } }]
 *   userKeys.create()                      // ['user', 'create']
 *   userKeys.update(101)                   // ['user', 'detail', 101, 'update']
 *   userKeys.remove(101)                   // ['user', 'detail', 101, 'remove']
 */
export const userKeys = {
    /**
     * The root key for all user queries.
     * @type {Array}
     */
    all: USER,

    /**
     * Key for all user lists (different filter, pagination variants).
     * @returns {Array}
     */
    lists: () => [...userKeys.all, 'lists'],

    /**
     * Key for a filtered user list.
     * @param {object} filters
     * @returns {Array}
     */
    list: (filters: Record<string, any> = {}) => [...userKeys.lists(), { filters }],

    /**
     * Key for a single user detail by id.
     * @param {number|string} userId
     * @returns {Array}
     */
    detail: (userId: number | string) => [...userKeys.all, 'detail', userId],

    /**
     * Key for querying the current authenticated user ("me").
     * @returns {Array}
     */
    me: () => [...userKeys.all, 'me'],

    /**
     * Key for the minimal public users collection (no auth, no filters).
     * @returns {Array}
     */
    public: () => [...userKeys.all, 'public'],

    /**
     * Key for the minimal public users collection with optional filters.
     * @param {object} filters
     * @returns {Array}
     */
    publicList: (filters: Record<string, any> = {}) => [...userKeys.all, 'public-list', { filters }],

    /**
     * Key for the create user mutation.
     * @returns {Array}
     */
    create: () => [...userKeys.all, 'create'],

    /**
     * Key for the update user mutation.
     * @param {number|string} userId
     * @returns {Array}
     */
    update: (userId: number | string) => [...userKeys.detail(userId), 'update'],

    /**
     * Key for the delete user mutation.
     * @param {number|string} userId
     * @returns {Array}
     */
    remove: (userId: number | string) => [...userKeys.detail(userId), 'remove'],
};