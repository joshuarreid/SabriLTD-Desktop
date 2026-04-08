/**
 * useUploadPhoto
 * Mutation hook for uploading a pending photo asynchronously.
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
 * logger for useUploadPhoto
 * @constant
 */
const logger = {
    info: (...args) => console.log("[useUploadPhoto]", ...args),
    error: (...args) => console.error("[useUploadPhoto]", ...args),
};

/**
 * Upload photo mutation (multiple files).
 * @async
 * @function uploadFn
 * @param {File[]} photoFiles - Array of photo files to upload
 * @param {number} updatedBy - userId of the person uploading (required)
 * @returns {Promise<Object>} Upload result or throws on error
 */
const uploadFn = async ({ photoFiles, updatedBy }) => {
    logger.info("uploadFn called", Array.isArray(photoFiles) ? photoFiles.map(f => f?.name) : photoFiles, { updatedBy });
    if (!photoFiles || !Array.isArray(photoFiles) || photoFiles.length === 0) throw new Error("No photo files selected.");
    if (!updatedBy) throw new Error("Cannot determine user for upload.");
    // Upload files
    return await uploadPhoto({ photoFiles, updatedBy });
};

/**
 * useUploadPhoto
 * - Handles async photo upload, invalidates cache on success.
 *
 * @returns {object} Mutation hook for multi-upload (destructure .mutate to use)
 */
export const useUploadPhoto = () => {
    const queryClient = useQueryClient();
    const { user, loading, error: userError } = useCurrentUser();

    /**
     * Internal wrapper that injects the authenticated updatedBy.
     * @async
     * @param {File[]} photoFiles
     * @returns {Promise<Object>}
     */
    const handleUpload = async (photoFiles) => {
        if (loading) throw new Error("Current user not loaded yet");
        if (userError) throw userError || new Error("Unable to determine current user");
        const updatedBy = user?.userId;
        return await uploadFn({ photoFiles, updatedBy });
    };

    return useMutation({
        mutationFn: handleUpload,
        onSuccess: () => {
            logger.info("Photo upload succeeded, invalidating pending grid.");
            queryClient.invalidateQueries({ queryKey: photoKeys.pendingList() });
        },
        onError: (error) => {
            logger.error("Photo upload failed", error);
        },
    });
};