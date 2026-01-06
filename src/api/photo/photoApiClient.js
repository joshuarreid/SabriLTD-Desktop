import ApiClient from "../ApiClient";

/**
 * Standardized logger for PhotoApiClient.
 * Never logs sensitive data.
 */
const logger = {
    info: (...args) => console.log("[PhotoApiClient]", ...args),
    error: (...args) => console.error("[PhotoApiClient]", ...args),
};

/**
 * Retrieves the session token from Electron main process via preload bridge.
 * @returns {Promise<string|null>}
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
 * PhotoApiClient
 * Handles API requests for upload, fetch, get, delete photo endpoints.
 */
export default class PhotoApiClient extends ApiClient {
    constructor({ baseURL, timeout = 10000 } = {}) {
        super({ baseURL, timeout, apiPath: "/api/photos" });
        logger.info("PhotoApiClient initialized");
    }

    /**
     * Uploads a photo (multipart/form-data).
     * @param {Object} fields { photoFile: File, itemId?: number, updatedBy: number }
     * @returns {Object}
     */
    async uploadPhoto(fields) {
        logger.info("uploadPhoto called", {
            itemId: fields?.itemId,
            updatedBy: fields?.updatedBy,
            hasFile: !!fields?.photoFile,
        });
        try {
            const token = await getTokenFromElectron();
            if (!token) {
                logger.error("uploadPhoto failed: No token available");
                throw new Error("No authentication token found");
            }
            if (!fields?.photoFile || !fields?.updatedBy) {
                logger.error("uploadPhoto validation failed: missing photoFile or updatedBy");
                throw new Error("Missing required fields for photo upload");
            }

            const formData = new FormData();
            formData.append("photoFile", fields.photoFile);
            formData.append("updatedBy", fields.updatedBy);
            if (fields.itemId) formData.append("itemId", fields.itemId);

            const response = await this.postMultipart("", formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            logger.info("uploadPhoto success", { photoId: response?.data?.photoId });
            return response;
        } catch (error) {
            logger.error("uploadPhoto failed", error);
            throw error;
        }
    }

    /**
     * Fetches all photos.
     * @returns {Object}
     */
    async fetchAllPhotos() {
        logger.info("fetchAllPhotos called");
        try {
            const token = await getTokenFromElectron();
            if (!token) {
                logger.error("fetchAllPhotos failed: No token available");
                throw new Error("No authentication token found");
            }
            const response = await this.get("", {}, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            logger.info("fetchAllPhotos success", {
                count: Array.isArray(response?.data) ? response.data.length : 0,
            });
            return response;
        } catch (error) {
            logger.error("fetchAllPhotos failed", error);
            throw error;
        }
    }

    /**
     * Fetches pending photos (itemId is null).
     * @returns {Object}
     */
    async fetchPendingPhotos() {
        logger.info("fetchPendingPhotos called");
        try {
            const token = await getTokenFromElectron();
            if (!token) {
                logger.error("fetchPendingPhotos failed: No token available");
                throw new Error("No authentication token found");
            }
            const response = await this.get("pending", {}, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            logger.info("fetchPendingPhotos success", {
                count: Array.isArray(response?.data) ? response.data.length : 0,
            });
            return response;
        } catch (error) {
            logger.error("fetchPendingPhotos failed", error);
            throw error;
        }
    }

    /**
     * Fetches a photo by its ID.
     * @param {number} photoId
     * @returns {Object}
     */
    async fetchPhotoById(photoId) {
        logger.info("fetchPhotoById called", { photoId });
        try {
            const token = await getTokenFromElectron();
            if (!token) {
                logger.error("fetchPhotoById failed: No token available");
                throw new Error("No authentication token found");
            }
            const response = await this.get(`${photoId}`, {}, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            logger.info("fetchPhotoById success", { found: !!response?.data, photoId: response?.data?.photoId });
            return response;
        } catch (error) {
            logger.error("fetchPhotoById failed", error);
            throw error;
        }
    }

    /**
     * Deletes a photo by its ID.
     * @param {number} photoId
     * @returns {void}
     */
    async deletePhoto(photoId) {
        logger.info("deletePhoto called", { photoId });
        try {
            const token = await getTokenFromElectron();
            if (!token) {
                logger.error("deletePhoto failed: No token available");
                throw new Error("No authentication token found");
            }
            await this.delete(`${photoId}`, {}, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            logger.info("deletePhoto success", { photoId });
        } catch (error) {
            logger.error("deletePhoto failed", error);
            throw error;
        }
    }
}