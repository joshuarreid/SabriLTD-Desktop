import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    createBuilding,
    deleteBuilding,
    getAllBuildings,
    updateBuilding,
} from "../../building/api/building.ts";
import { useAllStorage, useCreateStorage, useUpdateStorage, useDeleteStorage } from "./useStorage";
import { buildingKeys } from "../../building/api/buildingQueryKeys.ts";
import type { Building } from "../../building/api/building.types";
import type { Storage } from "../api/storage.types";

/**
 * logger for useStorageSettingsTab hook (Bulletproof React: business logic, robust logging).
 * @constant
 * @type {{info: Function, error: Function}}
 */
const logger = {
    info: (...args: any[]) => console.log("[useStorageSettingsTab]", ...args),
    error: (...args: any[]) => console.error("[useStorageSettingsTab]", ...args),
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
    const [selectedBuildingId, setSelectedBuildingId] = useState<number | null>(null);

    /**
     * Query for all buildings (paginated, filtered).
     */
    const {
        data: buildings = [],
        isPending: isBuildingsPending,
        isError: isBuildingsError,
        error: buildingsError,
    } = useQuery<Building[]>({
        queryKey: buildingKeys.lists(),
        queryFn: () => getAllBuildings(),
    });

    // --- Storage queries and mutations (now via hooks) ---
    const {
        data: storageList = [],
        isPending: isStoragePending,
        isError: isStorageError,
        error: storageError,
    } = useAllStorage(selectedBuildingId ?? undefined);

    const createStorageMutation = useCreateStorage();
    const updateStorageMutation = useUpdateStorage();
    const deleteStorageMutation = useDeleteStorage();

    /**
     * react-query's QueryClient for cache and invalidation.
     */
    const queryClient = useQueryClient();

    // --- Building mutations and UI states ---
    const [editStatus, setEditStatus] = useState<string>("idle");
    const [addStatus, setAddStatus] = useState<string>("idle");
    const [editingId, setEditingId] = useState<number | null>(null);
    const [removingId, setRemovingId] = useState<number | null>(null);
    const [addingBuilding, setAddingBuilding] = useState<boolean>(false);

    // Building DELETE modal status for indicator in confirmation modal
    const [buildingDeleteId, setBuildingDeleteId] = useState<number | null>(null);
    const [buildingDeleteStatus, setBuildingDeleteStatus] = useState<string>("idle");

    /**
     * Invalidates all relevant building queries after a mutation.
     * @async
     * @function invalidateAllBuildingKeys
     * @param {object} building - The building affected (may be partial).
     */
    const invalidateAllBuildingKeys = async (building?: Partial<Building>) => {
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
        mutationFn: ({ buildingId, building }: { buildingId: number; building: Partial<Building> }) => updateBuilding(buildingId, building),
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
        onSuccess: async (_data, buildingId: number) => {
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
        onSuccess: async (createdBuilding: Building) => {
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

    // --- Building delete UX state and handlers (for trash can and global modal) ---
    /**
     * State and control handlers for the building delete confirmation.
     */
    /**
     * Triggers building delete UX modal and resets its state.
     * @function triggerBuildingDelete
     * @param {number} buildingId
     */
    const triggerBuildingDelete = (buildingId: number) => {
        setBuildingDeleteId(buildingId);
        setBuildingDeleteStatus("idle");
    };

    /**
     * Handler for confirming delete in modal, controls badge status and modal control.
     * @function handleConfirmBuildingDelete
     * @param {number} buildingId
     */
    const handleConfirmBuildingDelete = (buildingId: number) => {
        setBuildingDeleteStatus("deleting");
        logger.info("Building delete confirmed:", buildingId);
        if (deleteBuildingMutation && buildingId) {
            deleteBuildingMutation.mutate(buildingId);
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
    const handleAddBuilding = (building: Partial<Building>, callback?: (err: any) => void) => {
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
    const handleEditBuilding = (buildingId: number) => setEditingId(buildingId);

    /**
     * Saves edits for a given building, closing edit modal as needed.
     * @function handleSaveEdit
     * @param {number} buildingId
     * @param {object} building
     * @param {Function} [callback]
     */
    const handleSaveEdit = (buildingId: number, building: Partial<Building>, callback?: (err: any) => void) => {
        logger.info("Saving edit for building", buildingId, building.name);
        updateBuildingMutation.mutate(
            { buildingId, building },
            {
                onSuccess: () => {
                    setEditingId(null);
                },
                onError: (error) => {
                    if (callback) callback(error);
                },
            }
        );
    };

    return {
        // Buildings list/query state
        buildings,
        isBuildingsPending,
        isBuildingsError,
        buildingsError,

        // Storage list/query state
        storageList,
        isStoragePending,
        isStorageError,
        storageError,

        // Selected building ID and setter
        selectedBuildingId,
        setSelectedBuildingId,

        // Building mutations and UI states
        editStatus,
        addStatus,
        editingId,
        removingId,
        addingBuilding,
        buildingDeleteId,
        buildingDeleteStatus,
        triggerBuildingDelete,
        handleConfirmBuildingDelete,
        handleCancelBuildingDelete,

        // Building action handlers
        openAddBuilding,
        handleAddBuilding,
        handleEditBuilding,
        handleSaveEdit,

        // Storage mutations and UI states
        updateStorageMutation,
        createStorageMutation,
        deleteStorageMutation,
        // Optionally expose status from mutation objects for UI
        storageEditStatus: updateStorageMutation.status,
        storageAddStatus: createStorageMutation.status,
    };
};
