import React, { useState, useEffect } from "react";
import styles from "../styles/storagesettingstab.module.css";
import StorageInfoCard from "./StorageInfoCard";
import EditStorageModal from "../../../../components/editstoragemodal/EditStorageModal";
import ConfirmationModal from "../../../../components/confirmationmodal/ConfirmationModal";
import AlphabeticalSortFilter from "../../../../components/alphabeticalsortfilter/AlphabeticalSortFilter";

/**
 * StorageSettings
 * UI for listing, adding, editing, and deleting storage locations for the selected building.
 *
 * @component
 * @param {object} props - All props/data from useStorageSettingsTab
 * @returns {JSX.Element}
 */
const logger = {
    info: (...args) => console.log("[StorageSettings]", ...args),
    error: (...args) => console.error("[StorageSettings]", ...args),
};

/** @const {object} EMPTY_STORAGE - Default storage object for add modal */
const EMPTY_STORAGE = { name: "", description: "", buildingId: "" };

/**
 * @const {Array} STORAGE_SORT_OPTIONS
 * Dropdown sort options: only A to Z and Z to A
 */
const STORAGE_SORT_OPTIONS = [
    { key: "a-z", label: "A to Z", field: "name", order: "asc" },
    { key: "z-a", label: "Z to A", field: "name", order: "desc" }
];

/**
 * StorageSettings component
 * @component
 * @param {object} props
 * @returns {JSX.Element}
 */
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
    // Modal state
    const [editStorageModalOpen, setEditStorageModalOpen] = useState(false);
    const [currEditStorage, setCurrEditStorage] = useState(null);
    const [isEditStorageMode, setIsEditStorageMode] = useState(false);

    // Delete confirmation modal state
    const [removingStorage, setRemovingStorage] = useState(null);
    const [deleteStatus, setDeleteStatus] = useState("idle");
    const [pendingClose, setPendingClose] = useState(false);

    // Alphabetical sort state (A-Z or Z-A)
    const [sortKey, setSortKey] = useState("a-z");

    /**
     * Sort storage locations according to the current sort selection
     * @function getSortedStorageList
     * @param {Array} list
     */
    const getSortedStorageList = (list) => {
        if (!Array.isArray(list)) return [];
        const opt = STORAGE_SORT_OPTIONS.find(o => o.key === sortKey);
        if (!opt) return list;
        const { field, order } = opt;
        return [...list].sort((a, b) => {
            let aVal = a[field];
            let bVal = b[field];
            aVal = aVal ? aVal.toLowerCase() : "";
            bVal = bVal ? bVal.toLowerCase() : "";
            if (aVal < bVal) return order === "asc" ? -1 : 1;
            if (aVal > bVal) return order === "asc" ? 1 : -1;
            return 0;
        });
    };

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
     * Handles trash icon in EditStorageModal (delete; closes edit modal & triggers confirmation modal)
     * @param {number} storageId
     */
    const handleRequestDelete = (storageId) => {
        logger.info("Delete requested for storage", storageId);
        setEditStorageModalOpen(false);
        setCurrEditStorage(null);
        setIsEditStorageMode(false);
        const found = storageList.find((s) => s.storageId === storageId);
        setRemovingStorage(found);
        setDeleteStatus("idle");
        setPendingClose(false);
    };

    /**
     * Handles trash icon/delete action from grid.
     * @param {object} storage
     */
    const handlePromptRemoveStorage = (storage) => {
        setRemovingStorage(storage);
        setDeleteStatus("idle");
        setPendingClose(false);
    };

    /**
     * Calls the delete mutation; shows badge in modal for status.
     * @param {number} storageId
     */
    const confirmRemoveStorage = (storageId) => {
        setDeleteStatus("deleting");
        deleteStorageMutation.mutate(storageId, {
            onSuccess: () => {
                setDeleteStatus("deleted");
                setPendingClose(true);
                setTimeout(() => {
                    setDeleteStatus("idle");
                    setRemovingStorage(null);
                    setPendingClose(false);
                }, 1000);
            },
            onError: () => {
                setDeleteStatus("error");
                setPendingClose(false);
                setTimeout(() => setDeleteStatus("idle"), 1400);
            }
        });
    };

    /**
     * Cancels storage removal prompt.
     */
    const cancelRemoveStorage = () => {
        setRemovingStorage(null);
        setDeleteStatus("idle");
        setPendingClose(false);
    };

    /**
     * Auto-close EditStorageModal after save (add or edit).
     */
    useEffect(() => {
        const status = isEditStorageMode ? storageEditStatus : storageAddStatus;
        if (editStorageModalOpen && status === "saved") {
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
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <button
                        className={styles.addUserBtn}
                        type="button"
                        onClick={handleAddStorage}
                    >
                        + New
                    </button>
                    <AlphabeticalSortFilter value={sortKey} onChange={setSortKey} />
                </div>
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
                        storageList={getSortedStorageList(storageList) ?? []}
                        onEditStorage={handleEditStorage}
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
                onDelete={handleRequestDelete}
            />
            <ConfirmationModal
                open={!!removingStorage}
                onCancel={cancelRemoveStorage}
                onConfirm={() => confirmRemoveStorage(removingStorage?.storageId)}
                title="Delete Storage"
                description={
                    removingStorage
                        ? `Are you sure you want to delete storage location '${removingStorage.name || "this storage location"}'? This action cannot be undone.`
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
 * Renders a grid of storage locations under the selected building.
 * @param {object} props
 * @param {Array} props.storageList
 * @param {Function} [props.onEditStorage]
 * @returns {JSX.Element}
 */
const StorageLocationsList = ({ storageList, onEditStorage }) => {
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
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default StorageSettings;