/**
 * JobApiClient
 * - Specialized API client for Job endpoints.
 * - Mirrors the BuildingApiClient/UserApiClient patterns for CRUD operations.
 *
 * Responsibilities:
 *  - CRUD calls to /api/jobs
 *  - Proper token attachment via Electron preload bridge
 *  - Consistent logging and error normalization via ApiClient base class
 *
 * @module JobApiClient
 */

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
 * Follows the same URL construction and header behavior as BuildingApiClient:
 *  - Base path: /api/jobs
 *  - No trailing slashes beyond what ApiClient.get/post/put/delete manage
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
            // NOTE: Use '/' endpoint (same as BuildingApiClient) to avoid CORS / path issues.
            const response = await this.post("/", payload, {
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
     * Mirrors "Get Jobs" endpoint: GET /api/jobs?page=&size=&sortField=&sortOrder=&status=...
     *
     * @async
     * @param {Object} [params={}] - Optional query params: { page, size, sortField, sortOrder, status, ... }
     * @returns {Promise<Object>} API response with array of JobResponse in `data`
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
            const response = await this.get("/", params, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            logger.info("fetchAllJobs success", {
                count: Array.isArray(response?.data) ? response.data.length : 0,
            });
            return response;
        } catch (error) {
            logger.error("fetchAllJobs failed", error);
            throw error;
        }
    }

    /**
     * fetchJobById
     * Fetches a single job by its id.
     *
     * @async
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
            const response = await this.get(`/${jobId}`, {}, {
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
            const response = await this.put(`/${jobId}`, payload, {
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
            const response = await this.delete(`/${jobId}`, {}, {
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