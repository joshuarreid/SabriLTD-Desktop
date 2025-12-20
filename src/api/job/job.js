import JobApiClient from "./jobApiClient";

/**
 * Singleton instance of JobApiClient.
 * Ensures all job API requests are routed through a preconfigured client.
 *
 * @constant
 * @type {JobApiClient}
 */
const apiClient = new JobApiClient();

/**
 * Job module logger (standardized).
 *
 * @constant
 * @type {{info: Function, error: Function}}
 */
const logger = {
    info: (...args) => console.log("[job]", ...args),
    error: (...args) => console.error("[job]", ...args),
};

/**
 * createJob
 * Creates a new job (requires authentication).
 *
 * Mirrors the "Create Job" endpoint: POST /api/jobs
 *
 * @async
 * @function createJob
 * @param {{
 *   name: string,
 *   companyId: number,
 *   client?: string,
 *   description?: string,
 *   status?: string,
 *   updatedBy?: number,
 *   comments?: string
 * }} job - JobRequest payload
 * @returns {Promise<{
 *   jobId: number,
 *   name: string,
 *   companyId: number,
 *   client: string|null,
 *   description: string|null,
 *   status: string|null,
 *   updatedBy: number|null,
 *   dateAdded: string,
 *   dateUpdated: string|null,
 *   comments: string|null
 * }|null>} JobResponse object or null
 * @throws {Error} If the request fails: duplicate, invalid, or server error.
 */
export async function createJob(job) {
    logger.info("createJob called", { name: job?.name });
    try {
        const response = await apiClient.createJob(job);
        return response?.data || null;
    } catch (error) {
        logger.error("createJob failed", error);
        throw error;
    }
}

/**
 * getAllJobs
 * Fetches jobs with optional filters, pagination, and sorting.
 *
 * Mirrors updated "Get Jobs" endpoint:
 *   GET /api/jobs?page=1&size=5&sortField=name&sortOrder=asc&status=Active&companyId=301&client=Acme
 *
 * @async
 * @function getAllJobs
 * @param {Object} [params={}] - Optional query params:
 *   { page, size, sortField, sortOrder, status, companyId, client, ... }
 * @returns {Promise<{
 *   status?: string,
 *   data: Array<{
 *     jobId: number,
 *     name: string,
 *     companyId: number,
 *     client: string|null,
 *     description: string|null,
 *     status: string|null,
 *     updatedBy: number|null,
 *     dateAdded: string,
 *     dateUpdated: string|null,
 *     comments: string|null
 *   }>,
 *   meta?: {
 *     page: number,
 *     size: number,
 *     totalRecords: number,
 *     totalPages: number,
 *     filterCriteria?: Record<string, any>,
 *     sortField?: string,
 *     sortOrder?: string,
 *     totalRelatedCount?: number
 *   },
 *   transactionId?: string,
 *   errors?: Array<any>|null
 * }>} Raw list response ({ status, data, meta, transactionId, errors }).
 * @throws {Error} If request fails (network, 401, 500, etc).
 */
export async function getAllJobs(params = {}) {
    logger.info("getAllJobs called", params);
    try {
        const response = await apiClient.fetchAllJobs(params);
        return {
            status: response?.status,
            data: response?.data || [],
            meta: response?.meta,
            transactionId: response?.transactionId,
            errors: response?.errors ?? null,
        };
    } catch (error) {
        logger.error("getAllJobs failed", error);
        throw error;
    }
}

