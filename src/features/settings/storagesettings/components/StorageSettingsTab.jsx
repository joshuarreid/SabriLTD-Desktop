import React from "react";
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

    // Split state: these are only used for local building/storage add/edit modal state in this shell,
    // but all API data/business logic remains in the hook.
    // BuildingSettings and StorageSettings will use the same hook object.

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