import React, { useEffect, useState } from "react";
import styles from "../styles/storagesettingstab.module.css";
import BuildingInfoCard from "./BuildingInfoCard";
import EditBuildingModal from "../../../../components/editbuildingmodal/EditBuildingModal";
import ConfirmationModal from "../../../../components/confirmationmodal/ConfirmationModal";

/**
 * BuildingSettings
 * UI component for managing buildings list and editing/adding/deleting buildings.
 * Delegates business logic to the parent hook.
 *
 * @param {object} props - All props/data from useStorageSettingsTab
 */
const logger = {
    info: (...args) => console.log("[BuildingSettings]", ...args),
    error: (...args) => console.error("[BuildingSettings]", ...args),
};

const EMPTY_BUILDING = { name: "", address: "", manager: "" };

const BuildingSettings = ({
                              buildings,
                              isBuildingsPending,
                              isBuildingsError,
                              buildingsError,
                              selectedBuildingId,
                              setSelectedBuildingId,
                              editingId,
                              addingBuilding,
                              openAddBuilding,
                              handleAddBuilding,
                              handleEditBuilding,
                              handleSaveEdit,
                              cancelEditOrAdd,
                              editStatus,
                              addStatus,
                              buildingDeleteId,
                              buildingDeleteStatus,
                              triggerBuildingDelete,
                              handleConfirmBuildingDelete,
                              handleCancelBuildingDelete,
                          }) => {
    // Modal local state
    const [editBuildingModalOpen, setEditBuildingModalOpen] = useState(false);
    const [currEditBuilding, setCurrEditBuilding] = useState(null);
    const [isEditMode, setIsEditMode] = useState(false);

    // Modal UI synchronization (extracts business state from hook)
    useEffect(() => {
        if (editingId != null) {
            const building = buildings.find((b) => b.buildingId === editingId);
            setCurrEditBuilding(building);
            setIsEditMode(true);
            setEditBuildingModalOpen(true);
        } else if (!addingBuilding) {
            setEditBuildingModalOpen(false);
            setCurrEditBuilding(null);
        }
    }, [editingId, buildings, addingBuilding]);

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

    /**
     * Handles trash click in building modal (initiate global delete state/modal).
     */
    const handleRequestBuildingDelete = (buildingId) => {
        triggerBuildingDelete(buildingId);
    };

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
        <>
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
            <EditBuildingModal
                building={currEditBuilding}
                open={editBuildingModalOpen}
                isSaving={isEditMode ? editStatus === "saving" : addStatus === "saving"}
                error={null}
                saveState={isEditMode ? editStatus : addStatus}
                onSave={handleBuildingModalSave}
                onClose={handleBuildingModalClose}
                onDelete={handleRequestBuildingDelete}
            />
            {/* Global delete modal for buildings */}
            <ConfirmationModal
                open={!!buildingDeleteId}
                onCancel={handleCancelBuildingDelete}
                onConfirm={() => handleConfirmBuildingDelete(buildingDeleteId)}
                title="Delete Building"
                description="Deleting this building will also remove all associated storage. This action cannot be undone."
                confirmText="Delete"
                cancelText="Cancel"
                isConfirmLoading={buildingDeleteStatus === "deleting"}
                isCancelLoading={false}
                deleteStatus={buildingDeleteStatus}
            />
        </>
    );
};

export default BuildingSettings;