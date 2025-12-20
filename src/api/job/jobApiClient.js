import ApiClient from "../ApiClient";

/**
 * Standardized logger for JobApiClient.
 * Never logs sensitive data.
 *
 * @constant
 * @type {{info: Function, error: Function}}
 */
const logger = {
    info: (...args) => console.log("[JobApiClient]", ...args),
    error: (...args) => console.error("[JobApiClient]", ...args),
};

/**
 * Retrieves the session token from Electron main process via preload bridge.
 *
 * @async
 * @function getTokenFromElectron
 * @returns {Promise<string|null>} The authentication token, or null if unavailable.
 */
const getTokenFromElectron = async () => {
    logger.info("getTokenFromElectron called");
    if (window.electronAPI && window.electronAPI.tokenGet) {
        try {
            const { success, token } = await window.electronAPI.tokenGet();
            logger.info("getTokenFromElectron response", { success });
            return success ? token : null;
        } catch (error) {
            logger.error("getTokenFromElectron error", error);
            return null;
        }
    }
    logger.error("Electron ipc not available; token-get skipped");
    return null;
};

/**
 * JobApiClient
 * Handles API requests to job endpoints, including CRUD and filtered listings.
 *
 * Follows the same URL construction and header behavior as BuildingApiClient and StorageApiClient:
 *  - Base path: /api/jobs
 *  - No unintended trailing slashes that break Spring Boot static/resource mappings
 *  - Authorization: Bearer <token> (from Electron bridge)
 *
 * @class
 * @extends ApiClient
 */
export default class JobApiClient extends ApiClient {
    /**
     * Creates an instance of JobApiClient.
     * Uses baseURL from env API_URL unless overridden.
     *
     * @param {Object} [options={}] - Optional overrides.
     * @param {string} [options.baseURL] - Optional override for API base URL.
     * @param {number} [options.timeout=10000] - Request timeout in ms.
     */
    constructor({ baseURL, timeout = 10000 } = {}) {
        super({ baseURL, timeout, apiPath: "/api/jobs" });
        logger.info("JobApiClient initialized");
    }

