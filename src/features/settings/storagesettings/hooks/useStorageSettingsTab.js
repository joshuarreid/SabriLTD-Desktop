import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    createBuilding,
    deleteBuilding,
    getAllBuildings,
    updateBuilding,
} from "../../../../api/building/building";
import {
    createStorage,
    updateStorage,
    deleteStorage,
    getAllStorage,
} from "../../../../api/storage/storage";
import { buildingKeys } from "../../../../api/building/buildingQueryKeys";
import { storageKeys } from "../../../../api/storage/storageQueryKeys";

/**
 * logger for useStorageSettingsTab hook (Bulletproof React: business logic, robust logging).
 * @constant
 * @type {{info: Function, error: Function}}
 */
const logger = {
    info: (...args) => console.log("[useStorageSettingsTab]", ...args),
    error: (...args) => console.error("[useStorageSettingsTab]", ...args),
};

/**
 * useStorageSettingsTab
 * Manages business logic, side effects, TanStack Query, and state for storage/building settings.
 * Decouples storage queries/mutations per building (Bulletproof React).
 *
 * @returns {object} All hook state, query status, and action handlers for UI.
 */
export const useStorageSettingsTab = () => {
    logger.info("useStorageSettingsTab initialized");

    /**
     * Locally selected building. Set to a valid buildingId to filter storage queries.
     * @type {[number|null, Function]}
     */
    const [selectedBuildingId, setSelectedBuildingId] = useState(null);

    /**
     * Query for all buildings (paginated, filtered).
     */
    const {
        data: buildings = [],
        isPending: isBuildingsPending,
        isError: isBuildingsError,
        error: buildingsError,
    } = useQuery({
        queryKey: buildingKeys.lists(),
        queryFn: () => getAllBuildings(),
    });

    /**
     * Query for storage locations for the active building.
     * Only fetches when a building is selected.
     */
    const {
        data: storageList = [],
        isPending: isStoragePending,
        isError: isStorageError,
        error: storageError,
    } = useQuery({
        queryKey: storageKeys.list({ buildingId: selectedBuildingId }),
        queryFn: () =>
            selectedBuildingId != null
                ? getAllStorage({ buildingId: selectedBuildingId })
                : [],
        enabled: !!selectedBuildingId,
    });

    /**
     * react-query's QueryClient for cache and invalidation.
     */
    const queryClient = useQueryClient();

    // --- Building mutations and UI states ---
    const [editStatus, setEditStatus] = useState("idle");
    const [addStatus, setAddStatus] = useState("idle");
    const [editingId, setEditingId] = useState(null);
    const [removingId, setRemovingId] = useState(null);
    const [addingBuilding, setAddingBuilding] = useState(false);

    // Building DELETE modal status for indicator in confirmation modal
    const [buildingDeleteId, setBuildingDeleteId] = useState(null);
    const [buildingDeleteStatus, setBuildingDeleteStatus] = useState("idle");

    /**
     * Invalidates all relevant building queries after a mutation.
     * @async
     * @function invalidateAllBuildingKeys
     * @param {object} building - The building affected (may be partial).
     */
    const invalidateAllBuildingKeys = async (building) => {
        logger.info("Invalidating all relevant building query keys");
        await queryClient.invalidateQueries({ queryKey: buildingKeys.all });
        await queryClient.invalidateQueries({ queryKey: buildingKeys.lists() });
        await queryClient.invalidateQueries({ queryKey: buildingKeys.list() });
        if (building?.buildingId) {
            await queryClient.invalidateQueries({ queryKey: buildingKeys.detail(building.buildingId) });
            await queryClient.invalidateQueries({ queryKey: buildingKeys.update(building.buildingId) });
            await queryClient.invalidateQueries({ queryKey: buildingKeys.remove(building.buildingId) });
        }
    };

    /**
     * Creates/updates/deletes buildings with responsive status management and logging.
     */
    const updateBuildingMutation = useMutation({
        mutationFn: ({ buildingId, building }) => updateBuilding(buildingId, building),
        onMutate: () => setEditStatus("saving"),
        onSuccess: async (_updated, { buildingId, building }) => {
            logger.info("Building updated, invalidating building keys");
            await invalidateAllBuildingKeys({ ...building, buildingId });
            setEditStatus("saved");
            setTimeout(() => setEditStatus("idle"), 1800);
        },
        onError: (err) => {
            logger.error("updateBuilding failed", err);
            setEditStatus("error");
            setTimeout(() => setEditStatus("idle"), 1800);
        },
    });

    const deleteBuildingMutation = useMutation({
        mutationFn: deleteBuilding,
        onMutate: () => setBuildingDeleteStatus("deleting"),
        onSuccess: async (_data, buildingId) => {
            logger.info("Building deleted, invalidating building keys");
            setBuildingDeleteStatus("deleted");
            await invalidateAllBuildingKeys({ buildingId });
            setTimeout(() => {
                setBuildingDeleteStatus("idle");
                setBuildingDeleteId(null);
                setEditingId(null);
            }, 1000);
        },
        onError: (err) => {
            logger.error("deleteBuilding failed", err);
            setBuildingDeleteStatus("error");
            setTimeout(() => {
                setBuildingDeleteStatus("idle");
                setBuildingDeleteId(null);
            }, 1400);
        },
    });

    const createBuildingMutation = useMutation({
        mutationFn: createBuilding,
        onMutate: () => setAddStatus("saving"),
        onSuccess: async (createdBuilding) => {
            logger.info("Building created, invalidating building keys");
            await invalidateAllBuildingKeys(createdBuilding);
            setAddStatus("saved");
            setTimeout(() => setAddStatus("idle"), 1800);
        },
        onError: (err) => {
            logger.error("createBuilding failed", err);
            setAddStatus("error");
            setTimeout(() => setAddStatus("idle"), 1800);
        },
    });

    // --- Storage mutations and UI states (per-building only) ---
    const [storageEditStatus, setStorageEditStatus] = useState("idle");
    const [storageAddStatus, setStorageAddStatus] = useState("idle");

    /**
     * Invalidates storage queries for a specific building after mutation.
     * @async
     * @function invalidateThisBuildingStorage
     * @param {number} buildingId - Building whose storage queries will be invalidated.
     */
    const invalidateThisBuildingStorage = async (buildingId) => {
        logger.info("Invalidating storage for building", buildingId);
        // Invalidate ONLY the list query for the building, not all storage
        await queryClient.invalidateQueries({
            queryKey: storageKeys.list({ buildingId }),
        });
    };

    /**
     * Updates storage by ID and payload. Invalidates only affected building's storage.
     */
    const updateStorageMutation = useMutation({
        mutationFn: ({ storageId, payload }) => updateStorage(storageId, payload),
        onMutate: () => setStorageEditStatus("saving"),
        onSuccess: async (updatedStorage, { storageId, payload }) => {
            logger.info("Storage updated, invalidating keys for buildingId:", payload.buildingId);
            await invalidateThisBuildingStorage(payload.buildingId);
            setStorageEditStatus("saved");
            setTimeout(() => setStorageEditStatus("idle"), 1800);
        },
        onError: (err) => {
            logger.error("updateStorage failed", err);
            setStorageEditStatus("error");
            setTimeout(() => setStorageEditStatus("idle"), 1800);
        },
    });

    /**
     * Creates storage for a building. Invalidates only that building's storage.
     */
    const createStorageMutation = useMutation({
        mutationFn: createStorage,
        onMutate: () => setStorageAddStatus("saving"),
        onSuccess: async (createdStorage) => {
            logger.info("Storage created, invalidating keys for buildingId:", createdStorage.buildingId);
            await invalidateThisBuildingStorage(createdStorage.buildingId);
            setStorageAddStatus("saved");
            setTimeout(() => setStorageAddStatus("idle"), 1800);
        },
        onError: (err) => {
            logger.error("createStorage failed", err);
            setStorageAddStatus("error");
            setTimeout(() => setStorageAddStatus("idle"), 1800);
        },
    });

    /**
     * Deletes storage by ID. Invalidates current building's storage query only.
     */
    const deleteStorageMutation = useMutation({
        mutationFn: deleteStorage,
        onSuccess: async (_data, storageId, variables) => {
            logger.info("Storage deleted, invalidating storage for building", selectedBuildingId);
            await invalidateThisBuildingStorage(selectedBuildingId);
        },
        onError: (err) => {
            logger.error("deleteStorage failed", err);
        },
    });

    // --- Building delete UX state and handlers (for trash can and global modal) ---
    /**
     * State and control handlers for the building delete confirmation.
     */
    /**
     * Triggers building delete UX modal and resets its state.
     * @function triggerBuildingDelete
     * @param {number} buildingId
     */
    const triggerBuildingDelete = (buildingId) => {
        setBuildingDeleteId(buildingId);
        setBuildingDeleteStatus("idle");
    };

    /**
     * Handler for confirming delete in modal, controls badge status and modal control.
     * @function handleConfirmBuildingDelete
     * @param {number} buildingId
     */
    const handleConfirmBuildingDelete = (buildingId) => {
        setBuildingDeleteStatus("deleting");
        logger.info("Building delete confirmed:", buildingId);
        if (deleteBuildingMutation && buildingId) {
            deleteBuildingMutation.mutate(buildingId, {
                // onSuccess and onError are handled in mutation above with badge/modal side effects
            });
        }
    };

    /**
     * Cancels UX modal for delete, always resets state.
     * @function handleCancelBuildingDelete
     */
    const handleCancelBuildingDelete = () => {
        setBuildingDeleteId(null);
        setBuildingDeleteStatus("idle");
    };

    // --- Building actions (UI-handlers, status) ---
    /**
     * Opens add-building modal.
     * @function openAddBuilding
     */
    const openAddBuilding = () => setAddingBuilding(true);

    /**
     * Handles creation of a new building, updating addStatus and modal as needed.
     * @function handleAddBuilding
     * @param {object} building - New building payload.
     * @param {Function} [callback]
     */
    const handleAddBuilding = (building, callback) => {
        logger.info("Creating building:", building.name);
        createBuildingMutation.mutate(building, {
            onSuccess: () => {
                setAddingBuilding(false);
                if (callback) callback(null);
            },
            onError: (error) => {
                if (callback) callback(error);
            },
        });
    };

    /**
     * Opens edit mode for a building by ID.
     * @function handleEditBuilding
     * @param {number} buildingId
     */
    const handleEditBuilding = (buildingId) => setEditingId(buildingId);

    /**
     * Saves edits for a given building, closing edit modal as needed.
     * @function handleSaveEdit
     * @param {number} buildingId
     * @param {object} building
     * @param {Function} [callback]
     */
    const handleSaveEdit = (buildingId, building, callback) => {
        logger.info("Saving edit for building", buildingId, building.name);
        updateBuildingMutation.mutate(
            { buildingId, building },
            {
                onSuccess: () => {
                    setEditingId(null);
                    if (callback) callback(null);
                },
                onError: (err) => {
                    setEditingId(null);
                    if (callback) callback(err);
                },
            }
        );
    };

    /**
     * Opens removal prompt for a building (old prompt, not used for trash/confirmation).
     * @function handleRemoveBuilding
     * @param {number} buildingId
     */
    const handleRemoveBuilding = (buildingId) => setRemovingId(buildingId);

    /**
     * Confirms removal and performs mutation. Only used for the old remove flow, not trash can.
     * @function confirmRemoveBuilding
     * @param {number} buildingId
     */
    const confirmRemoveBuilding = (buildingId) => {
        logger.info("Confirm delete for building", buildingId);
        deleteBuildingMutation.mutate(buildingId, {
            onSuccess: () => setRemovingId(null),
        });
    };

    /**
     * Cancels removal prompt for a building (not global/trash).
     * @function cancelRemoveBuilding
     */
    const cancelRemoveBuilding = () => setRemovingId(null);

    /**
     * Cancels editing or adding states for buildings.
     * @function cancelEditOrAdd
     */
    const cancelEditOrAdd = () => {
        setEditingId(null);
        setAddingBuilding(false);
        setEditStatus("idle");
        setAddStatus("idle");
    };

    return {
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
        // --- Building delete modal state for trash/confirmation ---
        buildingDeleteId,
        buildingDeleteStatus,
        triggerBuildingDelete,
        handleConfirmBuildingDelete,
        handleCancelBuildingDelete,
    };
};