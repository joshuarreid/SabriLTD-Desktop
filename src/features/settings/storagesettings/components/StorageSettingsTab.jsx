import React, { useEffect } from "react";
import styles from "../styles/storagesettingstab.module.css";
import { useStorageSettingsTab } from "../hooks/useStorageSettingsTab";
import BuildingSettings from "./BuildingSettings";
import StorageSettings from "./StorageSettings";

/**
 * StorageSettingsTab
 * Root-level settings tab for buildings and storage. Orchestrates building and storage management UI.
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

    // All business logic packed in custom hook
    const hookValues = useStorageSettingsTab();

    /**
     * On initial load, selects the first building if none is already selected.
     * This ensures storage locations can populate for the initial tab state.
     */
    useEffect(() => {
        if (
            hookValues.buildings &&
            hookValues.buildings.length > 0 &&
            !hookValues.selectedBuildingId
        ) {
            logger.info(
                "Selecting first building on initial load:",
                hookValues.buildings[0].buildingId
            );
            hookValues.setSelectedBuildingId(hookValues.buildings[0].buildingId);
        }
    }, [
        hookValues.buildings,
        hookValues.selectedBuildingId,
        hookValues.setSelectedBuildingId,
    ]);

    return (
        <div className={styles.tabRoot}>
            <div className={styles.buildingContainer}>
                <BuildingSettings {...hookValues} />
                <div className={styles.storageLocationsContainer}>
                    <StorageSettings {...hookValues} />
                </div>
            </div>
        </div>
    );
};

export default StorageSettingsTab;