    /**
     * createJob
     * Creates a new job (requires authentication).
     *
     * @async
     * @function createJob
     * @param {Object} payload - JobRequest payload { name, companyId, client, description, status, updatedBy, comments }
     * @returns {Promise<Object>} API response with JobResponse in `data`
     * @throws {Error} If validation fails, duplicate, or server error.
     */
    async createJob(payload) {
        logger.info("createJob called", { name: payload?.name });
        try {
            const token = await getTokenFromElectron();
            if (!token) {
                logger.error("createJob failed: No token available");
                throw new Error("No authentication token found");
            }

            // NOTE: Use '' endpoint (no leading slash) to avoid double-slash and trailing-slash issues.
            const response = await this.post("", payload, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            logger.info("createJob success", { jobId: response?.data?.jobId });
            return response;
        } catch (error) {
            logger.error("createJob failed", error);
            throw error;
        }
    }

    /**
     * fetchAllJobs
     * Fetches jobs with optional filters, pagination, and sorting.
     *
     * Mirrors updated "Get Jobs" endpoint:
     *   GET /api/jobs?page=1&size=5&sortField=name&sortOrder=asc&status=Active&companyId=301&client=Acme
     *
     * Supported query params (all optional):
     *   - page (Integer, 1-based, default 1)
     *   - size (Integer, default 20)
     *   - sortField (String, default "name")
     *   - sortOrder (String, "asc" | "desc", default "asc")
     *   - status (String)
     *   - companyId (Long)
     *   - client (String)
     *
     * @async
     * @function fetchAllJobs
     * @param {Object} [params={}] - Optional query params:
     *   { page, size, sortField, sortOrder, status, companyId, client, ... }
     * @returns {Promise<Object>} API response with array of JobResponse in `data` and `meta`.
     * @throws {Error} If request fails (network, 401, 500, etc).
     */
    async fetchAllJobs(params = {}) {
        logger.info("fetchAllJobs called", params);
        try {
            const token = await getTokenFromElectron();
            if (!token) {
                logger.error("fetchAllJobs failed: No token available");
                throw new Error("No authentication token found");
            }

            /**
             * CRITICAL:
             * - Use '' as the endpoint (empty string) so ApiClient._buildUrl combines apiPath
             *   correctly into '/api/jobs' WITHOUT an extra trailing slash.
             * - Passing '/' here produces '/api/jobs/' and, once query params are appended,
             *   Spring may treat it as a static resource path (/api/jobs/) instead of the
             *   controller mapping, leading to 500 "No static resource api/jobs." errors.
             *
             * This mirrors the pattern used in StorageApiClient.fetchAllStorage.
             */
            const response = await this.get("", params, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const jobsArray = Array.isArray(response?.data) ? response.data : [];
            logger.info("fetchAllJobs success", {
                count: jobsArray.length,
                meta: response?.meta,
            });
            return response;
        } catch (error) {
            logger.error("fetchAllJobs failed", error);
            throw error;
        }
    }

    /**
     * searchJobs
     * Performs a case-insensitive text search across job `name`, `description`, and `client`
     * using the /api/jobs/search endpoint.
     *
     * Mirrors updated "Search Jobs" endpoint:
     *   GET /api/jobs/search?q=Audit&page=1&size=5&sortField=name&sortOrder=asc
     *
     * Behavior:
     *  - `q` is required and must be non-blank.
     *  - Company-scoped or company-only search is NOT supported on this endpoint
     *    (use Get Jobs with companyId filter for that use case).
     *
     * @async
     * @function searchJobs
     * @param {Object} params - Search query params:
     * @param {string} params.q - Search text to match in name, description, or client (required, non-blank).
     * @param {number} [params.page] - 1-based page index (optional, default handled by API).
     * @param {number} [params.size] - Page size (optional, default handled by API).
     * @param {string} [params.sortField] - Field to sort by (optional, defaults to "name").
     * @param {"asc"|"desc"} [params.sortOrder] - Sort direction (optional, defaults to "asc").
     * @returns {Promise<Object>} API response object with:
     *   - data: Array<JobResponse>
     *   - meta: { page, size, totalRecords, totalPages, searchText, sortField, sortOrder }
     *   - status, transactionId, errors
     * @throws {Error} If token is missing, request fails, or API returns an error.
     */
    async searchJobs(params) {
        logger.info("searchJobs called", params);
        try {
            const token = await getTokenFromElectron();
            if (!token) {
                logger.error("searchJobs failed: No token available");
                throw new Error("No authentication token found");
            }

            // Use 'search' without a leading slash so final URL is '/api/jobs/search'
            const response = await this.get("search", params, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            const jobsArray = Array.isArray(response?.data) ? response.data : [];
            logger.info("searchJobs success", {
                count: jobsArray.length,
                meta: response?.meta,
            });
            return response;
        } catch (error) {
            logger.error("searchJobs failed", error);
            throw error;
        }
    }

    /**
     * fetchJobById
     * Fetches a single job by its id.
     *
     * @async
     * @function fetchJobById
     * @param {number} jobId - Job identifier
     * @returns {Promise<Object>} API response with JobResponse in `data`
     * @throws {Error} If job not found or request fails.
     */
    async fetchJobById(jobId) {
        logger.info("fetchJobById called", { jobId });
        try {
            const token = await getTokenFromElectron();
            if (!token) {
                logger.error("fetchJobById failed: No token available");
                throw new Error("No authentication token found");
            }
            const response = await this.get(`${jobId}`, {}, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            logger.info("fetchJobById success", { jobId: response?.data?.jobId });
            return response;
        } catch (error) {
            logger.error("fetchJobById failed", error);
            throw error;
        }
    }

    /**
     * updateJob
     * Updates an existing job.
     *
     * @async
     * @function updateJob
     * @param {number} jobId - Job identifier
     * @param {Object} payload - JobRequest payload for update
     * @returns {Promise<Object>} API response with updated JobResponse in `data`
     * @throws {Error} If not found, validation fails, or request fails.
     */
    async updateJob(jobId, payload) {
        logger.info("updateJob called", { jobId });
        try {
            const token = await getTokenFromElectron();
            if (!token) {
                logger.error("updateJob failed: No token available");
                throw new Error("No authentication token found");
            }
            const response = await this.put(`${jobId}`, payload, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            logger.info("updateJob success", { jobId: response?.data?.jobId });
            return response;
        } catch (error) {
            logger.error("updateJob failed", error);
            throw error;
        }
    }

    /**
     * deleteJob
     * Deletes a job by id.
     *
     * @async
     * @function deleteJob
     * @param {number} jobId - Job identifier
     * @returns {Promise<Object>} API success response (204) or throws
     * @throws {Error} If job not found or request fails.
     */
    async deleteJob(jobId) {
        logger.info("deleteJob called", { jobId });
        try {
            const token = await getTokenFromElectron();
            if (!token) {
                logger.error("deleteJob failed: No token available");
                throw new Error("No authentication token found");
            }
            const response = await this.delete(`${jobId}`, {}, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            logger.info("deleteJob success", { jobId });
            return response;
        } catch (error) {
            logger.error("deleteJob failed", error);
            throw error;
        }
    }
}