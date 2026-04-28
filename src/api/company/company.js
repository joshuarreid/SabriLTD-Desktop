/**
 * Company module (API helpers)
 *
 * Mirrors the shape and behavior of user.js: exposes a singleton client
 * and named functions for each Company API endpoint used by the UI and hooks.
 *
 * All functions throw when the underlying request fails so callers can handle errors.
 */

import CompanyApiClient from "./companyApiClient.js";

/**
 * Singleton CompanyApiClient instance.
 * @constant
 */
const apiClient = new CompanyApiClient();

/**
 * Standardized logger for company module.
 * @constant
 */
const logger = {
    info: (...args) => console.log("[company]", ...args),
    error: (...args) => console.error("[company]", ...args),
};

/**
 * getAllCompanies
 * Fetches companies list (paginated / filtered).
 *
 * @async
 * @param {Object} [params] - Optional query params { page, size, sortField, sortOrder, name }
 * @returns {Promise<Array>} Array of company objects
 * @throws {Error} If request fails
 */
export async function getAllCompanies(params = {}) {
    logger.info("getAllCompanies called", { params });
    try {
        const response = await apiClient.fetchAllCompanies(params);
        return response?.data || [];
    } catch (error) {
        logger.error("getAllCompanies failed", error);
        throw error;
    }
}

/**
 * getCompanyById
 * Fetches a company by ID.
 *
 * @async
 * @param {number} companyId
 * @returns {Promise<Object|null>} Company object or null
 * @throws {Error} If request fails
 */
export async function getCompanyById(companyId) {
    logger.info("getCompanyById called", { companyId });
    try {
        const response = await apiClient.fetchCompanyById(companyId);
        return response?.data || null;
    } catch (error) {
        logger.error("getCompanyById failed", error);
        throw error;
    }
}

/**
 * createCompany
 * Creates a new company.
 *
 * @async
 * @param {Object} company - { name, address, phone, website }
 * @returns {Promise<Object>} Created company object
 * @throws {Error} If creation fails
 */
export async function createCompany(company) {
    logger.info("createCompany called", { name: company?.name });
    try {
        const response = await apiClient.createCompany(company);
        return response?.data || null;
    } catch (error) {
        logger.error("createCompany failed", error);
        throw error;
    }
}

/**
 * updateCompany
 * Updates an existing company by ID.
 *
 * @async
 * @param {number} companyId
 * @param {Object} company - { name, address, phone, website }
 * @returns {Promise<Object>} Updated company object
 * @throws {Error} If update fails
 */
export async function updateCompany(companyId, company) {
    logger.info("updateCompany called", { companyId });
    try {
        const response = await apiClient.updateCompany(companyId, company);
        return response?.data || null;
    } catch (error) {
        logger.error("updateCompany failed", error);
        throw error;
    }
}

/**
 * deleteCompany
 * Deletes a company by ID.
 *
 * @async
 * @param {number} companyId
 * @returns {Promise<void>}
 * @throws {Error} If delete fails
 */
export async function deleteCompany(companyId) {
    logger.info("deleteCompany called", { companyId });
    try {
        await apiClient.deleteCompany(companyId);
    } catch (error) {
        logger.error("deleteCompany failed", error);
        throw error;
    }
}

/**
 * getCompaniesWithJobs
 * Aggregate endpoint: returns companies with their jobs.
 *
 * @async
 * @param {Object} [filters] - { nameFilter, companyId, jobStatusFilter }
 * @returns {Promise<Array>} Array of companies with jobs
 * @throws {Error} If request fails
 */
export async function getCompaniesWithJobs(filters = {}) {
    logger.info("getCompaniesWithJobs called", { filters });
    try {
        const response = await apiClient.fetchCompaniesWithJobs(filters);
        return response?.data || [];
    } catch (error) {
        logger.error("getCompaniesWithJobs failed", error);
        throw error;
    }
}