import React, { useEffect } from "react";
import styles from "../styles/storagesettingstab.module.css";
import { useStorageSettingsTab } from "../hooks/useStorageSettingsTab";
import BuildingInfoCard from "./BuildingInfoCard";
import StorageInfoCard from "./StorageInfoCard";
import EditBuildingModal from "../../../../components/editbuildingmodal/EditBuildingModal";
import EditStorageModal from "../../../../components/editstoragemodal/EditStorageModal";
import ConfirmationModal from "../../../../components/confirmationmodal/ConfirmationModal";

/**
 * StorageSettingsTab
 * UI for managing buildings and their storage locations, following Bulletproof React conventions.
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
        isBuildingsPending,
        isBuildingsError,
        buildingsError,
        selectedBuildingId,
        setSelectedBuildingId,
        storageList,
        isStoragePending,
        isStorageError,
        storageError,
        editingId,
        removingId,
        addingBuilding,
        openAddBuilding,
        handleAddBuilding,
        handleEditBuilding,
        handleSaveEdit,
        handleRemoveBuilding,
        confirmRemoveBuilding,
        cancelRemoveBuilding,
        cancelEditOrAdd,
        editStatus,
        addStatus,
        storageEditStatus,
        storageAddStatus,
        createStorageMutation,
        updateStorageMutation,
        deleteStorageMutation,
    } = useStorageSettingsTab();

    // --- Modal local state
    const [editBuildingModalOpen, setEditBuildingModalOpen] = React.useState(false);
    const [currEditBuilding, setCurrEditBuilding] = React.useState(null);
    const [isEditMode, setIsEditMode] = React.useState(false);

    // Storage modal local state
    const [editStorageModalOpen, setEditStorageModalOpen] = React.useState(false);
    const [currEditStorage, setCurrEditStorage] = React.useState(null);
    const [isEditStorageMode, setIsEditStorageMode] = React.useState(false);

    // Storage remove local state
    const [removingStorage, setRemovingStorage] = React.useState(null);
    const [isRemoving, setIsRemoving] = React.useState(false);
    const [deleteStatus, setDeleteStatus] = React.useState("idle"); // 'deleting' | 'deleted' | 'error' | 'idle'

    // Set the first building as selected on load
    useEffect(() => {
        if ((buildings ?? []).length > 0 && !selectedBuildingId) {
            setSelectedBuildingId(buildings[0].buildingId);
        }
    }, [buildings, selectedBuildingId, setSelectedBuildingId]);

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

    /**
     * Handles building add/save event from modal.
     * @param {number|null} buildingId
     * @param {{name: string, address: string, manager: string}} payload
     */
    const handleBuildingModalSave = (buildingId, payload) => {
        logger.info("handleBuildingModalSave", { buildingId, payload });
        if (!buildingId) {
            handleAddBuilding(payload, (error) => { });
        } else {
            handleSaveEdit(buildingId, payload, (error) => { });
        }
    };

    /**
     * Handles modal close/cancel for building.
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
     * Always injects current selectedBuildingId.
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

    // --- UI State Handling & Bulletproof React conventions ---

    if (isBuildingsPending) {
        return <div className={styles.loading}>Loading buildings…</div>;
    }
    if (isBuildingsError) {
        return (
            <div className={styles.error}>
                Error: {buildingsError?.message || "Failed to load buildings."}
            </div>
        );
    }

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
                isConfirmLoading={isRemoving}
                isCancelLoading={false}
                deleteStatus={deleteStatus}
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