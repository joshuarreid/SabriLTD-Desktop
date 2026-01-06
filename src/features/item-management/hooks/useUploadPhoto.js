/**
 * useBulkUploadPhotos
 * Mutation hook for uploading up to 25 pending photos asynchronously.
 *
 * Follows Bulletproof React conventions for separation, robust logging,
 * and cache management on upload.
 *
 * @returns {object} Mutation object from @tanstack/react-query with .mutate()
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { photoKeys } from "../../../api/photo/photoQueryKeys";
import { uploadPhoto } from "../../../api/photo/photo";
import { useCurrentUser } from "../../../hooks/useCurrentUser";

/**
 * logger for useBulkUploadPhotos
 * @constant
 */
const logger = {
    info: (...args) => console.log("[useBulkUploadPhotos]", ...args),
    error: (...args) => console.error("[useBulkUploadPhotos]", ...args),
};

/**
 * Bulk upload photos (async in parallel).
 * @async
 * @function bulkUploadFn
 * @param {File[]} files - Array of File objects to upload (max 25)
 * @param {number} updatedBy - userId of the person uploading (required)
 * @returns {Promise<Object[]>} Array of upload results or throws on first error
 */
const bulkUploadFn = async ({ files, updatedBy }) => {
    logger.info("bulkUploadFn called", files.map((f) => f.name), { updatedBy });
    if (!Array.isArray(files) || files.length === 0) {
        throw new Error("You must select at least one photo.");
    }
    if (files.length > 25) {
        throw new Error("You may only upload up to 25 photos at a time.");
    }
    if (!updatedBy) {
        throw new Error("Cannot determine user for upload.");
    }
    // Upload all files in parallel
    const uploadPromises = files.map((photoFile) =>
        uploadPhoto({ photoFile, updatedBy })
    );
    return await Promise.all(uploadPromises);
};

/**
 * useBulkUploadPhotos
 * - Handles async bulk photo uploads (up to 25), invalidates cache on success.
 *
 * @returns {object} Mutation hook for bulk upload (destructure .mutate to use)
 */
export const useBulkUploadPhotos = () => {
    const queryClient = useQueryClient();

    /**
     * Current user (from useCurrentUser hook)
     */
    const { user, loading, error: userError } = useCurrentUser();

    /**
     * Internal wrapper that injects the authenticated updatedBy
     * @async
     * @param {File[]} files
     * @returns {Promise<Object[]>}
     */
    const handleBulkUpload = async (files) => {
        if (loading) throw new Error("Current user not loaded yet");
        if (userError) throw userError || new Error("Unable to determine current user");
        const updatedBy = user?.userId;
        if (!updatedBy) throw new Error("No valid user id");
        return await bulkUploadFn({ files, updatedBy });
    };

    return useMutation({
        mutationFn: handleBulkUpload,
        onSuccess: () => {
            logger.info("Bulk photo upload succeeded, invalidating pending grid.");
            queryClient.invalidateQueries({ queryKey: photoKeys.pendingList() });
        },
        onError: (error) => {
            logger.error("Bulk photo upload failed", error);
        },
    });
};