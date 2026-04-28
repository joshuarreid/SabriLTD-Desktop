import { useMutation, useQueryClient } from "@tanstack/react-query";
import { photoKeys } from "../../../api/photo/photoQueryKeys.js";
import { deletePhoto } from "../../../api/photo/photo.js";

/**
 * logger for useDeletePhotos
 * @constant
 */
const logger = {
    info: (...args) => console.log("[useDeletePhotos]", ...args),
    error: (...args) => console.error("[useDeletePhotos]", ...args),
};

/**
 * useDeletePhotos
 * - Handles async deletion of multiple photos, invalidates cache on success.
 *
 * @returns {object} Mutation hook for multi-delete (destructure .mutate to use)
 */
export const useDeletePhotos = () => {
    const queryClient = useQueryClient();

    /**
     * Deletes multiple photos by their IDs.
     * @param {number[]} photoIds
     * @returns {Promise<void>}
     */
    const handleDelete = async (photoIds) => {
        logger.info("handleDelete called", photoIds);
        if (!Array.isArray(photoIds) || photoIds.length === 0) throw new Error("No photo IDs provided for deletion.");
        await Promise.all(photoIds.map(deletePhoto));
    };

    return useMutation({
        mutationFn: handleDelete,
        onSuccess: (data, photoIds) => {
            logger.info("Photos deleted, invalidating pending grid.", photoIds);
            queryClient.invalidateQueries({ queryKey: photoKeys.pendingList() });
        },
        onError: (error) => {
            logger.error("Photo deletion failed", error);
        },
    });
};
