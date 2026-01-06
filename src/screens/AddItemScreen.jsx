/**
 * AddItemScreen.jsx
 *
 * Presents a grid of all pending photos (not yet linked to an item)
 * and a button to upload a new photo. Mimics styling and organizational
 * conventions from CompanySettingsTab/CompanyInfoCard for consistency.
 *
 * @component
 */

import React, { useState, useCallback } from "react";
import styles from "../features/item-management/styles/additemscreen.module.css";
import PhotoInfoCard from "../features/item-management/components/photoInfoCard";
import { usePendingPhotos } from "../features/item-management/hooks/useAddItemScreen";
import { useUploadPhoto } from "../features/item-management/hooks/useUploadPhoto";
import UploadPhotoModal from "../features/item-management/components/UploadPhotoModal";

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

    const {
        mutate: uploadPhoto,
        isPending: isUploading,
        error: uploadError,
        reset: resetUpload,
    } = useUploadPhoto();

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
        resetUpload();
    }, [resetUpload]);

    /**
     * Handles actual photo file upload after selection.
     * @function
     * @param {File} file - Photo file to upload
     */
    const handlePhotoFileUpload = useCallback(
        (file) => {
            logger.info("handlePhotoFileUpload called", file?.name);
            if (file) {
                uploadPhoto(
                    { photoFile: file },
                    {
                        onSuccess: () => {
                            logger.info("Photo uploaded successfully");
                            setUploadModalOpen(false);
                        },
                        onError: (err) => {
                            logger.error("Photo upload failed:", err);
                        },
                    }
                );
            }
        },
        [uploadPhoto]
    );

    return (
        <div className={styles.addItemPanel}>
            <div className={styles.headerSection}>
                <h2 className={styles.sectionTitle}>Add New Item</h2>
                <button
                    type="button"
                    className={styles.uploadPhotoBtn}
                    onClick={handleOpenUploadModal}
                >
                    + Upload Photo
                </button>
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
                            // Additional props for click/edit/delete can be added later
                        />
                    ))
                )}
            </div>
            <UploadPhotoModal
                open={uploadModalOpen}
                onClose={handleCloseUploadModal}
                onUpload={handlePhotoFileUpload}
                isUploading={isUploading}
                error={uploadError ? uploadError.message : null}
            />
        </div>
    );
};

export default AddItemScreen;