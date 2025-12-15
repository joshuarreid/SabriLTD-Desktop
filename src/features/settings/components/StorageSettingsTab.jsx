import React from "react";
import styles from "../styles/storagesettingstab.module.css";
import { useStorageSettingsTab } from "../hooks/useStorageSettingsTab";
import { LuWarehouse } from "react-icons/lu";

/**
 * logger for StorageSettingsTab component.
 * Logs lifecycle events and user interactions for traceability.
 * @type {{info: Function, error: Function}}
 */
const logger = {
    info: (...args) => console.log("[StorageSettingsTab]", ...args),
    error: (...args) => console.error("[StorageSettingsTab]", ...args),
};

/**
 * StorageSettingsTab
 * Storage settings UI wireframe with a "Buildings" horizontal scroll section,
 * using LuWarehouse as the building icon.
 *
 * @component
 * @returns {JSX.Element}
 */
const StorageSettingsTab = () => {
    logger.info("StorageSettingsTab rendered");
    const {
        buildings,
        isPending,
        isError,
        error,
        // openAddBuilding // would be used for actual add logic
    } = useStorageSettingsTab();

    return (
        <div className={styles.tabRoot}>
            <div className={styles.sectionHeaderRow}>
                <h2 className={styles.sectionTitle}>Buildings</h2>
                <button className={styles.addUserBtn /* see .module.css */}>
                    + Add Building
                </button>
            </div>
            {isPending ? (
                <div className={styles.loading}>Loading buildings…</div>
            ) : isError ? (
                <div className={styles.error}>
                    Error: {error?.message || "Failed to load buildings."}
                </div>
            ) : (
                <div className={styles.cardsScrollRow}>
                    {(buildings ?? []).map((building) => (
                        <div key={building.buildingId} className={styles.buildingCard}>
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
                        </div>
                    ))}
                </div>
            )}
            {/* Additional storage settings wireframe sections can go below */}
        </div>
    );
};

export default StorageSettingsTab;