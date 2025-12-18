/**
 * Query keys for Company-related TanStack queries & mutations.
 *
 * Follows the same shape as userQueryKeys so cache invalidation is consistent across features.
 */

/**
 * Top-level company query cache key.
 * @constant
 * @type {Array}
 */
export const COMPANY = ["company"];

/**
 * Canonical Company query/mutation cache keys.
 */
export const companyKeys = {
    /**
     * Root key
     */
    all: COMPANY,

    /**
     * Lists root
     */
    lists: () => [...companyKeys.all, "lists"],

    /**
     * Filtered list key
     * @param {object} filters
     */
    list: (filters = {}) => [...companyKeys.lists(), { filters }],

    /**
     * Single company detail
     * @param {number|string} companyId
     */
    detail: (companyId) => [...companyKeys.all, "detail", companyId],

    /**
     * Aggregate companies-with-jobs key
     * @param {object} params
     */
    withJobs: (params = {}) => [...companyKeys.all, "with-jobs", { params }],

    /**
     * Create mutation key
     */
    create: () => [...companyKeys.all, "create"],

    /**
     * Update mutation key
     * @param {number|string} companyId
     */
    update: (companyId) => [...companyKeys.detail(companyId), "update"],

    /**
     * Remove mutation key
     * @param {number|string} companyId
     */
    remove: (companyId) => [...companyKeys.detail(companyId), "remove"],
};