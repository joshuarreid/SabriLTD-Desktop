/**
 * CompanyApiClient
 * - Specialized API client for company endpoints.
 * - Mirrors the UserApiClient shape and responsibilities.
 *
 * Conventions:
 *  - Uses Electron preload bridge to retrieve token for authenticated requests.
 *  - Provides dedicated methods for CRUD and aggregate endpoints.
 *
 * @module CompanyApiClient
 */

import ApiClient from "../ApiClient";

/**
 * Standardized logger for CompanyApiClient.
 * Never logs sensitive data.
 * @constant
 */
const logger = {
    info: (...args) => console.log("[CompanyApiClient]", ...args),
    error: (...args) => console.error("[CompanyApiClient]", ...args),
};

/**
 * Retrieves the session token from Electron main process via preload bridge.
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
 * CompanyApiClient
 * Handles API requests to company endpoints, including CRUD and aggregate endpoints.
 *
 * @class
 * @extends ApiClient
 */
export default class CompanyApiClient extends ApiClient {
    /**
     * Creates an instance of CompanyApiClient.
     * Uses baseURL from env API_URL unless overridden.
     *
     * @param {Object} [options={}]
     * @param {string} [options.baseURL] - Optional override for API base URL.
     * @param {number} [options.timeout=10000] - Request timeout in ms.
     */
    constructor({ baseURL, timeout = 10000 } = {}) {
        super({ baseURL, timeout, apiPath: "/api/companies" });
        logger.info("CompanyApiClient initialized");
    }

    /**
     * Fetches a paginated/listing of companies.
     * GET /
     *
     * @async
     * @param {Object} [params] - Optional query params: { page, size, sortField, sortOrder, name, ... }
     * @returns {Promise<Object>} API response with list of companies
     * @throws {Error} If request fails
     */
    async fetchAllCompanies(params = {}) {
        logger.info("fetchAllCompanies called", { params });
        try {
            const response = await this.get("/", params);
            logger.info("fetchAllCompanies success", {
                count: Array.isArray(response?.data) ? response.data.length : 0,
            });
            return response;
        } catch (error) {
            logger.error("fetchAllCompanies failed", error);
            throw error;
        }
    }

    /**
     * Fetches a single company by ID.
     * GET /{id}
     *
     * @async
     * @param {number} companyId
     * @returns {Promise<Object>} API response with company object
     * @throws {Error} If not found or request fails
     */
    async fetchCompanyById(companyId) {
        logger.info("fetchCompanyById called", { companyId });
        try {
            const token = await getTokenFromElectron();
            if (!token) {
                logger.error("fetchCompanyById failed: No token available");
                throw new Error("No authentication token found");
            }
            const response = await this.get(`/${companyId}`, {}, {
                headers: { Authorization: `Bearer ${token}` },
            });
            logger.info("fetchCompanyById success", { companyId: response?.data?.companyId });
            return response;
        } catch (error) {
            logger.error("fetchCompanyById failed", error);
            throw error;
        }
    }

    /**
     * Creates a new company.
     * POST /
     *
     * @async
     * @param {Object} payload - { name, address, phone, website }
     * @returns {Promise<Object>} API response with created company
     * @throws {Error} If validation or request fails
     */
    async createCompany(payload) {
        logger.info("createCompany called", { name: payload?.name });
        try {
            const token = await getTokenFromElectron();
            if (!token) {
                logger.error("createCompany failed: No token available");
                throw new Error("No authentication token found");
            }
            const response = await this.post("/", payload, {
                headers: { Authorization: `Bearer ${token}` },
            });
            logger.info("createCompany success", { companyId: response?.data?.companyId });
            return response;
        } catch (error) {
            logger.error("createCompany failed", error);
            throw error;
        }
    }

    /**
     * Updates an existing company by ID.
     * PUT /{id}
     *
     * @async
     * @param {number} companyId
     * @param {Object} payload - { name, address, phone, website }
     * @returns {Promise<Object>} API response with updated company
     * @throws {Error} If not found or request fails
     */
    async updateCompany(companyId, payload) {
        logger.info("updateCompany called", { companyId });
        try {
            const token = await getTokenFromElectron();
            if (!token) {
                logger.error("updateCompany failed: No token available");
                throw new Error("No authentication token found");
            }
            const response = await this.put(`/${companyId}`, payload, {
                headers: { Authorization: `Bearer ${token}` },
            });
            logger.info("updateCompany success", { companyId: response?.data?.companyId });
            return response;
        } catch (error) {
            logger.error("updateCompany failed", error);
            throw error;
        }
    }

    /**
     * Deletes a company by ID.
     * DELETE /{id}
     *
     * @async
     * @param {number} companyId
     * @returns {Promise<Object>} API response (204 No Content) or throws
     * @throws {Error} If not found or request fails
     */
    async deleteCompany(companyId) {
        logger.info("deleteCompany called", { companyId });
        try {
            const token = await getTokenFromElectron();
            if (!token) {
                logger.error("deleteCompany failed: No token available");
                throw new Error("No authentication token found");
            }
            const response = await this.delete(`/${companyId}`, {}, {
                headers: { Authorization: `Bearer ${token}` },
            });
            logger.info("deleteCompany success", { companyId });
            return response;
        } catch (error) {
            logger.error("deleteCompany failed", error);
            throw error;
        }
    }

    /**
     * Fetches companies along with their jobs (aggregate endpoint).
     * POST /with-jobs
     *
     * @async
     * @param {Object} payload - Optional filters { nameFilter, companyId, jobStatusFilter }
     * @returns {Promise<Object>} API response with companies+jobs
     * @throws {Error} If request fails
     */
    async fetchCompaniesWithJobs(payload = {}) {
        logger.info("fetchCompaniesWithJobs called", { payload });
        try {
            const token = await getTokenFromElectron();
            if (!token) {
                logger.error("fetchCompaniesWithJobs failed: No token available");
                throw new Error("No authentication token found");
            }
            const response = await this.post("/with-jobs", payload, {
                headers: { Authorization: `Bearer ${token}` },
            });
            logger.info("fetchCompaniesWithJobs success", {
                count: Array.isArray(response?.data) ? response.data.length : 0,
            });
            return response;
        } catch (error) {
            logger.error("fetchCompaniesWithJobs failed", error);
            throw error;
        }
    }
}