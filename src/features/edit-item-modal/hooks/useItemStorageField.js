/**
 * useItemStorageField.js
 *
 * Business logic/data-fetching for the ItemStorageField UI.
 * - Fetches all buildings, manages selected buildingId state.
 * - Fetches storage options for the selected building.
 * - Handles errors and loading, following Bulletproof React and logging standards.
 *
 * @param {object} param0
 * @param {number|null} [param0.selectedBuildingId]
 * @returns {object}
 */
import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getAllBuildings } from "../../../api/building/building";
import { getAllStorage } from "../../../api/storage/storage";
import { buildingKeys } from "../../../api/building/buildingQueryKeys";
import { storageKeys } from "../../../api/storage/storageQueryKeys";

/** Logger */
const logger = {
    info: (...args) => console.log("[useItemStorageField]", ...args),
    error: (...args) => console.error("[useItemStorageField]", ...args),
};

/**
 * Fetches buildings, selected building/storages, loading/error status.
 */
export function useItemStorageField({ selectedBuildingId = null } = {}) {
    // Fetch all buildings
    const {
        data: buildingsRaw = [],
        isPending: loadingBuildings,
        isError: isBuildingsError,
        error: errorBuildings,
    } = useQuery({
        queryKey: buildingKeys.lists(),
        queryFn: getAllBuildings,
        staleTime: 15 * 60 * 1000, // 15 min
        cacheTime: 60 * 60 * 1000,
    });

    const buildings = useMemo(
        () =>
            (Array.isArray(buildingsRaw) ? buildingsRaw : []).sort((a, b) =>
                (a.name || "").localeCompare(b.name || "")
            ),
        [buildingsRaw]
    );

    // Local state for which building is selected for this field
    const [selectedBldgId, setSelectedBldgId] = useState(
        selectedBuildingId || (buildings[0]?.buildingId ?? "")
    );
    // Keep selectedBldgId in sync with parent prop if present/changes
    useEffect(() => {
        if (
            selectedBuildingId &&
            (!selectedBldgId || String(selectedBldgId) !== String(selectedBuildingId))
        ) {
            setSelectedBldgId(selectedBuildingId);
        }
        // eslint-disable-next-line
    }, [selectedBuildingId]);

    // Always reflect available selected building object
    const selectedBldg = useMemo(
        () =>
            buildings.find(
                (b) => String(b.buildingId) === String(selectedBldgId)
            ) || null,
        [buildings, selectedBldgId]
    );

    // Fetch storages for selected building
    const {
        data: storageRaw = [],
        isPending: loadingStorages,
        isError: isStoragesError,
        error: errorStorages,
    } = useQuery({
        queryKey: storageKeys.list({ buildingId: selectedBldgId }),
        queryFn: () =>
            selectedBldgId ? getAllStorage({ buildingId: selectedBldgId }) : [],
        enabled: !!selectedBldgId,
        staleTime: 12 * 60 * 1000,
        cacheTime: 50 * 60 * 1000,
    });

    const storages = useMemo(
        () =>
            (Array.isArray(storageRaw) ? storageRaw : []).sort((a, b) =>
                (a.name || "").localeCompare(b.name || "")
            ),
        [storageRaw]
    );

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
    };
}

export default useItemStorageField;