import ApiClient from "../ApiClient.js";

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
 * @class
 * @extends ApiClient
 */
export default class JobApiClient extends ApiClient {
    constructor({ baseURL, timeout = 10000 } = {}) {
        super({ baseURL, timeout, apiPath: "/api/jobs" });
        logger.info("JobApiClient initialized");
    }

    async createJob(payload) {
        logger.info("createJob called", { name: payload?.name });
        try {
            const token = await getTokenFromElectron();
            if (!token) {
                logger.error("createJob failed: No token available");
                throw new Error("No authentication token found");
            }

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
     * NOTE: The backend returns a *wrapped* response, e.g.:
     * {
     *   status: "success",
     *   transactionId: "...",
     *   page: 1,
     *   size: 25,
     *   totalRecords: 33,
     *   totalPages: 2,
     *   sortField: "dateUpdated",
     *   sortOrder: "desc",
     *   data: [...]
     * }
     *
     * ApiClient.get currently returns that wrapper as `response` itself,
     * NOT in `response.data`. We normalize that here so callers (job.js)
     * always see { status, data, meta, transactionId, errors }.
     */
    async fetchAllJobs(params = {}) {
        logger.info("fetchAllJobs called", params);
        try {
            const token = await getTokenFromElectron();
            if (!token) {
                logger.error("fetchAllJobs failed: No token available");
                throw new Error("No authentication token found");
            }

            const raw = await this.get("", params, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            // If the backend already returns the wrapped shape at top level:
            const meta = {
                page: raw?.page ?? null,
                size: raw?.size ?? null,
                totalRecords: raw?.totalRecords ?? null,
                totalPages: raw?.totalPages ?? null,
                filterCriteria: raw?.filterCriteria ?? null,
                sortField: raw?.sortField ?? null,
                sortOrder: raw?.sortOrder ?? null,
                totalRelatedCount: raw?.totalRelatedCount ?? null,
            };

            const jobsArray = Array.isArray(raw?.data) ? raw.data : [];

            logger.info("fetchAllJobs success", {
                count: jobsArray.length,
                meta,
            });

            return {
                status: raw?.status,
                data: jobsArray,
                meta,
                transactionId: raw?.transactionId,
                errors: raw?.errors ?? null,
            };
        } catch (error) {
            logger.error("fetchAllJobs failed", error);
            throw error;
        }
    }

    /**
     * searchJobs
     * Same wrapper normalization as fetchAllJobs.
     */
    async searchJobs(params) {
        logger.info("searchJobs called", params);
        try {
            const token = await getTokenFromElectron();
            if (!token) {
                logger.error("searchJobs failed: No token available");
                throw new Error("No authentication token found");
            }

            const raw = await this.get("search", params, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const meta = {
                page: raw?.page ?? null,
                size: raw?.size ?? null,
                totalRecords: raw?.totalRecords ?? null,
                totalPages: raw?.totalPages ?? null,
                searchText: raw?.searchText ?? raw?.q ?? null,
                sortField: raw?.sortField ?? null,
                sortOrder: raw?.sortOrder ?? null,
            };

            const jobsArray = Array.isArray(raw?.data) ? raw.data : [];

            logger.info("searchJobs success", {
                count: jobsArray.length,
                meta,
            });

            return {
                status: raw?.status,
                data: jobsArray,
                meta,
                transactionId: raw?.transactionId,
                errors: raw?.errors ?? null,
            };
        } catch (error) {
            logger.error("searchJobs failed", error);
            throw error;
        }
    }

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

    async fetchJobCompanies() {
        logger.info("fetchJobCompanies called");
        try {
            const token = await getTokenFromElectron();
            if (!token) {
                logger.error("fetchJobCompanies failed: No token available");
                throw new Error("No authentication token found");
            }
            const response = await this.get("/companies", {}, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            logger.info("fetchJobCompanies success", {
                count: Array.isArray(response?.data) ? response.data.length : 0,
            });
            return response;
        } catch (error) {
            logger.error("fetchJobCompanies failed", error);
            throw error;
        }
    }

    async fetchJobClients(params = {}) {
        logger.info("fetchJobClients called", params);
        try {
            const token = await getTokenFromElectron();
            if (!token) {
                logger.error("fetchJobClients failed: No token available");
                throw new Error("No authentication token found");
            }

            const response = await this.get("/clients", params, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            logger.info("fetchJobClients success", {
                count: Array.isArray(response?.data) ? response.data.length : 0,
                companyId: params?.companyId ?? null,
            });

            return response;
        } catch (error) {
            logger.error("fetchJobClients failed", error);
            throw error;
        }
    }
}