/**
 * searchJobs
 * Performs a case-insensitive text search across job name, description and client.
 *
 * Mirrors updated "Search Jobs" endpoint:
 *   GET /api/jobs/search?q=Audit&page=1&size=5&sortField=name&sortOrder=asc
 *
 * NOTE:
 *  - `q` is required and must be non-blank.
 *  - Company-scoped searches are NOT supported on this endpoint.
 *
 * @async
 * @function searchJobs
 * @param {{
 *   q: string,
 *   page?: number,
 *   size?: number,
 *   sortField?: string,
 *   sortOrder?: 'asc'|'desc'
 * }} params - Search query parameters.
 * @returns {Promise<{
 *   status?: string,
 *   data: Array<{
 *     jobId: number,
 *     name: string,
 *     companyId: number,
 *     client: string|null,
 *     description: string|null,
 *     status: string|null,
 *     updatedBy: number|null,
 *     dateAdded: string,
 *     dateUpdated: string|null,
 *     comments: string|null
 *   }>,
 *   meta?: {
 *     page: number,
 *     size: number,
 *     totalRecords: number,
 *     totalPages: number,
 *     searchText?: string,
 *     sortField?: string,
 *     sortOrder?: string
 *   },
 *   transactionId?: string,
 *   errors?: Array<any>|null
 * }>} Raw search response ({ status, data, meta, transactionId, errors }).
 * @throws {Error} If the request fails or search text is invalid.
 */
export async function searchJobs(params) {
    logger.info("searchJobs called", params);
    try {
        const response = await apiClient.searchJobs(params);
        // Pass through the full response so callers can use both data and meta.
        return {
            status: response?.status,
            data: response?.data || [],
            meta: response?.meta,
            transactionId: response?.transactionId,
            errors: response?.errors ?? null,
        };
    } catch (error) {
        logger.error("searchJobs failed", error);
        throw error;
    }
}

/**
 * getJobById
 * Fetches a job by id (requires authentication).
 *
 * Mirrors "Get Job by ID" endpoint: GET /api/jobs/{id}
 *
 * @async
 * @function getJobById
 * @param {number} jobId - Job identifier to fetch.
 * @returns {Promise<{
 *   jobId: number,
 *   name: string,
 *   companyId: number,
 *   client: string|null,
 *   description: string|null,
 *   status: string|null,
 *   updatedBy: number|null,
 *   dateAdded: string,
 *   dateUpdated: string|null,
 *   comments: string|null
 * }|null>} JobResponse object or null
 * @throws {Error} If job not found or request fails.
 */
export async function getJobById(jobId) {
    logger.info("getJobById called", { jobId });
    try {
        const response = await apiClient.fetchJobById(jobId);
        return response?.data || null;
    } catch (error) {
        logger.error("getJobById failed", error);
        throw error;
    }
}

/**
 * updateJob
 * Updates an existing job by id (requires authentication).
 *
 * Mirrors "Update Job" endpoint: PUT /api/jobs/{id}
 *
 * @async
 * @function updateJob
 * @param {number} jobId - Job identifier to update.
 * @param {{
 *   name: string,
 *   companyId: number,
 *   client?: string,
 *   description?: string,
 *   status?: string,
 *   updatedBy?: number,
 *   comments?: string
 * }} job - JobRequest payload
 * @returns {Promise<{
 *   jobId: number,
 *   name: string,
 *   companyId: number,
 *   client: string|null,
 *   description: string|null,
 *   status: string|null,
 *   updatedBy: number|null,
 *   dateAdded: string,
 *   dateUpdated: string|null,
 *   comments: string|null
 * }|null>} Updated JobResponse object or null
 * @throws {Error} If not found, validation fails, or request fails.
 */
export async function updateJob(jobId, job) {
    logger.info("updateJob called", { jobId });
    try {
        const response = await apiClient.updateJob(jobId, job);
        return response?.data || null;
    } catch (error) {
        logger.error("updateJob failed", error);
        throw error;
    }
}

/**
 * deleteJob
 * Deletes a job by id (requires authentication).
 *
 * Mirrors "Delete Job" endpoint: DELETE /api/jobs/{id}
 *
 * @async
 * @function deleteJob
 * @param {number} jobId - The job id to delete.
 * @returns {Promise<void>} Resolves on success or throws if failed.
 * @throws {Error} If job is not found or request fails.
 */
export async function deleteJob(jobId) {
    logger.info("deleteJob called", { jobId });
    try {
        await apiClient.deleteJob(jobId);
    } catch (error) {
        logger.error("deleteJob failed", error);
        throw error;
    }
}