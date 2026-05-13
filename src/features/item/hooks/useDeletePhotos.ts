import { useMutation, useQueryClient, UseMutationResult } from "@tanstack/react-query";
import { useDeletePhoto } from "../../photo/hooks/usePhotos";

/**
 * logger for useDeletePhotos
 * @constant
 */
const logger = {
    info: (...args: unknown[]) => console.log("[useDeletePhotos]", ...args),
    error: (...args: unknown[]) => console.error("[useDeletePhotos]", ...args),
};

/**
 * useDeletePhotos
 * - Handles async deletion of multiple photos, invalidates cache on success.
 *
 * @returns {UseMutationResult<void, unknown, number[], unknown>} Mutation hook for multi-delete (destructure .mutate to use)
 */
export const useDeletePhotos = (): UseMutationResult<void, unknown, number[], unknown> => {
    const singleDelete = useDeletePhoto();

    /**
     * Deletes multiple photos by their IDs using useDeletePhoto mutation.
     * @param {number[]} photoIds
     * @returns {Promise<void>}
     */
    const handleDelete = async (photoIds: number[]): Promise<void> => {
        logger.info("handleDelete called", photoIds);
        if (!Array.isArray(photoIds) || photoIds.length === 0) throw new Error("No photo IDs provided for deletion.");
        // Use the mutateAsync from useDeletePhoto for each ID
        await Promise.all(photoIds.map((id) => singleDelete.mutateAsync(id)));
    };

    return useMutation<void, unknown, number[], unknown>({
        mutationFn: handleDelete,
        onSuccess: (_data, photoIds) => {
            logger.info("Photos deleted via useDeletePhoto", photoIds);
            // All cache invalidation is handled by useDeletePhoto
        },
        onError: (error) => {
            logger.error("Photo deletion failed", error);
        },
    });
};
