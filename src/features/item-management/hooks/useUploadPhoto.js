/**
 * useUploadPhoto
 * Mutation hook for uploading a new pending photo (standalone, not linked to itemId).
 *
 * @returns {object} Mutation object from @tanstack/react-query
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {uploadPhoto} from "../../../api/photo/photo";
import {photoKeys} from "../../../api/photo/photoQueryKeys";


/**
 * logger for useUploadPhoto
 * @constant
 */
const logger = {
    info: (...args) => console.log("[useUploadPhoto]", ...args),
    error: (...args) => console.error("[useUploadPhoto]", ...args),
};

export const useUploadPhoto = () => {
    const queryClient = useQueryClient();

    /**
     * Mutation function for uploading photo.
     * @async
     * @function
     * @param {{ photoFile: File }} fields
     * @returns {Promise<Object>} API response data
     * @throws {Error} If upload fails
     */
    const mutationFn = async ({ photoFile }) => {
        logger.info("Uploading photo");
        // Optionally get current userId from auth context for updatedBy. Here we default to 1 for demo
        const updatedBy = 1;
        return await uploadPhoto({ photoFile, updatedBy });
    };

    return useMutation({
        mutationFn,
        onSuccess: () => {
            logger.info("Photo upload succeeded, invalidate pending photos");
            queryClient.invalidateQueries({ queryKey: photoKeys.pendingList() });
        },
        onError: (error) => {
            logger.error("Photo upload failed", error);
        },
    });
};