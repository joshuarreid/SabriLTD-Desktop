import React, { useState, useEffect } from "react";
import styles from "../styles/storagesettingstab.module.css";
import StorageInfoCard from "../../components/StorageInfoCard.jsx";
import EditStorageModal from "../../components/EditStorageModal.jsx";
import ConfirmationModal from "../../../../components/confirmationmodal/ConfirmationModal.jsx";
import AlphabeticalSortFilter from "../../../../components/alphabeticalsortfilter/AlphabeticalSortFilter.js";
import {useNaturalSort} from "../../../../components/alphabeticalsortfilter/useNaturalSort.js";


/**
 * STORAGE_SORT_OPTIONS
 * Dropdown sort options: only A to Z and Z to A (maps to name + order for shared hook)
 * @constant
 * @type {Array<{key: string, label: string, field: string, order: "asc"|"desc"}>}
 */
const STORAGE_SORT_OPTIONS = [
    { key: "a-z", label: "A to Z", field: "name", order: "asc" },
    { key: "z-a", label: "Z to A", field: "name", order: "desc" }
];

/**
 * EMPTY_STORAGE
 * Default storage object for add modal
 * @constant
 * @type {{ name: string, description: string, buildingId: string }}
 */
const EMPTY_STORAGE = { name: "", description: "", buildingId: "" };

/**
 * logger
 * Standardized logger for StorageSettings
 * @constant
 * @type {{info: Function, error: Function}}
 */
const logger = {
    info: (...args) => console.log("[StorageSettings]", ...args),
    error: (...args) => console.error("[StorageSettings]", ...args),
};

/**
 * StorageSettings
 * UI for listing, adding, editing, and deleting storage locations for the selected building.
 *
 * @component
 * @param {object} props - All props/data from useStorageSettingsTab
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
     * Determine correct sort options for useNaturalSort,
     * keeping the interface as close as possible to before.
     */
    const currentSort = STORAGE_SORT_OPTIONS.find(opt => opt.key === sortKey) || STORAGE_SORT_OPTIONS[0];

    /**
     * Sorted storageList using shared useNaturalSort hook.
     * @type {Array}
     */
    const sortedStorageList = useNaturalSort(storageList, {
        key: currentSort.field,
        order: currentSort.order,
    });

    /**
     * Opens the edit modal for a storage location.
     * @function
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
     * @function
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
     * @function
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
     * @function
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
     * @function
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
     * @function
     * @param {object} storage
     */
    const handlePromptRemoveStorage = (storage) => {
        setRemovingStorage(storage);
        setDeleteStatus("idle");
        setPendingClose(false);
    };

    /**
     * Calls the delete mutation; shows badge in modal for status.
     * @function
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
     * @function
     */
    const cancelRemoveStorage = () => {
        setRemovingStorage(null);
        setDeleteStatus("idle");
        setPendingClose(false);
    };

    /**
     * Auto-close EditStorageModal after save (add or edit).
     * @function
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
                        storageList={sortedStorageList ?? []}
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