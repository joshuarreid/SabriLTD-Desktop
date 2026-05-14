import ApiClient from "../../../api/ApiClient";
import { PhotoResponse, PhotoListResponse, UploadPhotoFields } from "./photo.types";

/**
 * Standardized logger for PhotoApiClient.
 * Never logs sensitive data.
 */
const logger = {
    info: (...args: any[]) => console.log("[PhotoApiClient]", ...args),
    error: (...args: any[]) => console.error("[PhotoApiClient]", ...args),
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
    constructor({ baseURL, timeout = 10000 }: { baseURL?: string; timeout?: number } = {}) {
        super({ baseURL, timeout, apiPath: "/api/photos" });
        logger.info("PhotoApiClient initialized");
    }


    /**
     * Uploads photos (multipart/form-data).
     * @param {Object} fields { photoFiles: File[], itemId?: number, updatedBy: number }
     * @returns {Object}
     */
    async uploadPhoto(fields: UploadPhotoFields): Promise<PhotoResponse> {
        logger.info("uploadPhoto called - full payload", fields);
        try {
            const token = await getTokenFromElectron();
            if (!token) {
                logger.error("uploadPhoto failed: No token available");
                throw new Error("No authentication token found");
            }
            if (!fields?.photoFiles || !fields?.updatedBy || !Array.isArray(fields.photoFiles) || fields.photoFiles.length === 0) {
                logger.error("uploadPhoto validation failed: missing photoFiles or updatedBy");
                throw new Error("Missing required input fields for photo upload");
            }

            const formData = new FormData();
            fields.photoFiles.forEach((file) => {
                formData.append("photoFiles", file); // backend should expect 'photoFiles' as array
            });
            formData.append("updatedBy", fields.updatedBy);
            if (fields.itemId) formData.append("itemId", fields.itemId);

            const response = await this.postMultipart("", formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            logger.info("uploadPhoto response", response);
            return response as PhotoResponse;
        } catch (error) {
            logger.error("uploadPhoto failed", error);
            throw error;
        }
    }

    /**
     * Fetches all photos.
     * @returns {Object}
     */
    async fetchAllPhotos(): Promise<PhotoListResponse> {
        logger.info("fetchAllPhotos called - full payload", {});
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
            logger.info("fetchAllPhotos response", response);
            return response as PhotoListResponse;
        } catch (error) {
            logger.error("fetchAllPhotos failed", error);
            throw error;
        }
    }

    /**
     * Fetches pending photos (itemId is null).
     * @returns {Object}
     */
    async fetchPendingPhotos(): Promise<PhotoListResponse> {
        logger.info("fetchPendingPhotos called - full payload", {});
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
            logger.info("fetchPendingPhotos response", response);
            return response as PhotoListResponse;
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
    async fetchPhotoById(photoId: number): Promise<PhotoResponse> {
        logger.info("fetchPhotoById called - full payload", { photoId });
        try {
            const token = await getTokenFromElectron();
            if (!token) {
                logger.error("fetchPhotoById failed: No token available");
                throw new Error("No authentication token found");
            }
            const response = await this.get(`/${photoId}`, {}, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            logger.info("fetchPhotoById response", response);
            return response as PhotoResponse;
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
    async deletePhoto(photoId: number): Promise<void> {
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