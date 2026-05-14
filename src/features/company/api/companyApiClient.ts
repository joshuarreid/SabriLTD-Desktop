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

import type {
  Company,
  CompanyResponse,
  CompanyListResponse,
  CompanyWithJobsListResponse
} from "./company.types";
import ApiClient from "../../../api/ApiClient";

/**
 * Standardized logger for CompanyApiClient.
 * Never logs sensitive data.
 * @constant
 */
const logger = {
  info: (...args: any[]) => console.log("[CompanyApiClient]", ...args),
  error: (...args: any[]) => console.error("[CompanyApiClient]", ...args),
};

/**
 * Retrieves the session token from Electron main process via preload bridge.
 * Falls back to a development token in localStorage (key: DEV_API_TOKEN) when running in a browser dev environment.
 *
 * @async
 * @function getTokenFromElectron
 * @returns {Promise<string|null>} The authentication token, or null if unavailable.
 */
const getTokenFromElectron = async (): Promise<string | null> => {
  logger.info("getTokenFromElectron called");
  // Electron preload token getter (preferred)
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

  // Fallback: allow a developer token stored in localStorage for browser development.
  // DO NOT commit real production tokens to this storage. This is only a development convenience.
  try {
    const devToken = window?.localStorage?.getItem && window.localStorage.getItem("DEV_API_TOKEN");
    if (devToken) {
      logger.info("getTokenFromElectron: Using DEV_API_TOKEN from localStorage (development only)");
      return devToken;
    }
  } catch (err) {
    logger.error("getTokenFromElectron localStorage read failed", err);
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
  constructor({ baseURL, timeout = 10000 }: { baseURL?: string; timeout?: number } = {}) {
    super({ baseURL, timeout, apiPath: "/api/companies" });
    logger.info("CompanyApiClient initialized");
  }

  /**
   * Fetches a paginated/listing of companies.
   * GET /
   *
   * Note: This endpoint requires authentication in the current API. We will attach Authorization header
   * and avoid making the request if no token is available (prevents sending unauthenticated requests that
   * may produce opaque CORS failures in the browser).
   *
   * @async
   * @param {Object} [params] - Optional query params: { page, size, sortField, sortOrder, name, ... }
   * @returns {Promise<Object>} API response with list of companies
   * @throws {Error} If request fails or no token is available for authenticated endpoints
   */
  async fetchAllCompanies(params: Record<string, unknown> = {}): Promise<CompanyListResponse> {
    logger.info("fetchAllCompanies called - full payload", params);
    try {
      // Ensure we have a token before making this authenticated request
      const token = await getTokenFromElectron();
      if (!token) {
        // throw early so caller can handle; avoids sending an unauthenticated request which may result
        // in a 401 without CORS headers and therefore an opaque browser error.
        const err = new Error("No authentication token found for fetchAllCompanies");
        logger.error("fetchAllCompanies failed: no token available");
        throw err;
      }

      // Attach Authorization header for authenticated GET
      const response = await this.get("/", params, {
        headers: { Authorization: `Bearer ${token}` },
      });

      logger.info("fetchAllCompanies response", response);
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
  async fetchCompanyById(companyId: number | string): Promise<CompanyResponse> {
    logger.info("fetchCompanyById called - full payload", { companyId });
    try {
      const token = await getTokenFromElectron();
      if (!token) {
        logger.error("fetchCompanyById failed: No token available");
        throw new Error("No authentication token found");
      }
      const response = await this.get(`/${companyId}`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      logger.info("fetchCompanyById response", response);
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
  async createCompany(company: Company): Promise<CompanyResponse> {
    logger.info("createCompany called", { name: company?.name });
    const token = await getTokenFromElectron();
    if (!token) throw new Error("No authentication token found");
    try {
      const response = await this.post(`/`, company, {
        headers: { Authorization: `Bearer ${token}` },
      });
      logger.info("createCompany success", { id: response?.data?.companyId });
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
  async updateCompany(companyId: number | string, company: Company): Promise<CompanyResponse> {
    logger.info("updateCompany called", { companyId });
    const token = await getTokenFromElectron();
    if (!token) throw new Error("No authentication token found");
    try {
      const response = await this.put(`/${companyId}`, company, {
        headers: { Authorization: `Bearer ${token}` },
      });
      logger.info("updateCompany success", { companyId });
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
   * @returns {Promise<void>} API response (204 No Content) or throws
   * @throws {Error} If not found or request fails
   */
  async deleteCompany(companyId: number | string): Promise<void> {
    logger.info("deleteCompany called", { companyId });
    const token = await getTokenFromElectron();
    if (!token) throw new Error("No authentication token found");
    try {
      await this.delete(`/${companyId}`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      logger.info("deleteCompany success", { companyId });
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
  async fetchCompaniesWithJobs(params: Record<string, unknown> = {}): Promise<CompanyWithJobsListResponse> {
    logger.info("fetchCompaniesWithJobs called", { params });
    const token = await getTokenFromElectron();
    if (!token) throw new Error("No authentication token found");
    try {
      const response = await this.get(`/with-jobs`, params, {
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