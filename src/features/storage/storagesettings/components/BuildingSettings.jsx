import React, { useEffect, useState } from "react";
import styles from "../styles/storagesettingstab.module.css";
import { BuildingInfoCard } from "../../../building/components/BuildingInfoCard";
import EditBuildingModal from "../../../building/components/EditBuildingModal";
import ConfirmationModal from "../../../../components/confirmationmodal/ConfirmationModal";
import useModal from "../../../../components/modal/hooks/useModal.js";

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
    const editModal = useModal(false);
    const [currEditBuilding, setCurrEditBuilding] = useState(null);
    const [isEditMode, setIsEditMode] = useState(false);

    // Modal UI synchronization (extracts business state from hook)
    useEffect(() => {
        if (editingId != null) {
            const building = buildings.find((b) => b.buildingId === editingId);
            setCurrEditBuilding(building);
            setIsEditMode(true);
            editModal.openModal();
        } else if (!addingBuilding) {
            editModal.closeModal();
            setCurrEditBuilding(null);
        }
    }, [editingId, buildings, addingBuilding]);

    useEffect(() => {
        if (addingBuilding) {
            setCurrEditBuilding(EMPTY_BUILDING);
            setIsEditMode(false);
            editModal.openModal();
        } else if (!editingId) {
            editModal.closeModal();
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
            handleAddBuilding(payload, (error) => {});
        } else {
            handleSaveEdit(buildingId, payload, (error) => {});
        }
    };

    /**
     * Handles trash click in building modal (initiate global delete state/modal).
     */
    const handleRequestBuildingDelete = (buildingId) => {
        triggerBuildingDelete(buildingId);
    };

    // Safe wrappers to always open modal, even for same building/add
    const safeHandleEditBuilding = (id) => {
        cancelEditOrAdd(); // Reset editingId/addingBuilding in parent
        setTimeout(() => handleEditBuilding(id), 0);
    };
    const safeOpenAddBuilding = () => {
        cancelEditOrAdd(); // Reset editingId/addingBuilding in parent
        setTimeout(() => openAddBuilding(), 0);
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
                <h2 className={styles.sectionTitle}>Manage Buildings</h2>
                <button
                    className={styles.addUserBtn}
                    type="button"
                    onClick={safeOpenAddBuilding}
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
                        onEdit={() => safeHandleEditBuilding(building.buildingId)}
                    />
                ))}
            </div>
            {editModal.open && currEditBuilding && (
                <EditBuildingModal
                    building={currEditBuilding}
                    open={editModal.open}
                    isSaving={
                        isEditMode
                            ? editStatus === "saving"
                            : addStatus === "saving"
                    }
                    error={null}
                    saveState={isEditMode ? editStatus : addStatus}
                    onSave={handleBuildingModalSave}
                    onClose={editModal.closeModal}
                    onDelete={handleRequestBuildingDelete}
                />
            )}
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