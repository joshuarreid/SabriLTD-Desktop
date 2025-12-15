import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    createBuilding,
    deleteBuilding,
    getAllBuildings,
    getBuildingById,
    updateBuilding,
    getBuildingsWithStorage,
} from "../../../api/building/building";
import { buildingKeys } from "../../../api/building/buildingQueryKeys";

/**
 * logger for useStorageSettingsTab hook.
 * @type {{info: Function, error: Function}}
 */
const logger = {
    info: (...args) => console.log("[useStorageSettingsTab]", ...args),
    error: (...args) => console.error("[useStorageSettingsTab]", ...args),
};

/**
 * invalidateAllBuildingKeys
 * Invalidates all building query keys after any building mutation (add, update, delete).
 * Includes: all, lists, list, detail, withStorage.
 *
 * @async
 * @function invalidateAllBuildingKeys
 * @param {object} queryClient - The TanStack Query client.
 * @param {object} building - The affected building object (if available).
 */
const invalidateAllBuildingKeys = async (queryClient, building) => {
    logger.info("Invalidating all relevant building query keys");
    await queryClient.invalidateQueries({ queryKey: buildingKeys.all });
    await queryClient.invalidateQueries({ queryKey: buildingKeys.lists() });
    await queryClient.invalidateQueries({ queryKey: buildingKeys.list() });
    if (building?.buildingId !== undefined && building?.buildingId !== null) {
        await queryClient.invalidateQueries({ queryKey: buildingKeys.detail(building.buildingId) });
        await queryClient.invalidateQueries({ queryKey: buildingKeys.update(building.buildingId) });
        await queryClient.invalidateQueries({ queryKey: buildingKeys.remove(building.buildingId) });
    }
    await queryClient.invalidateQueries({ queryKey: buildingKeys.withStorage() });
    await queryClient.invalidateQueries({ queryKey: buildingKeys.withStorageList() });
};

/**
 * useStorageSettingsTab
 * Encapsulates business logic/state for buildings table in storage settings.
 *
 * @returns {object} - State and handlers for managing buildings.
 */
export const useStorageSettingsTab = () => {
    logger.info("useStorageSettingsTab initialized");

    // Query hooks for buildings
    const { data: buildings = [], isPending, isError, error } = useQuery({
        queryKey: buildingKeys.lists(),
        queryFn: () => getAllBuildings(),
    });

    // Aggregated buildings with storages, useful for advanced usage/sections
    const { data: buildingsWithStorage = [], isLoading: isLoadingWithStorage } = useQuery({
        queryKey: buildingKeys.withStorage(),
        queryFn: () => getBuildingsWithStorage(),
    });

    // Mutations
    const queryClient = useQueryClient();
    const [editStatus, setEditStatus] = useState("idle");
    const [addStatus, setAddStatus] = useState("idle");

    /**
     * Update building mutation with full cache invalidation on success.
     */
    const updateBuildingMutation = useMutation({
        mutationFn: ({ buildingId, building }) => updateBuilding(buildingId, building),
        onMutate: () => setEditStatus("saving"),
        onSuccess: async (_updatedBuilding, { buildingId, building }) => {
            logger.info("Building updated, invalidating building keys");
            await invalidateAllBuildingKeys(queryClient, { ...building, buildingId });
            setEditStatus("saved");
            setTimeout(() => setEditStatus("idle"), 1800);
        },
        onError: (err) => {
            logger.error("updateBuilding failed", err);
            setEditStatus("error");
            setTimeout(() => setEditStatus("idle"), 1800);
        },
    });

    /**
     * Delete building mutation with full cache invalidation on success.
     */
    const deleteBuildingMutation = useMutation({
        mutationFn: (buildingId) => deleteBuilding(buildingId),
        onSuccess: async (_data, buildingId) => {
            logger.info("Building deleted, invalidating building keys");
            await invalidateAllBuildingKeys(queryClient, { buildingId });
        },
        onError: (err) => logger.error("deleteBuilding failed", err),
    });

    /**
     * Create building mutation with full cache invalidation on success.
     */
    const createBuildingMutation = useMutation({
        mutationFn: (building) => createBuilding(building),
        onMutate: () => setAddStatus("saving"),
        onSuccess: async (createdBuilding) => {
            logger.info("Building created, invalidating building keys");
            await invalidateAllBuildingKeys(queryClient, createdBuilding);
            setAddStatus("saved");
            setTimeout(() => setAddStatus("idle"), 1800);
        },
        onError: (err) => {
            logger.error("createBuilding failed", err);
            setAddStatus("error");
            setTimeout(() => setAddStatus("idle"), 1800);
        },
    });

    // Local state for UI editing/add/removing
    const [editingId, setEditingId] = useState(null);
    const [removingId, setRemovingId] = useState(null);
    const [addingBuilding, setAddingBuilding] = useState(false);

    /**
     * Opens add new building UX/modal.
     *
     * @function openAddBuilding
     * @returns {void}
     */
    const openAddBuilding = () => setAddingBuilding(true);

    /**
     * Handles creation of a new building.
     *
     * @function handleAddBuilding
     * @param {{name: string, address: string, manager: string}} building
     * @param {function} [callback] - Optional, callback(error) after mutation completes.
     * @returns {void}
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
     * Opens editor for building.
     *
     * @function handleEditBuilding
     * @param {number} buildingId
     * @returns {void}
     */
    const handleEditBuilding = (buildingId) => setEditingId(buildingId);

    /**
     * Handles save/update for an edited building.
     *
     * @function handleSaveEdit
     * @param {number} buildingId
     * @param {{name: string, address: string, manager: string}} building
     * @param {function} [callback]
     * @returns {void}
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
     * Triggers UI to confirm removal for building.
     *
     * @function handleRemoveBuilding
     * @param {number} buildingId
     * @returns {void}
     */
    const handleRemoveBuilding = (buildingId) => setRemovingId(buildingId);

    /**
     * Confirm building delete and call mutation.
     *
     * @function confirmRemoveBuilding
     * @param {number} buildingId
     * @returns {void}
     */
    const confirmRemoveBuilding = (buildingId) => {
        logger.info("Confirm delete for building", buildingId);
        deleteBuildingMutation.mutate(buildingId, {
            onSuccess: () => setRemovingId(null),
        });
    };

    /**
     * Cancel building removal.
     *
     * @function cancelRemoveBuilding
     * @returns {void}
     */
    const cancelRemoveBuilding = () => setRemovingId(null);

    /**
     * Cancel editing or adding a building.
     *
     * @function cancelEditOrAdd
     * @returns {void}
     */
    const cancelEditOrAdd = () => {
        setEditingId(null);
        setAddingBuilding(false);
        setEditStatus("idle");
        setAddStatus("idle");
    };

    return {
        buildings,
        buildingsWithStorage,
        isPending,
        isError,
        error,
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
        isLoadingWithStorage,
    };
};