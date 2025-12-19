/**
 * Query keys for Job-related TanStack queries & mutations.
 * Follows canonical key patterns to prevent cache bugs and ensure uniform query shapes.
 *
 * Pattern is aligned with buildingQueryKeys.js:
 *  - Root key: ['job']
 *  - Lists, filtered lists, detail, create, update, remove keys
 *
 * @see https://tanstack.com/query/latest/docs/framework/react/guides/query-keys
 */

/**
 * Top-level job query cache key.
 *
 * @constant
 * @type {Array}
 */
export const JOB = ["job"];

/**
 * Canonical Job query/mutation cache keys.
 *
 * Usage examples:
 *   jobKeys.lists()                           // ['job', 'lists']
 *   jobKeys.list({ status: 'Active' })        // ['job', 'lists', { filters: { status: 'Active' } }]
 *   jobKeys.detail(401)                       // ['job', 'detail', 401]
 *   jobKeys.create()                          // ['job', 'create']
 *   jobKeys.update(401)                       // ['job', 'detail', 401, 'update']
 *   jobKeys.remove(401)                       // ['job', 'detail', 401, 'remove']
 *
 * These keys are used across:
 *  - useQuery (for fetching jobs and job details)
 *  - useMutation (for create/update/delete)
 *  - QueryClient.invalidateQueries / setQueryData
 *
 * Keeping the shape canonical prevents subtle cache bugs.
 */
export const jobKeys = {
    /**
     * The root key for all job queries.
     *
     * @type {Array}
     */
    all: JOB,

    /**
     * Key for all job lists (with/without filters/pagination).
     * Typically used for general jobs collection queries.
     *
     * @function
     * @returns {Array} React Query key for jobs lists root
     */
    lists: () => [...jobKeys.all, "lists"],

    /**
     * Key for a filtered jobs list.
     * Use this to scope cache entries by filter params (status, companyId, pagination, etc.).
     *
     * @function
     * @param {object} [filters={}] - Arbitrary filters object, e.g. { status: 'Active', companyId: 301 }
     * @returns {Array} React Query key including filters
     */
    list: (filters = {}) => [...jobKeys.lists(), { filters }],

    /**
     * Key for a single job detail by id.
     * Use for job detail queries and as a base for update/remove mutation keys.
     *
     * @function
     * @param {number|string} jobId - Unique job identifier
     * @returns {Array} React Query key for a specific job detail
     */
    detail: (jobId) => [...jobKeys.all, "detail", jobId],

    /**
     * Key for the create job mutation.
     * Can be used with setMutationDefaults or for analytics.
     *
     * @function
     * @returns {Array} React Query key for create-job mutation
     */
    create: () => [...jobKeys.all, "create"],

    /**
     * Key for the update job mutation scoped by jobId.
     * Useful for invalidating or grouping updates for a single job.
     *
     * @function
     * @param {number|string} jobId - Unique job identifier
     * @returns {Array} React Query key for update-job mutation
     */
    update: (jobId) => [...jobKeys.detail(jobId), "update"],

    /**
     * Key for the delete job mutation scoped by jobId.
     * Useful for invalidating or tracking deletes for a single job.
     *
     * @function
     * @param {number|string} jobId - Unique job identifier
     * @returns {Array} React Query key for delete-job mutation
     */
    remove: (jobId) => [...jobKeys.detail(jobId), "remove"],
};