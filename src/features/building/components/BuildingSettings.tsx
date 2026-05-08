import React, { useEffect, useState } from "react";
import styles from "../../storage/styles/storagesettingstab.module.css";
import { BuildingInfoCard } from "./BuildingInfoCard";
import EditBuildingModal from "./EditBuildingModal";
import CreateBuildingModal from "./CreateBuildingModal";
import ConfirmationModal from "../../../components/confirmationmodal/ConfirmationModal.jsx";
import useModal from "../../../components/modal/hooks/useModal";

// Type definitions
export interface Building {
    buildingId?: number;
    name: string;
    address: string;
    manager: string;
}

interface BuildingSettingsProps {
    buildings: Building[];
    isBuildingsPending: boolean;
    isBuildingsError: boolean;
    buildingsError: any;
    selectedBuildingId: number | null;
    setSelectedBuildingId: (id: number | null) => void;
    editingId: number | null;
    addingBuilding: boolean;
    openAddBuilding: () => void;
    handleAddBuilding: (payload: Omit<Building, "buildingId"> | null, cb: () => void) => void;
    handleEditBuilding: (id: number | null) => void;
    handleSaveEdit: (id: number, payload: Omit<Building, "buildingId">, cb: () => void) => void;
    cancelEditOrAdd: () => void;
    editStatus: string;
    addStatus: string;
    buildingDeleteId: number | null;
    buildingDeleteStatus: string;
    triggerBuildingDelete: (id: number) => void;
    handleConfirmBuildingDelete: (id: number | null) => void;
    handleCancelBuildingDelete: () => void;
}

const logger = {
    info: (...args: any[]) => console.log("[BuildingSettings]", ...args),
    error: (...args: any[]) => console.error("[BuildingSettings]", ...args),
};

const EMPTY_BUILDING: Omit<Building, "buildingId"> = { name: "", address: "", manager: "" };

const BuildingSettings: React.FC<BuildingSettingsProps> = ({
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
    const [currEditBuilding, setCurrEditBuilding] = useState<Building | null>(null);
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
    const handleBuildingModalSave = (buildingId: number | null, payload: Omit<Building, "buildingId">) => {
        logger.info("handleBuildingModalSave", { buildingId, payload });
        if (!buildingId) {
            handleAddBuilding(payload, () => {});
        } else {
            handleSaveEdit(buildingId, payload, () => {});
        }
    };

    /**
     * Handles trash click in building modal (initiate global delete state/modal).
     */
    const handleRequestBuildingDelete = (buildingId: number) => {
        triggerBuildingDelete(buildingId);
    };

    // Safe wrappers to always open modal, even for same building/add
    const safeHandleEditBuilding = (id: number) => {
        if (editingId === id) {
            setSelectedBuildingId(null);
            handleEditBuilding(null);
        } else {
            setSelectedBuildingId(id);
            handleEditBuilding(id);
        }
    };

    const safeOpenAddBuilding = () => {
        if (addingBuilding) {
            handleAddBuilding(null, () => {});
        } else {
            openAddBuilding();
        }
    };

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
            {editModal.open && currEditBuilding && isEditMode && (
                <EditBuildingModal
                    building={currEditBuilding}
                    open={editModal.open}
                    isSaving={editStatus === "saving"}
                    error={null}
                    saveState={editStatus}
                    onSave={handleBuildingModalSave}
                    onClose={editModal.closeModal}
                    onDelete={handleRequestBuildingDelete}
                />
            )}
            {editModal.open && currEditBuilding && !isEditMode && (
                <CreateBuildingModal
                    open={editModal.open}
                    isSaving={addStatus === "saving"}
                    saveState={addStatus}
                    onSave={(data) => handleBuildingModalSave(null, data)}
                    onClose={editModal.closeModal}
                    initialValues={currEditBuilding}
                />
            )}
            <ConfirmationModal
                open={!!buildingDeleteId}
                onCancel={handleCancelBuildingDelete}
                onConfirm={() => handleConfirmBuildingDelete(buildingDeleteId)}
                onSave={handleBuildingModalSave}
                onClose={editModal.closeModal}
                onDelete={handleRequestBuildingDelete}
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