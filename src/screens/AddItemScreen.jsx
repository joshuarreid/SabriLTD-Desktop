/**
 * AddItemScreen.jsx
 *
 * Presents a grid of all pending photos (not yet linked to an item)
 * and a button to upload new photos (supports bulk upload).
 * Displays a saving indicator next to the upload photo button while async uploads are pending.
 * Follows Bulletproof React conventions for clarity and separation.
 *
 * @component
 */

import React, { useState, useCallback } from "react";
import styles from "../features/item-management/styles/additemscreen.module.css";
import PhotoInfoCard from "../features/item-management/components/photoInfoCard";
import { usePendingPhotos } from "../features/item-management/hooks/useAddItemScreen";
import { useBulkUploadPhotos } from "../features/item-management/hooks/useUploadPhoto";
import UploadPhotoModal from "../features/item-management/components/UploadPhotoModal";
import SaveStatus from "../components/save/SaveStatus";


/**
 * logger for AddItemScreen.
 * @constant
 */
const logger = {
    info: (...args) => console.log("[AddItemScreen]", ...args),
    error: (...args) => console.error("[AddItemScreen]", ...args),
};

/**
 * AddItemScreen - main add item interface
 *
 * @returns {JSX.Element}
 */
const AddItemScreen = () => {
    logger.info("AddItemScreen rendered");

    const [uploadModalOpen, setUploadModalOpen] = useState(false);

    const {
        pendingPhotos,
        isPending,
        isError,
        error,
    } = usePendingPhotos();

    // Correct hook usage: use the `mutate` function from react-query
    const {
        mutate, // The correct function to trigger the mutation
        isPending: isBulkUploading,
        reset: resetBulkUpload,
        error: uploadError,
    } = useBulkUploadPhotos();

    /**
     * Handles the upload photo modal opening.
     * @function
     */
    const handleOpenUploadModal = useCallback(() => {
        logger.info("Upload modal opened");
        setUploadModalOpen(true);
    }, []);

    /**
     * Handles closing the upload modal.
     * @function
     */
    const handleCloseUploadModal = useCallback(() => {
        logger.info("Upload modal closed");
        setUploadModalOpen(false);
        resetBulkUpload();
    }, [resetBulkUpload]);

    /**
     * Handles bulk photo file upload after selection. Accepts an array of Files.
     * @function
     * @param {File[]} files - Array of up to 25 photo files to upload
     */
    const handleBulkPhotoFileUpload = useCallback(
        (files) => {
            logger.info("handleBulkPhotoFileUpload called", files.map(f => f?.name));
            if (files && files.length > 0) {
                // Correct usage: call mutate(files, options)
                mutate(files, {
                    onSuccess: () => {
                        logger.info("Bulk photo upload succeeded");
                        setUploadModalOpen(false);
                    },
                    onError: (err) => {
                        logger.error("Bulk photo upload failed:", err);
                    },
                });
            }
        },
        [mutate]
    );

    return (
        <div className={styles.addItemPanel}>
            <div className={styles.headerSection}>
                <h2 className={styles.sectionTitle}>Add New Item</h2>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <button
                        type="button"
                        className={styles.uploadPhotoBtn}
                        onClick={handleOpenUploadModal}
                        disabled={isBulkUploading}
                    >
                        + Upload Photo
                    </button>
                    {/* Show upload status ONLY while uploading */}
                    {isBulkUploading && (
                        <SaveStatus status="saving" savingText="Uploading..." />
                    )}
                </div>
            </div>
            <div className={styles.gridContainer}>
                {isPending ? (
                    <div className={styles.loading}>Loading photos...</div>
                ) : isError ? (
                    <div className={styles.error}>
                        Error: {error?.message || "Failed to load photos."}
                    </div>
                ) : (
                    (pendingPhotos ?? []).map((photo) => (
                        <PhotoInfoCard
                            key={photo.photoId}
                            photo={photo}
                        />
                    ))
                )}
            </div>
            <UploadPhotoModal
                open={uploadModalOpen}
                onClose={handleCloseUploadModal}
                onUpload={handleBulkPhotoFileUpload}
                isUploading={isBulkUploading}
                error={uploadError ? uploadError.message : null}
                maxFiles={25}
            />
        </div>
    );
};

export default AddItemScreen;