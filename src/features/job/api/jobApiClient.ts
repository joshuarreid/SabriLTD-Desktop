import ApiClient from '../../../api/ApiClient';
import type { Job } from "./job.types";

const logger = {
    info: (...args: unknown[]) => console.log("[JobApiClient]", ...args),
    error: (...args: unknown[]) => console.error("[JobApiClient]", ...args),
};

const getTokenFromElectron = async (): Promise<string | null> => {
    logger.info("getTokenFromElectron called");
    if (window.electronAPI && window.electronAPI.tokenGet) {
        try {
            const { success, token } = await window.electronAPI.tokenGet();
            logger.info("getTokenFromElectron response", { success });
            return success ? (token ?? null) : null;
        } catch (error) {
            logger.error("getTokenFromElectron error", error);
            return null;
        }
    }
    logger.error("Electron ipc not available; token-get skipped");
    return null;
};

interface JobApiClientOptions {
    baseURL?: string;
    timeout?: number;
}

export default class JobApiClient extends ApiClient {
    constructor({ baseURL, timeout = 10000 }: JobApiClientOptions = {}) {
        super({ baseURL, timeout, apiPath: "/api/jobs" });
        logger.info("JobApiClient initialized");
    }

    async createJob(payload: Job): Promise<any> {
        logger.info("createJob called - full payload", payload);
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
            logger.info("createJob response", response);
            return response;
        } catch (error) {
            logger.error("createJob failed", error);
            throw error;
        }
    }

    async fetchAllJobs(params: Record<string, unknown> = {}): Promise<any> {
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

    async searchJobs(params: Record<string, unknown>): Promise<any> {
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
                searchText: raw?.searchText ?? (raw as any)?.q ?? null,
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

    async fetchJobById(jobId: string): Promise<any> {
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

    async updateJob(jobId: string, payload: Job): Promise<any> {
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

    async deleteJob(jobId: string): Promise<any> {
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

    async fetchJobCompanies(): Promise<any> {
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

    async fetchJobClients(params: Record<string, unknown> = {}): Promise<any> {
        logger.info("fetchJobClients called", params);
        try {
            const token = await getTokenFromElectron();
            if (!token) {
                logger.error("fetchJobClients failed: No token available");
                throw new Error("No authentication token found");
            }
            const companyId = (params as { companyId?: string | number })?.companyId ?? null;
            const response = await this.get("/clients", params, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            logger.info("fetchJobClients success", {
                count: Array.isArray(response?.data) ? response.data.length : 0,
                companyId,
            });

            return response;
        } catch (error) {
            logger.error("fetchJobClients failed", error);
            throw error;
        }
    }

    /**
     * Update items for a job
     * @param jobId
     * @param itemIds
     * @returns {Promise<any>}
     */
    async updateJobItems(jobId: string | number, itemIds: (string | number)[]): Promise<any> {
        logger.info("updateJobItems called", { jobId, itemIds });
        try {
            const token = await getTokenFromElectron();
            if (!token) {
                logger.error("updateJobItems failed: No token available");
                throw new Error("No authentication token found");
            }
            // Adjust endpoint and payload as needed for your backend
            const response = await this.put(`${jobId}/items`, { itemIds }, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            logger.info("updateJobItems success", { jobId, itemCount: itemIds.length });
            return response;
        } catch (error) {
            logger.error("updateJobItems failed", error);
            throw error;
        }
    }
}