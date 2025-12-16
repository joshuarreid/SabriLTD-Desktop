import React, { useEffect, useState } from "react";
import styles from "../styles/storagesettingstab.module.css";
import StorageInfoCard from "./StorageInfoCard";
import EditStorageModal from "../../../../components/editstoragemodal/EditStorageModal";
import ConfirmationModal from "../../../../components/confirmationmodal/ConfirmationModal";

/**
 * StorageSettings
 * UI for listing, adding, editing, and deleting storage locations for the selected building.
 *
 * @param {object} props - All props/data from useStorageSettingsTab
 */
const logger = {
    info: (...args) => console.log("[StorageSettings]", ...args),
    error: (...args) => console.error("[StorageSettings]", ...args),
};

const EMPTY_STORAGE = { name: "", description: "", buildingId: "" };

const StorageSettings = ({
                             storageList,
                             isStoragePending,
                             isStorageError,
                             storageError,
                             selectedBuildingId,
                             storageEditStatus,
                             storageAddStatus,
                             createStorageMutation,
                             updateStorageMutation,
                             deleteStorageMutation,
                         }) => {
    // Modal local state
    const [editStorageModalOpen, setEditStorageModalOpen] = useState(false);
    const [currEditStorage, setCurrEditStorage] = useState(null);
    const [isEditStorageMode, setIsEditStorageMode] = useState(false);

    // Storage remove local state (UX only)
    const [removingStorage, setRemovingStorage] = useState(null);
    const [isRemoving, setIsRemoving] = useState(false);
    const [deleteStatus, setDeleteStatus] = useState("idle");

    /**
     * Opens the edit modal for a storage location.
     * @param {object} storage
     */
    const handleEditStorage = (storage) => {
        logger.info("Opening EditStorageModal", { storageId: storage.storageId });
        setCurrEditStorage(storage);
        setIsEditStorageMode(true);
        setEditStorageModalOpen(true);
    };

    /**
     * Opens the add modal for a storage location under the current building.
     */
    const handleAddStorage = () => {
        logger.info("Opening AddStorageModal (empty), for buildingId", selectedBuildingId);
        setCurrEditStorage({
            ...EMPTY_STORAGE,
            buildingId: selectedBuildingId || ""
        });
        setIsEditStorageMode(false);
        setEditStorageModalOpen(true);
    };

    /**
     * Handles modal close/cancel for storage.
     */
    const handleStorageModalClose = () => {
        logger.info("Storage modal closed or cancelled");
        setEditStorageModalOpen(false);
        setCurrEditStorage(null);
        setIsEditStorageMode(false);
    };

    /**
     * Handles storage add/save event from modal.
     * Always inject current selectedBuildingId.
     * @param {number|null} storageId
     * @param {{name: string, description: string}} payload
     */
    const handleStorageModalSave = (storageId, payload) => {
        logger.info("handleStorageModalSave", { storageId, payload, selectedBuildingId });
        const fullPayload = {
            ...payload,
            buildingId: selectedBuildingId,
        };
        if (!storageId) {
            createStorageMutation.mutate(fullPayload);
        } else {
            updateStorageMutation.mutate({ storageId, payload: fullPayload });
        }
    };

    /**
     * Prompt for removing a storage.
     * @param {object} storage
     */
    const handlePromptRemoveStorage = (storage) => {
        setRemovingStorage(storage);
        setDeleteStatus("idle");
    };

    /**
     * Actually calls the delete mutation.
     * @param {number} storageId
     */
    const confirmRemoveStorage = (storageId) => {
        setIsRemoving(true);
        setDeleteStatus("deleting");
        deleteStorageMutation.mutate(storageId, {
            onSuccess: () => {
                setDeleteStatus("deleted");
                setTimeout(() => {
                    setDeletingDone();
                }, 1000);
            },
            onError: () => {
                setDeleteStatus("error");
                setTimeout(() => {
                    setDeletingDone();
                }, 1400);
            },
            onSettled: () => setIsRemoving(false),
        });
    };

    /**
     * Helper to clear delete state after status indicator shown.
     */
    const setDeletingDone = () => {
        setRemovingStorage(null);
        setDeleteStatus("idle");
    };

    /**
     * Cancels storage removal prompt.
     */
    const cancelRemoveStorage = () => setRemovingStorage(null);

    /**
     * Auto-close EditStorageModal after save (add or edit)
     */
    useEffect(() => {
        const status = isEditStorageMode ? storageEditStatus : storageAddStatus;
        if (
            editStorageModalOpen &&
            status === "saved"
        ) {
            // Close after a short delay to let user see the 'Saved' feedback
            const t = setTimeout(() => {
                setEditStorageModalOpen(false);
                setCurrEditStorage(null);
                setIsEditStorageMode(false);
            }, 1000);
            return () => clearTimeout(t);
        }
        return undefined;
    }, [editStorageModalOpen, storageEditStatus, storageAddStatus, isEditStorageMode]);

    return (
        <>
            <div className={styles.storageLocationsHeaderRow}>
                <h2 className={styles.storageLocationsTitle}>Storage Locations</h2>
                <button
                    className={styles.addUserBtn}
                    type="button"
                    onClick={handleAddStorage}
                >
                    + New
                </button>
            </div>
            <div className={styles.storageSectionPanel}>
                {isStoragePending || selectedBuildingId == null ? (
                    <div className={styles.loading}>Loading storage locations…</div>
                ) : isStorageError ? (
                    <div className={styles.error}>
                        Error: {storageError?.message || "Failed to load storage locations."}
                    </div>
                ) : (
                    <StorageLocationsList
                        storageList={storageList ?? []}
                        onEditStorage={handleEditStorage}
                        onDeleteStorage={handlePromptRemoveStorage}
                    />
                )}
            </div>
            <EditStorageModal
                storage={currEditStorage}
                selectedBuildingId={selectedBuildingId}
                open={editStorageModalOpen}
                isSaving={
                    isEditStorageMode
                        ? storageEditStatus === "saving"
                        : storageAddStatus === "saving"
                }
                error={
                    isEditStorageMode
                        ? updateStorageMutation.error?.message ?? null
                        : createStorageMutation.error?.message ?? null
                }
                saveState={
                    isEditStorageMode
                        ? storageEditStatus
                        : storageAddStatus
                }
                onSave={handleStorageModalSave}
                onClose={handleStorageModalClose}
            />
            <ConfirmationModal
                open={!!removingStorage}
                onCancel={cancelRemoveStorage}
                onConfirm={() => confirmRemoveStorage(removingStorage?.storageId)}
                title="Are you sure?"
                description={
                    removingStorage
                        ? `Are you sure you want to delete storage location '${removingStorage.name}'? This action cannot be undone.`
                        : ""
                }
                confirmText="Delete"
                cancelText="Cancel"
                isConfirmLoading={deleteStatus === "deleting"}
                isCancelLoading={false}
                deleteStatus={deleteStatus}
            />
        </>
    );
};

/**
 * StorageLocationsList
 * Child helper for rendering a list of storage info cards.
 * @param {object} props
 * @param {Array} props.storageList
 * @param {Function} [props.onEditStorage]
 * @param {Function} [props.onDeleteStorage]
 * @returns {JSX.Element}
 */
const StorageLocationsList = ({ storageList, onEditStorage, onDeleteStorage }) => {
    const logger = {
        info: (...args) => console.log("[StorageLocationsList]", ...args),
        error: (...args) => console.error("[StorageLocationsList]", ...args),
    };

    logger.info("StorageLocationsList rendered", { number: storageList.length });

    return (
        <div>
            {storageList.length === 0 ? (
                <div className={styles.noStorageMsg}>
                    No storage locations available for this building.
                </div>
            ) : (
                <div className={styles.storageGrid}>
                    {storageList.map((storage) => (
                        <StorageInfoCard
                            key={storage.storageId}
                            storage={storage}
                            onClick={() => onEditStorage && onEditStorage(storage)}
                            onDelete={onDeleteStorage}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default StorageSettings;