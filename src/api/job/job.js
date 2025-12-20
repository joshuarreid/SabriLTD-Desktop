import JobApiClient from "./jobApiClient";

/**
 * Singleton instance of JobApiClient.
 */
const apiClient = new JobApiClient();

/**
 * Job module logger (standardized).
 */
const logger = {
    info: (...args) => console.log("[job]", ...args),
    error: (...args) => console.error("[job]", ...args),
};

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
 * Now relies on JobApiClient.fetchAllJobs returning
 * { status, data, meta, transactionId, errors }.
 */
export async function getAllJobs(params = {}) {
    logger.info("getAllJobs called", params);
    try {
        const response = await apiClient.fetchAllJobs(params);

        logger.info("getAllJobs normalized response", {
            dataCount: Array.isArray(response?.data) ? response.data.length : 0,
            meta: response?.meta,
        });

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
 * Uses JobApiClient.searchJobs which already normalizes meta.
 */
export async function searchJobs(params) {
    logger.info("searchJobs called", params);
    try {
        const response = await apiClient.searchJobs(params);

        logger.info("searchJobs normalized response", {
            dataCount: Array.isArray(response?.data) ? response.data.length : 0,
            meta: response?.meta,
        });

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

export async function deleteJob(jobId) {
    logger.info("deleteJob called", { jobId });
    try {
        await apiClient.deleteJob(jobId);
    } catch (error) {
        logger.error("deleteJob failed", error);
        throw error;
    }
}

export async function getJobCompanies() {
    logger.info("getJobCompanies called");
    try {
        const response = await apiClient.fetchJobCompanies();
        return response?.data || [];
    } catch (error) {
        logger.error("getJobCompanies failed", error);
        throw error;
    }
}

export async function getJobClients(params = {}) {
    logger.info("getJobClients called", params);
    try {
        const response = await apiClient.fetchJobClients(params);
        return response?.data || [];
    } catch (error) {
        logger.error("getJobClients failed", error);
        throw error;
    }
}