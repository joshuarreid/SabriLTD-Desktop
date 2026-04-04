import PhotoApiClient from "./photoApiClient";

/**
 * Singleton instance of PhotoApiClient.
 */
const apiClient = new PhotoApiClient();

/**
 * Photo module logger (standardized).
 */
const logger = {
    info: (...args) => console.log("[photo]", ...args),
    error: (...args) => console.error("[photo]", ...args),
};

/**
 * Uploads photos via multipart/form-data.
 * @param {Object} fields { photoFiles: File[], itemId?: number, updatedBy: number }
 * @returns {Object|null} PhotoResponse or null
 */
export async function uploadPhoto(fields) {
    logger.info("uploadPhoto called", { itemId: fields?.itemId, updatedBy: fields?.updatedBy, fileCount: Array.isArray(fields?.photoFiles) ? fields.photoFiles.length : 0 });
    try {
        const response = await apiClient.uploadPhoto(fields);
        logger.info("uploadPhoto received response", { response });
        return response?.data || null;
    } catch (error) {
        logger.error("uploadPhoto failed", error);
        throw error;
    }
}

/**
 * Fetches all photos.
 * @returns {Object} { status, data, transactionId, errors }
 */
export async function getAllPhotos() {
    logger.info("getAllPhotos called");
    try {
        const response = await apiClient.fetchAllPhotos();
        logger.info("getAllPhotos success", {
            dataCount: Array.isArray(response?.data) ? response.data.length : 0,
        });
        return {
            status: response?.status,
            data: response?.data || [],
            transactionId: response?.transactionId,
            errors: response?.errors ?? null,
        };
    } catch (error) {
        logger.error("getAllPhotos failed", error);
        throw error;
    }
}

/**
 * Fetches all pending photos (staged, not linked to itemId).
 * @returns {Object} { status, data, transactionId, errors }
 */
export async function getPendingPhotos() {
    logger.info("getPendingPhotos called");
    try {
        const response = await apiClient.fetchPendingPhotos();
        logger.info("getPendingPhotos success", {
            dataCount: Array.isArray(response?.data) ? response.data.length : 0,
        });
        return {
            status: response?.status,
            data: response?.data || [],
            transactionId: response?.transactionId,
            errors: response?.errors ?? null,
        };
    } catch (error) {
        logger.error("getPendingPhotos failed", error);
        throw error;
    }
}

/**
 * Fetches a photo by its ID.
 * @param {number} photoId
 * @returns {Object|null} PhotoResponse or null
 */
export async function getPhotoById(photoId) {
    logger.info("getPhotoById called", { photoId });
    try {
        const response = await apiClient.fetchPhotoById(photoId);
        logger.info("getPhotoById success", { found: !!response?.data, photoId: response?.data?.photoId });
        return response?.data || null;
    } catch (error) {
        logger.error("getPhotoById failed", error);
        throw error;
    }
}

/**
 * Deletes a photo by its ID.
 * @param {number} photoId
 * @returns {void}
 */
export async function deletePhoto(photoId) {
    logger.info("deletePhoto called", { photoId });
    try {
        await apiClient.deletePhoto(photoId);
        logger.info("deletePhoto success", { photoId });
    } catch (error) {
        logger.error("deletePhoto failed", error);
        throw error;
    }
}