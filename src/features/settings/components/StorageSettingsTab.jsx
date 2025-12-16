import React, { useEffect, useState } from "react";
import styles from "../styles/storagesettingstab.module.css";
import { useStorageSettingsTab } from "../hooks/useStorageSettingsTab";
import BuildingInfoCard from "./BuildingInfoCard";
import StorageInfoCard from "./StorageInfoCard";
import EditBuildingModal from "../../../components/editbuildingmodal/EditBuildingModal";
import EditStorageModal from "../../../components/editstoragemodal/EditStorageModal";
import ConfirmationModal from "../../../components/confirmationmodal/ConfirmationModal";
import {
    createStorage,
    updateStorage,
    deleteStorage,
} from "../../../api/storage/storage";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { storageKeys } from "../../../api/storage/storageQueryKeys";

/**
 * StorageSettingsTab
 * UI for managing buildings and their storage locations.
 *
 * @component
 * @returns {JSX.Element}
 */
const logger = {
    info: (...args) => console.log("[StorageSettingsTab]", ...args),
    error: (...args) => console.error("[StorageSettingsTab]", ...args),
};

const EMPTY_BUILDING = { name: "", address: "", manager: "" };
const EMPTY_STORAGE = { name: "", description: "", buildingId: "" };

const StorageSettingsTab = () => {
    logger.info("StorageSettingsTab mounted");
    const {
        buildings,
        buildingsWithStorage,
        isPending,
        isError,
        error,
        isLoadingWithStorage,
        addStatus,
        editStatus,
        addingBuilding,
        editingId,
        openAddBuilding,
        handleAddBuilding,
        handleEditBuilding,
        handleSaveEdit,
        cancelEditOrAdd,
    } = useStorageSettingsTab();

    const [selectedBuildingId, setSelectedBuildingId] = useState(null);
    const [editBuildingModalOpen, setEditBuildingModalOpen] = useState(false);
    const [currEditBuilding, setCurrEditBuilding] = useState(null);
    const [isEditMode, setIsEditMode] = useState(false);

    // --- Storage editing state ---
    const [editStorageModalOpen, setEditStorageModalOpen] = useState(false);
    const [currEditStorage, setCurrEditStorage] = useState(null);
    const [isEditStorageMode, setIsEditStorageMode] = useState(false);

    // --- Storage removing state ---
    const [removingStorage, setRemovingStorage] = useState(null);
    const [isRemoving, setIsRemoving] = useState(false);

    // TanStack QueryClient
    const queryClient = useQueryClient();

    /**
     * invalidateAllStorageKeys
     * Invalidates all storage query keys after any mutation (add, edit, delete).
     * @async
     * @param {object} storage - The affected storage object (if available).
     */
    const invalidateAllStorageKeys = async (storage) => {
        logger.info("Invalidating all relevant storage query keys");
        await queryClient.invalidateQueries({ queryKey: storageKeys.all });
        await queryClient.invalidateQueries({ queryKey: storageKeys.lists() });
        await queryClient.invalidateQueries({ queryKey: storageKeys.list() });
        if (storage?.storageId !== undefined && storage?.storageId !== null) {
            await queryClient.invalidateQueries({ queryKey: storageKeys.detail(storage.storageId) });
            await queryClient.invalidateQueries({ queryKey: storageKeys.update(storage.storageId) });
            await queryClient.invalidateQueries({ queryKey: storageKeys.remove(storage.storageId) });
        }
    };

    /**
     * Create storage mutation (with cache invalidation).
     */
    const createStorageMutation = useMutation({
        mutationFn: (payload) => createStorage(payload),
        onSuccess: async (createdStorage) => {
            logger.info("Storage created, invalidating storage keys");
            await invalidateAllStorageKeys(createdStorage);
            setEditStorageModalOpen(false);
            setCurrEditStorage(null);
            setIsEditStorageMode(false);
        },
        onError: (err) => {
            logger.error("createStorage failed", err);
        },
    });

    /**
     * Update storage mutation (with cache invalidation).
     */
    const updateStorageMutation = useMutation({
        mutationFn: ({ storageId, payload }) => updateStorage(storageId, payload),
        onSuccess: async (updatedStorage) => {
            logger.info("Storage updated, invalidating storage keys");
            await invalidateAllStorageKeys(updatedStorage);
            setEditStorageModalOpen(false);
            setCurrEditStorage(null);
            setIsEditStorageMode(false);
        },
        onError: (err) => {
            logger.error("updateStorage failed", err);
        },
    });

    /**
     * Delete storage mutation (with cache invalidation).
     */
    const deleteStorageMutation = useMutation({
        mutationFn: (storageId) => {
            setIsRemoving(true);
            return deleteStorage(storageId);
        },
        onSuccess: async (_data, storageId, context) => {
            logger.info("Storage deleted, invalidating storage keys");
            await invalidateAllStorageKeys({ storageId });
            setRemovingStorage(null);
            setIsRemoving(false);
        },
        onError: (err) => {
            logger.error("deleteStorage failed", err);
            setIsRemoving(false);
        },
    });

    // Select the first building whenever the building list changes
    useEffect(() => {
        if ((buildings ?? []).length > 0 && !selectedBuildingId) {
            setSelectedBuildingId(buildings[0].buildingId);
        }
    }, [buildings, selectedBuildingId]);

    // For building edit: Open modal if editingId changes
    useEffect(() => {
        if (editingId != null) {
            const building = buildings.find(b => b.buildingId === editingId);
            setCurrEditBuilding(building);
            setIsEditMode(true);
            setEditBuildingModalOpen(true);
        } else if (!addingBuilding) {
            setEditBuildingModalOpen(false);
            setCurrEditBuilding(null);
        }
    }, [editingId, buildings, addingBuilding]);

    // For add: Open modal if addingBuilding becomes true
    useEffect(() => {
        if (addingBuilding) {
            setCurrEditBuilding(EMPTY_BUILDING);
            setIsEditMode(false);
            setEditBuildingModalOpen(true);
        } else if (!editingId) {
            setEditBuildingModalOpen(false);
            setCurrEditBuilding(null);
        }
    }, [addingBuilding, editingId]);

    // Find the selected building (with storage) for the lower panel
    const selectedBuildingWithStorage = React.useMemo(() => {
        if (!Array.isArray(buildingsWithStorage) || !selectedBuildingId) return null;
        return buildingsWithStorage.find(
            (b) => b.buildingId === selectedBuildingId
        );
    }, [buildingsWithStorage, selectedBuildingId]);

    /**
     * Handles building add/save event from modal
     * @param {number|null} buildingId
     * @param {{name: string, address: string, manager: string}} payload
     */
    const handleBuildingModalSave = (buildingId, payload) => {
        logger.info("handleBuildingModalSave", { buildingId, payload });
        if (!buildingId) {
            handleAddBuilding(payload, (error) => {});
        } else {
            handleSaveEdit(buildingId, payload, (error) => {});
        }
    };

    /**
     * Handles modal close/cancel for building
     */
    const handleBuildingModalClose = () => {
        logger.info("Building modal closed or cancelled");
        cancelEditOrAdd();
        setEditBuildingModalOpen(false);
        setCurrEditBuilding(null);
        setIsEditMode(false);
    };

    // --- Storage Modal Integration ---

    /**
     * Opens the edit modal for a storage location
     * @param {object} storage
     */
    const handleEditStorage = (storage) => {
        logger.info("Opening EditStorageModal", { storageId: storage.storageId });
        setCurrEditStorage(storage);
        setIsEditStorageMode(true);
        setEditStorageModalOpen(true);
    };

    /**
     * Opens the add modal for a storage location under the current building
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
     * Handles modal close/cancel for storage
     */
    const handleStorageModalClose = () => {
        logger.info("Storage modal closed or cancelled");
        setEditStorageModalOpen(false);
        setCurrEditStorage(null);
        setIsEditStorageMode(false);
    };

    /**
     * Handles storage add/save event from modal
     * @param {number|null} storageId
     * @param {{name: string, description: string, buildingId: number}} payload
     */
    const handleStorageModalSave = (storageId, payload) => {
        logger.info("handleStorageModalSave", { storageId, payload });
        if (!storageId) {
            createStorageMutation.mutate(payload);
        } else {
            updateStorageMutation.mutate({ storageId, payload });
        }
    };

    /**
     * Called when minus-circle is clicked on a storage card.
     * @param {object} storage
     */
    const handlePromptRemoveStorage = (storage) => {
        setRemovingStorage(storage);
    };

    /**
     * Actually calls the delete mutation.
     * @param {number} storageId
     */
    const confirmRemoveStorage = (storageId) => {
        deleteStorageMutation.mutate(storageId);
    };

    /**
     * Cancels storage removal prompt.
     */
    const cancelRemoveStorage = () => setRemovingStorage(null);

    return (
        <div className={styles.tabRoot}>
            <div className={styles.buildingContainer}>
                <div className={styles.sectionHeaderRow}>
                    <h2 className={styles.sectionTitle}>Buildings</h2>
                    <button
                        className={styles.addUserBtn}
                        type="button"
                        onClick={openAddBuilding}
                    >
                        + Add Building
                    </button>
                </div>
                <div className={styles.cardsScrollRow}>
                    {(buildings ?? []).map((building) => (
                        <BuildingInfoCard
                            key={building.buildingId}
                            building={building}
                            selected={selectedBuildingId === building.buildingId}
                            onClick={() => setSelectedBuildingId(building.buildingId)}
                            onEdit={() => handleEditBuilding(building.buildingId)}
                        />
                    ))}
                </div>

                <div className={styles.storageLocationsContainer}>
                    <div className={styles.storageLocationsHeaderRow}>
                        <h2 className={styles.storageLocationsTitle}>Storage Locations</h2>
                        <button
                            className={styles.addUserBtn}
                            type="button"
                            onClick={handleAddStorage}
                        >
                            + Add Storage
                        </button>
                    </div>
                    <div className={styles.storageSectionPanel}>
                        {isLoadingWithStorage || selectedBuildingId == null ? (
                            <div className={styles.loading}>Loading storage locations…</div>
                        ) : (
                            <StorageLocationsList
                                storageList={selectedBuildingWithStorage?.storage ?? []}
                                onEditStorage={handleEditStorage}
                                onDeleteStorage={handlePromptRemoveStorage}
                            />
                        )}
                    </div>
                </div>
            </div>
            <EditBuildingModal
                building={currEditBuilding}
                open={editBuildingModalOpen}
                isSaving={isEditMode ? editStatus === "saving" : addStatus === "saving"}
                error={null}
                saveState={isEditMode ? editStatus : addStatus}
                onSave={handleBuildingModalSave}
                onClose={handleBuildingModalClose}
            />
            <EditStorageModal
                storage={currEditStorage}
                open={editStorageModalOpen}
                isSaving={
                    isEditStorageMode
                        ? updateStorageMutation.isPending
                        : createStorageMutation.isPending
                }
                error={
                    isEditStorageMode
                        ? updateStorageMutation.error?.message ?? null
                        : createStorageMutation.error?.message ?? null
                }
                saveState={
                    isEditStorageMode
                        ? updateStorageMutation.status
                        : createStorageMutation.status
                }
                onSave={handleStorageModalSave}
                onClose={handleStorageModalClose}
            />
            <ConfirmationModal
                open={!!removingStorage}
                onCancel={cancelRemoveStorage}
                onConfirm={() => confirmRemoveStorage(removingStorage.storageId)}
                title="Are you sure?"
                description={
                    removingStorage
                        ? `Are you sure you want to delete storage location '${removingStorage.name}'? This action cannot be undone.`
                        : ""
                }
                confirmText="Delete"
                cancelText="Cancel"
                isConfirmLoading={isRemoving}
                isCancelLoading={false}
                // You can add confirmClass/confirmDisabled if you have special disables
            />
        </div>
    );
};

/**
 * StorageLocationsList
 * Renders a grid of storage locations under the selected building.
 * @param {object} props
 * @param {Array} props.storageList
 * @param {Function} [props.onEditStorage]
 * @param {Function} [props.onDeleteStorage]
 * @returns {JSX.Element}
 */
const StorageLocationsList = ({ storageList, onEditStorage, onDeleteStorage }) => {
    /**
     * logger for StorageLocationsList component.
     */
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

export default StorageSettingsTab;