import React, { useEffect, useState } from "react";
import styles from "../styles/storagesettingstab.module.css";
import { useStorageSettingsTab } from "../hooks/useStorageSettingsTab";
import BuildingInfoCard from "./BuildingInfoCard";
import StorageInfoCard from "./StorageInfoCard";

/**
 * StorageSettingsTab
 * UI for managing buildings and their storage locations.
 * - Buildings and storage locations are visually grouped in distinct containers matching the project color theme.
 * - Selected building is highlighted and shows storage locations underneath.
 *
 * @component
 * @returns {JSX.Element}
 */
const logger = {
    info: (...args) => console.log("[StorageSettingsTab]", ...args),
    error: (...args) => console.error("[StorageSettingsTab]", ...args),
};

const StorageSettingsTab = () => {
    logger.info("StorageSettingsTab mounted");
    const {
        buildings,
        buildingsWithStorage,
        isPending,
        isError,
        error,
        isLoadingWithStorage,
    } = useStorageSettingsTab();

    const [selectedBuildingId, setSelectedBuildingId] = useState(null);

    // Always select the first building on load/change unless a building is already selected
    useEffect(() => {
        if ((buildings ?? []).length > 0 && !selectedBuildingId) {
            setSelectedBuildingId(buildings[0].buildingId);
        }
    }, [buildings, selectedBuildingId]);

    // Find the selected building (with storage) for the lower panel
    const selectedBuildingWithStorage = React.useMemo(() => {
        if (!Array.isArray(buildingsWithStorage) || !selectedBuildingId) return null;
        return buildingsWithStorage.find(
            (b) => b.buildingId === selectedBuildingId
        );
    }, [buildingsWithStorage, selectedBuildingId]);

    return (
        <div className={styles.tabRoot}>
            <div className={styles.buildingContainer}>
                <div className={styles.sectionHeaderRow}>
                    <h2 className={styles.sectionTitle}>Buildings</h2>
                    <button className={styles.addUserBtn}>+ Add Building</button>
                </div>
                <div className={styles.cardsScrollRow}>
                    {(buildings ?? []).map((building) => (
                        <BuildingInfoCard
                            key={building.buildingId}
                            building={building}
                            selected={selectedBuildingId === building.buildingId}
                            onClick={() => setSelectedBuildingId(building.buildingId)}
                        />
                    ))}
                </div>

                <div className={styles.storageLocationsContainer}>
                    <div className={styles.storageLocationsHeaderRow}>
                        <h2 className={styles.storageLocationsTitle}>Storage Locations</h2>
                    </div>
                    <div className={styles.storageSectionPanel}>
                        {isLoadingWithStorage || selectedBuildingId == null ? (
                            <div className={styles.loading}>Loading storage locations…</div>
                        ) : (
                            <StorageLocationsList
                                storageList={selectedBuildingWithStorage?.storage ?? []}
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

/**
 * StorageLocationsList
 * Renders a grid of storage locations under the selected building.
 * @param {object} props
 * @param {Array} props.storageList
 * @returns {JSX.Element}
 */
const StorageLocationsList = ({ storageList }) => {
    /**
     * logger for StorageLocationsList component.
     */
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
                        <StorageInfoCard key={storage.storageId} storage={storage} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default StorageSettingsTab;