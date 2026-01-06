/**
 * AddItemScreen.jsx
 *
 * Presents a grid of all pending photos (not yet linked to an item)
 * and a button to upload a new photo (single photo only).
 * Displays a saving indicator next to upload photo while async uploads are pending.
 * Follows Bulletproof React conventions for clarity and separation.
 *
 * @component
 */

import React, { useState, useCallback } from "react";
import styles from "../features/item-management/styles/additemscreen.module.css";
import PhotoInfoCard from "../features/item-management/components/photoInfoCard";
import { usePendingPhotos } from "../features/item-management/hooks/useAddItemScreen";
import { useUploadPhoto } from "../features/item-management/hooks/useUploadPhoto";
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

    // Query for all pending photos
    const {
        pendingPhotos,
        isPending,
        isError,
        error,
    } = usePendingPhotos();

    // Single-file upload mutation
    const {
        mutate: uploadPhoto,
        isPending: isUploading,
        reset: resetUploadPhoto,
        error: uploadError,
    } = useUploadPhoto();

    /**
     * Opens the upload modal.
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
        resetUploadPhoto();
    }, [resetUploadPhoto]);

    /**
     * Handles single photo file upload after selection.
     * @function
     * @param {File} file - Single photo file to upload
     */
    const handleUploadPhotoFile = useCallback(
        (file) => {
            logger.info("handleUploadPhotoFile called", file?.name);
            if (file) {
                uploadPhoto(file, {
                    onSuccess: () => {
                        logger.info("Photo upload succeeded");
                        setUploadModalOpen(false);
                    },
                    onError: (err) => {
                        logger.error("Photo upload failed:", err);
                    },
                });
            }
        },
        [uploadPhoto]
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
                        disabled={isUploading}
                    >
                        + Upload Photo
                    </button>
                    {/* Show upload status ONLY while uploading */}
                    {isUploading && (
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
                onUpload={handleUploadPhotoFile}
                isUploading={isUploading}
                error={uploadError ? uploadError.message : null}
            />
        </div>
    );
};

export default AddItemScreen;