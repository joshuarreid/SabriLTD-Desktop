/**
 * Query keys for Job-related TanStack queries & mutations.
 * Follows canonical key patterns to prevent cache bugs and ensure uniform query shapes.
 *
 * Pattern is aligned with buildingQueryKeys.ts:
 *  - Root key: ['job']
 *  - Lists, filtered lists, search, clients, companies, detail, create, update, remove keys
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
 *   jobKeys.lists()                                   // ['job', 'lists']
 *   jobKeys.list({ status: 'Active' })                // ['job', 'lists', { filters: { status: 'Active' } }]
 *   jobKeys.search({ q: 'Audit' })                    // ['job', 'search', { searchParams: { q: 'Audit' } }]
 *   jobKeys.clients()                                 // ['job', 'clients']
 *   jobKeys.clientsList({ companyId: 301 })           // ['job', 'clients', { filters: { companyId: 301 } }]
 *   jobKeys.companies()                               // ['job', 'companies']
 *   jobKeys.detail(401)                               // ['job', 'detail', 401]
 *   jobKeys.create()                                  // ['job', 'create']
 *   jobKeys.update(401)                               // ['job', 'detail', 401, 'update']
 *   jobKeys.remove(401)                               // ['job', 'detail', 401, 'remove']
 *
 * These keys are used across:
 *  - useQuery (for fetching jobs, job search, clients, and companies)
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
     * Key for a server-side job search.
     * Use this for /api/jobs/search queries, scoped by search params.
     *
     * @function
     * @param {object} [searchParams={}] - Search params, e.g. { q: 'Audit', page: 1, size: 20 }
     * @returns {Array} React Query key including search params
     */
    search: (searchParams = {}) => [...jobKeys.all, "search", { searchParams }],

    /**
     * Key for the unique clients list (GET /api/jobs/clients).
     * Use this when fetching the de-duplicated client pick list.
     *
     * NOTE:
     * - When scoping by companyId, prefer jobKeys.clientsList({ companyId })
     *   so the cache key encodes the companyId filter explicitly.
     *
     * @function
     * @returns {Array} React Query key for unique clients (unscoped)
     */
    clients: () => [...jobKeys.all, "clients"],

    /**
     * Key for a clients list scoped by optional filters.
     * Example: jobKeys.clientsList({ companyId: 301 })
     *
     * This is intended for the updated "Get Unique Clients" endpoint:
     *   GET /api/jobs/clients?companyId=301
     *
     * @function
     * @param {object} [filters={}] - Optional filters to scope the clients key,
     *   e.g. { companyId: 301 }.
     * @returns {Array} React Query key for clients list with filters encoded
     */
    clientsList: (filters = {}) => [...jobKeys.clients(), { filters }],

    /**
     * Key for the unique companies list (GET /api/jobs/companies).
     * Use this when fetching the de-duplicated company pick list.
     *
     * @function
     * @returns {Array} React Query key for unique companies
     */
    companies: () => [...jobKeys.all, "companies"],

    /**
     * Key for a companies list scoped by optional filters.
     *
     * @function
     * @param {object} [filters={}] - Optional filters to scope the companies key.
     * @returns {Array} React Query key for companies list
     */
    companiesList: (filters = {}) => [...jobKeys.companies(), { filters }],

    /**
     * Key for a single job detail by id.
     * Use for job detail queries and as a base for update/remove mutation keys.
     *
     * @function
     * @param {number|string} jobId - Unique job identifier
     * @returns {Array} React Query key for a specific job detail
     */
    detail: (jobId: number | string): (string | number)[] => [...jobKeys.all, "detail", jobId],

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
    update: (jobId: number | string): (string | number)[] => [...jobKeys.detail(jobId), "update"],

    /**
     * Key for the delete job mutation scoped by jobId.
     * Useful for invalidating or tracking deletes for a single job.
     *
     * @function
     * @param {number|string} jobId - Unique job identifier
     * @returns {Array} React Query key for delete-job mutation
     */
    remove: (jobId: number | string): (string | number)[] => [...jobKeys.detail(jobId), "remove"],
};