import React, { useEffect, useState } from "react";
import styles from "../styles/storagesettingstab.module.css";
import { useStorageSettingsTab } from "../hooks/useStorageSettingsTab";
import BuildingInfoCard from "./BuildingInfoCard";
import StorageInfoCard from "./StorageInfoCard";
import EditBuildingModal from "../../../components/editbuildingmodal/EditBuildingModal";


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

    // Select the first building whenever the building list changes
    useEffect(() => {
        if ((buildings ?? []).length > 0 && !selectedBuildingId) {
            setSelectedBuildingId(buildings[0].buildingId);
        }
    }, [buildings, selectedBuildingId]);

    // For edit: Open modal if editingId changes
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
            handleAddBuilding(payload, (error) => {
                // Modal and state will be reset by addStatus
            });
        } else {
            handleSaveEdit(buildingId, payload, (error) => {
                // Modal and state will be reset by editStatus
            });
        }
    };

    /**
     * Handles modal close/cancel
     */
    const handleModalClose = () => {
        logger.info("Building modal closed or cancelled");
        cancelEditOrAdd();
        setEditBuildingModalOpen(false);
        setCurrEditBuilding(null);
        setIsEditMode(false);
    };

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
                    </div>
                    <div className={styles.storageSectionPanel}>
                        {isLoadingWithStorage || selectedBuildingId == null ? (
                            <div className={styles.loading}>Loading storage locations…</div>
                        ) : (
                            <StorageLocationsList
                                storageList={selectedBuildingWithStorage?.storage ?? []}
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
                onClose={handleModalClose}
            />
        </div>
    );
};

/**
 * StorageLocationsList
 * Renders a grid of storage locations under the selected building.
 * @param {object} props
 * @param {Array} props.storageList
 * @returns {JSX.Element}
 */
const StorageLocationsList = ({ storageList }) => {
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
                        <StorageInfoCard key={storage.storageId} storage={storage} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default StorageSettingsTab;