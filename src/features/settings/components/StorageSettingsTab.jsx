import React, { useEffect, useState } from "react";
import styles from "../styles/storagesettingstab.module.css";
import { useStorageSettingsTab } from "../hooks/useStorageSettingsTab";
import { LuWarehouse } from "react-icons/lu";

/**
 * StorageSettingsTab
 * UI for managing buildings and their storage locations.
 * - Visually grouped containers with headings, color, and proportions as seen in example images.
 * - Selected building is highlighted and shows storage locations underneath.
 *
 * @component
 * @returns {JSX.Element}
 */
const StorageSettingsTab = () => {
    const {
        buildings,
        buildingsWithStorage,
        isPending,
        isError,
        error,
        isLoadingWithStorage,
    } = useStorageSettingsTab();

    const [selectedBuildingId, setSelectedBuildingId] = useState(null);

    // Select first building on load
    useEffect(() => {
        if ((buildings ?? []).length > 0) {
            setSelectedBuildingId(buildings[0].buildingId);
        }
    }, [buildings]);

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
                        <button
                            key={building.buildingId}
                            className={
                                styles.buildingCard +
                                (selectedBuildingId === building.buildingId
                                    ? " " + styles.selectedCard
                                    : "")
                            }
                            onClick={() => setSelectedBuildingId(building.buildingId)}
                            type="button"
                            aria-label={
                                selectedBuildingId === building.buildingId
                                    ? `Building ${building.name}, selected`
                                    : `Building ${building.name}`
                            }
                        >
                            <div className={styles.buildingIconWrap}>
                                <LuWarehouse className={styles.buildingIcon} />
                            </div>
                            <div className={styles.buildingInfo}>
                                <div className={styles.buildingName}>{building.name}</div>
                                <div className={styles.buildingAddress}>{building.address}</div>
                                <div className={styles.buildingManager}>
                                    <span className={styles.managerLabel}>Manager:</span>{" "}
                                    <span>{building.manager}</span>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>

                {/* STORAGE LOCATIONS CONTAINER (with title and same container style) */}
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
 */
function StorageLocationsList({ storageList }) {
    return (
        <div>
            {storageList.length === 0 ? (
                <div className={styles.noStorageMsg}>
                    No storage locations available for this building.
                </div>
            ) : (
                <div className={styles.storageGrid}>
                    {storageList.map((storage) => (
                        <div key={storage.storageId} className={styles.storageCard}>
                            <div className={styles.storageHeader}>
                                <span className={styles.storageIconWrap}>
                                    <LuWarehouse className={styles.storageIcon} />
                                </span>
                                <span className={styles.storageName}>{storage.name}</span>
                            </div>
                            <div className={styles.storageDesc}>{storage.description}</div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default StorageSettingsTab;