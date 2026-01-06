/**
 * Query keys for Photo-related TanStack queries & mutations.
 * Follows canonical key patterns to prevent cache bugs and ensure uniform query shapes.
 *
 * Pattern is aligned with jobQueryKeys.js:
 *  - Root key: ['photo']
 *  - Lists, filtered lists, detail, upload, update, remove keys
 *
 * Usage examples:
 *   photoKeys.lists()                                   // ['photo', 'lists']
 *   photoKeys.list({ itemId: 1001 })                    // ['photo', 'lists', { filters: { itemId: 1001 } }]
 *   photoKeys.detail(2001)                              // ['photo', 'detail', 2001]
 *   photoKeys.upload()                                  // ['photo', 'upload']
 *   photoKeys.update(2001)                              // ['photo', 'detail', 2001, 'update']
 *   photoKeys.remove(2001)                              // ['photo', 'detail', 2001, 'remove']
 *
 * These keys are used for:
 *  - useQuery (for fetching photo lists/byId)
 *  - useMutation (for upload/update/delete)
 *  - QueryClient.invalidateQueries / setQueryData
 *
 * Keeping the shape canonical prevents subtle cache bugs.
 */
export const PHOTO = ["photo"];

export const photoKeys = {
    /**
     * The root key for all photo queries.
     *
     * @type {Array}
     */
    all: PHOTO,

    /**
     * Key for all photo lists (with/without filters/pagination).
     *
     * @function
     * @returns {Array} React Query key for photo lists root
     */
    lists: () => [...photoKeys.all, "lists"],

    /**
     * Key for a filtered photo list.
     * Use to scope cache entries by filter params (itemId, updatedBy, etc.).
     *
     * @function
     * @param {object} [filters={}] - Arbitrary filters object (e.g., { itemId: 1001, updatedBy: 55 })
     * @returns {Array}
     */
    list: (filters = {}) => [...photoKeys.lists(), { filters }],

    /**
     * Key for a single photo detail by id.
     * Use for detail queries and as a base for update/remove.
     *
     * @function
     * @param {number|string} photoId
     * @returns {Array}
     */
    detail: (photoId) => [...photoKeys.all, "detail", photoId],

    /**
     * Key for upload photo mutation.
     *
     * @function
     * @returns {Array}
     */
    upload: () => [...photoKeys.all, "upload"],

    /**
     * Key for update photo mutation scoped by photoId.
     * Useful for invalidating or grouping updates.
     *
     * @function
     * @param {number|string} photoId
     * @returns {Array}
     */
    update: (photoId) => [...photoKeys.detail(photoId), "update"],

    /**
     * Key for delete photo mutation scoped by photoId.
     * Useful for invalidating or tracking deletes.
     *
     * @function
     * @param {number|string} photoId
     * @returns {Array}
     */
    remove: (photoId) => [...photoKeys.detail(photoId), "remove"],
};