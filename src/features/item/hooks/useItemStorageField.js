/**
 * useItemStorageField.js
 *
 * Business logic/data-fetching for the ItemStorageField UI.
 * - Fetches all buildings, then manages selected buildingId state.
 * - Fetches storage options for the selected building only after buildings are loaded.
 * - Handles add storage mutation and status for "+ New" in the UI.
 * - Handles errors and loading, following Bulletproof React and logging standards.
 *
 * @param {object} param0
 * @param {number|null} [param0.selectedBuildingId]
 * @returns {object}
 */

import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAllBuildings } from "../../../api/building/building.js";
import { getAllStorage, createStorage } from "../../../api/storage/storage.js";
import { buildingKeys } from "../../../api/building/buildingQueryKeys.js";
import { storageKeys } from "../../../api/storage/storageQueryKeys.js";

/**
 * logger for useItemStorageField.
 * @type {{info: Function, error: Function}}
 */
const logger = {
    info: (...args) => console.log("[useItemStorageField]", ...args),
    error: (...args) => console.error("[useItemStorageField]", ...args),
};

/**
 * useItemStorageField
 * Fetches buildings and storages, and handles storage mutations for item-level storage selection UI.
 *
 * - Waits for buildings to be loaded before setting the selected building.
 * - Only fetches storages for the selected building after buildings are loaded and selection is set.
 *
 * @param {object} param0
 * @param {number|null} [param0.selectedBuildingId] - Optionally preselect a building.
 * @returns {object}
 */
export function useItemStorageField({ selectedBuildingId = null } = {}) {
    /**
     * Fetch all buildings.
     */
    const {
        data: buildingsRaw = [],
        isPending: loadingBuildings,
        isError: isBuildingsError,
        error: errorBuildings,
    } = useQuery({
        queryKey: buildingKeys.lists(),
        queryFn: () => getAllBuildings(),
        staleTime: 15 * 60 * 1000, // 15 min
        cacheTime: 60 * 60 * 1000,
    });

    /**
     * Sorted buildings by name.
     */
    const buildings = useMemo(
        () =>
            (Array.isArray(buildingsRaw) ? buildingsRaw : []).sort((a, b) =>
                (a.name || "").localeCompare(b.name || "")
            ),
        [buildingsRaw]
    );

    /**
     * Selected building id state. Only set after buildings are loaded.
     */
    const [selectedBldgId, setSelectedBldgId] = useState(null);

    // Set default selected buildingID after buildings load.
    useEffect(() => {
        if (!loadingBuildings && buildings.length > 0) {
            if (selectedBuildingId) {
                setSelectedBldgId(selectedBuildingId);
            } else if (!selectedBldgId) {
                setSelectedBldgId(buildings[0].buildingId);
            }
        }
    }, [loadingBuildings, buildings, selectedBuildingId, selectedBldgId]);

    /**
     * Always reflect available selected building object.
     */
    const selectedBldg = useMemo(
        () =>
            buildings.find(
                (b) => String(b.buildingId) === String(selectedBldgId)
            ) || null,
        [buildings, selectedBldgId]
    );

    /**
     * Fetch storages for the selected building.
     * Only enabled if buildings are loaded and selected building is set.
     */
    const {
        data: storageRaw = [],
        isPending: loadingStorages,
        isError: isStoragesError,
        error: errorStorages,
    } = useQuery({
        queryKey: storageKeys.list({ buildingId: selectedBldgId }),
        queryFn: () =>
            selectedBldgId ? getAllStorage({ buildingId: selectedBldgId }) : [],
        enabled: !!selectedBldgId && !loadingBuildings && buildings.length > 0,
        staleTime: 12 * 60 * 1000,
        cacheTime: 50 * 60 * 1000,
    });

    /**
     * Sorted storages by name.
     */
    const storages = useMemo(
        () =>
            (Array.isArray(storageRaw) ? storageRaw : []).sort((a, b) =>
                (a.name || "").localeCompare(b.name || "")
            ),
        [storageRaw]
    );

    // --- Storage ADD mutation and UI states ---
    const queryClient = useQueryClient();

    const [storageAddStatus, setStorageAddStatus] = useState("idle");

    /**
     * Invalidates storage queries for a specific building after mutation.
     * @async
     * @function invalidateThisBuildingStorage
     * @param {number} buildingId - Building whose storage queries will be invalidated.
     */
    const invalidateThisBuildingStorage = async (buildingId) => {
        logger.info("Invalidating storage for building", buildingId);
        await queryClient.invalidateQueries({
            queryKey: storageKeys.list({ buildingId }),
        });
    };

    /**
     * Storage add mutation. Mirrors useStorageSettingsTab but only for add.
     */
    const createStorageMutation = useMutation({
        mutationFn: createStorage,
        onMutate: () => setStorageAddStatus("saving"),
        onSuccess: async (createdStorage) => {
            logger.info("[useItemStorageField] Storage created, invalidating keys for buildingId:", createdStorage.buildingId);
            await invalidateThisBuildingStorage(createdStorage.buildingId);
            setStorageAddStatus("saved");
            setTimeout(() => setStorageAddStatus("idle"), 1500);
        },
        onError: (err) => {
            logger.error("[useItemStorageField] createStorage failed", err);
            setStorageAddStatus("error");
            setTimeout(() => setStorageAddStatus("idle"), 2200);
        },
    });

    return {
        buildings,
        selectedBldg,
        setSelectedBldgId,
        storages,
        loadingBuildings,
        errorBuildings:
            isBuildingsError && errorBuildings
                ? errorBuildings.message || "Error loading buildings"
                : "",
        loadingStorages,
        errorStorages:
            isStoragesError && errorStorages
                ? errorStorages.message || "Error loading storage"
                : "",
        createStorageMutation,
        storageAddStatus,
    };
}

export default useItemStorageField;