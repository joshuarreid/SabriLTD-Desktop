/**
 * AddItemScreen.jsx
 *
 * Presents a grid of all pending photos (not yet linked to an item)
 * with upload on the left, batch operations (New Item, Clear Selection) on the right.
 * Follows Bulletproof React conventions, robust logging, JSDoc, and modularity.
 *
 * @component
 */

import React, { useState, useCallback } from "react";
import styles from "../styles/additemscreen.module.css";
import PhotoInfoCard from "../../features/photo/components/photoInfoCard.tsx";
import { usePendingPhotos } from "../hooks/useAddItemScreen.js";
import { useUploadPhoto } from "../../features/item/hooks/useUploadPhoto.js";
import UploadPhotoModal from "../../features/photo/components/UploadPhotoModal.tsx";
import SaveStatus from "../../components/save/SaveStatus.jsx";
import EditItemModal from "../../features/item/components/EditItemModal.tsx";
import { useDeletePhotos } from "../../features/item/hooks/useDeletePhotos.js";
import { useQueryClient } from "@tanstack/react-query";
import { photoKeys } from "../../features/photo/api/photoQueryKeys.ts";
import ConfirmationModal from "../../components/confirmationmodal/ConfirmationModal.jsx";

/**
 * logger for AddItemScreen.
 * @constant
 */
const logger = {
    info: (...args) => console.log("[AddItemScreen]", ...args),
    error: (...args) => console.error("[AddItemScreen]", ...args),
};

/**
 * AddItemScreen - main add item interface with upload left, actions right.
 *
 * @returns {JSX.Element}
 */
const AddItemScreen = () => {
    logger.info("AddItemScreen rendered");

    const [uploadModalOpen, setUploadModalOpen] = useState(false);
    const [selectedPhotoIds, setSelectedPhotoIds] = useState([]);
    const [editItemModalOpen, setEditItemModalOpen] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);


    const queryClient = useQueryClient();

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

    const {
        mutate: deletePhotos,
        isPending: isDeleting,
    } = useDeletePhotos();

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
     * Handles multiple photo file uploads after selection.
     * @function
     * @param {File[]} files - Array of photo files to upload
     */
    const handleUploadPhotoFiles = useCallback(
        (files) => {
            logger.info("handleUploadPhotoFiles called", Array.isArray(files) ? files.map(f => f?.name) : files);
            if (files && files.length > 0) {
                uploadPhoto(files, {
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
     * @function
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
     * @function
     */
    const handleClearSelection = useCallback(() => {
        logger.info("Clear photo selection");
        setSelectedPhotoIds([]);
    }, []);

    /**
     * Handles clicking "New Item" and opens the EditItemModal
     * showing all selected photos for navigation.
     * @function
     */
    const handleNewItem = useCallback(() => {
        logger.info("New Item clicked with selected photos:", selectedPhotoIds);
        if (!selectedPhotoIds.length) return;

        // Find photo objects by IDs, preserve selection order.
        const selectedPhotos = selectedPhotoIds
            .map(id => (pendingPhotos ?? []).find(photo => photo.photoId === id))
            .filter(photo => !!photo);

        if (selectedPhotos.length > 0) {
            setEditItemModalOpen(true);
        } else {
            logger.error("No valid photos found for EditItemModal.");
        }
    }, [selectedPhotoIds, pendingPhotos]);

    /**
     * Handles closing the EditItemModal (resets selection).
     * @function
     */
    const handleCloseEditItemModal = useCallback(() => {
        logger.info("EditItemModal closed");
        setEditItemModalOpen(false);
        setSelectedPhotoIds([]);
    }, []);

    /**
     * Deletes all selected photos.
     * @function
     */
    const handleDeleteSelected = useCallback(() => {
        if (!selectedPhotoIds.length) return;
        setShowDeleteModal(true);
    }, [selectedPhotoIds]);

    const handleConfirmDelete = useCallback(() => {
        if (!selectedPhotoIds.length) return;
        deletePhotos(selectedPhotoIds, {
            onSuccess: () => {
                logger.info("Deleted selected photos", selectedPhotoIds);
                setSelectedPhotoIds([]);
                setShowDeleteModal(false);
            },
            onError: (err) => {
                logger.error("Failed to delete selected photos:", err);
                setShowDeleteModal(false);
            },
        });
    }, [selectedPhotoIds, deletePhotos]);

    const handleCancelDelete = useCallback(() => {
        setShowDeleteModal(false);
    }, []);

    // --- RENDER ---
    return (
        <div className={styles.addItemPanel}>
            <div className={styles.headerSectionSwapped}>
                <div className={styles.headerLeft}>
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
                <div className={styles.headerRight}>
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
                    <button
                        type="button"
                        className={styles.deleteBtn}
                        onClick={handleDeleteSelected}
                        disabled={selectedPhotoIds.length === 0 || isDeleting}
                        aria-disabled={selectedPhotoIds.length === 0 || isDeleting}
                    >
                        {isDeleting ? "Deleting..." : "Delete"}
                    </button>
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
                onUpload={handleUploadPhotoFiles}
                isUploading={isUploading}
                error={uploadError?.message}
            />
            {editItemModalOpen && selectedPhotoIds.length > 0 && (
                <EditItemModal
                    photos={
                        selectedPhotoIds
                            .map(id => (pendingPhotos ?? []).find(photo => photo.photoId === id))
                            .filter(photo => !!photo)
                    }
                    open={editItemModalOpen}
                    onClose={handleCloseEditItemModal}
                />
            )}
            <ConfirmationModal
                open={showDeleteModal}
                onCancel={handleCancelDelete}
                onConfirm={handleConfirmDelete}
                title="Delete selected photos?"
                description={`Are you sure you want to delete ${selectedPhotoIds.length} photo${selectedPhotoIds.length > 1 ? 's' : ''}? This action cannot be undone.`}
                confirmText="Delete"
                cancelText="Cancel"
                isConfirmLoading={isDeleting}
                confirmDisabled={isDeleting}
                deleteStatus={isDeleting ? 'deleting' : 'idle'}
            />
        </div>
    );
};

export default AddItemScreen;
