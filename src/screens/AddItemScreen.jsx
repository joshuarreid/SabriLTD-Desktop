/**
 * AddItemScreen.jsx
 *
 * Presents a grid of all pending photos (not yet linked to an item)
 * and buttons for uploading and batch operations following Bulletproof React conventions.
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
    const [selectedPhotoIds, setSelectedPhotoIds] = useState([]);

    const {
        pendingPhotos,
        isPending,
        isError,
        error,
    } = usePendingPhotos();

    const {
        mutate: uploadPhoto,
        isPending: isUploading,
        reset: resetUploadPhoto,
        error: uploadError,
    } = useUploadPhoto();

    /**
     * Opens the upload modal.
     */
    const handleOpenUploadModal = useCallback(() => {
        logger.info("Upload modal opened");
        setUploadModalOpen(true);
    }, []);

    /**
     * Handles closing the upload modal.
     */
    const handleCloseUploadModal = useCallback(() => {
        logger.info("Upload modal closed");
        setUploadModalOpen(false);
        resetUploadPhoto();
    }, [resetUploadPhoto]);

    /**
     * Handles single photo file upload after selection.
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

    /**
     * Toggles selection of a photoId.
     * @param {number} photoId
     */
    const handleTogglePhotoSelect = useCallback(
        (photoId) => {
            setSelectedPhotoIds((prev) => {
                if (prev.includes(photoId)) {
                    logger.info("Photo deselected", photoId);
                    return prev.filter((id) => id !== photoId);
                } else {
                    logger.info("Photo selected", photoId);
                    return [...prev, photoId];
                }
            });
        },
        []
    );

    /**
     * Clears all selected photoIds.
     */
    const handleClearSelection = useCallback(() => {
        logger.info("Clear photo selection");
        setSelectedPhotoIds([]);
    }, []);

    /**
     * Handles clicking "New Item" (opens a TODO modal for now).
     */
    const handleNewItem = useCallback(() => {
        logger.info("New Item clicked with selected photos:", selectedPhotoIds);
        // TODO: Open New Item modal using the selectedPhotoIds for pre-filling
        alert(
            `TODO: Open New Item modal with selected photoIds: ${selectedPhotoIds.join(
                ", "
            )}`
        );
    }, [selectedPhotoIds]);

    return (
        <div className={styles.addItemPanel}>
            <div className={styles.headerSection}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div className={styles.actionButtonWrapper}>
                        <button
                            type="button"
                            className={styles.newItemBtn}
                            onClick={handleNewItem}
                            disabled={selectedPhotoIds.length === 0}
                            aria-disabled={selectedPhotoIds.length === 0}
                        >
                            New Item
                            {selectedPhotoIds.length > 0 && (
                                <span className={styles.selectionCountBubble}>
                                    {selectedPhotoIds.length}
                                </span>
                            )}
                        </button>
                    </div>
                    <button
                        type="button"
                        className={styles.clearSelectionsBtn}
                        onClick={handleClearSelection}
                        disabled={selectedPhotoIds.length === 0}
                        aria-disabled={selectedPhotoIds.length === 0}
                    >
                        Clear Selection
                    </button>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <button
                        type="button"
                        className={styles.uploadPhotoBtn}
                        onClick={handleOpenUploadModal}
                        disabled={isUploading}
                    >
                        + Upload Photo
                    </button>
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
                            selected={selectedPhotoIds.includes(photo.photoId)}
                            onClick={() => handleTogglePhotoSelect(photo.photoId)}
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