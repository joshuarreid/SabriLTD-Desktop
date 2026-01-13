/**
 * ItemStorageField.jsx
 *
 * Item-level field for selecting a building/storage location, styled to match other
 * input fields (Condition and Job): inside a white, shadowed, rounded "card."
 * Renders buildings as a horizontal row, storages as a grid. No edit/trash, select only.
 *
 * @component
 * @param {object} props
 * @param {number|null} props.value - The currently selected storageId (or null).
 * @param {function} props.onChange - Called with updates: (storageId: number|null) => void
 * @param {number|null} [props.selectedBuildingId] - Optionally preselect a building.
 * @param {function} [props.onBuildingChange] - Optional: callback when building changes.
 * @returns {JSX.Element}
 */

import React from "react";
import { useItemStorageField } from "../hooks/useItemStorageField";
import styles from "../styles/itemstoragefield.module.css";
import StorageInfoCard from "../../../components/storageinfocards/StorageInfoCard";
import BuildingInfoCard from "../../../components/storageinfocards/BuildingInfoCard";

/**
 * logger for ItemStorageField.
 * @constant
 */
const logger = {
    info: (...args) => console.log("[ItemStorageField]", ...args),
    error: (...args) => console.error("[ItemStorageField]", ...args),
};

/**
 * ItemStorageField component.
 * @param {object} props - See above.
 * @returns {JSX.Element}
 */
export const ItemStorageField = ({
                                     value,
                                     onChange,
                                     selectedBuildingId,
                                     onBuildingChange,
                                 }) => {
    const {
        buildings,
        selectedBldg,
        setSelectedBldgId,
        storages,
        loadingBuildings,
        errorBuildings,
        loadingStorages,
        errorStorages,
    } = useItemStorageField({ selectedBuildingId });

    /**
     * Handles building card selection.
     * @param {number} buildingId
     */
    const handleBuildingSelect = (buildingId) => {
        logger.info("Building selected", buildingId);
        setSelectedBldgId(buildingId);
        onBuildingChange?.(buildingId);
        // Optionally clear storageId if current is not valid for new building
        // if (!storages.some(s => s.storageId === value)) onChange(null);
    };

    /**
     * Handles storage card selection.
     * @param {number} storageId
     */
    const handleStorageSelect = (storageId) => {
        logger.info("Storage selected", storageId);
        onChange?.(value === storageId ? null : storageId);
    };

    return (
        <div className={styles.inputCardRoot}>
            <label className={styles.inputCardLabel}>Storage</label>
            <div className={styles.storageBuildingsRow} role="list">
                {loadingBuildings ? (
                    <div className={styles.status}>Loading buildings…</div>
                ) : errorBuildings ? (
                    <div className={styles.status} style={{ color: "#c00" }}>
                        {errorBuildings}
                    </div>
                ) : !buildings.length ? (
                    <div className={styles.status}>No buildings found.</div>
                ) : (
                    buildings.map((bldg) => (
                        <button
                            key={bldg.buildingId}
                            type="button"
                            className={[
                                styles.bldgBtn,
                                styles.compactBldgBtn, // Add compact class for reduced size
                                selectedBldg?.buildingId === bldg.buildingId
                                    ? styles.bldgBtnSelected
                                    : "",
                            ].join(" ")}
                            onClick={() => handleBuildingSelect(bldg.buildingId)}
                            aria-pressed={selectedBldg?.buildingId === bldg.buildingId}
                            tabIndex={0}
                        >
                            <BuildingInfoCard
                                building={bldg}
                                selected={selectedBldg?.buildingId === bldg.buildingId}
                                showActions={false}
                                compact
                            />
                        </button>
                    ))
                )}
            </div>

            <div className={styles.storageSection}>
                {loadingStorages ? (
                    <div className={styles.status}>Loading storage…</div>
                ) : errorStorages ? (
                    <div className={styles.status} style={{ color: "#c00" }}>
                        {errorStorages}
                    </div>
                ) : !storages.length ? (
                    <div className={styles.status} style={{ color: "#888" }}>
                        No storage locations for this building.
                    </div>
                ) : (
                    <div className={styles.storageGrid}>
                        {storages.map((storage) => (
                            <button
                                key={storage.storageId}
                                type="button"
                                className={[
                                    styles.storageBtn,
                                    value === storage.storageId
                                        ? styles.storageBtnSelected
                                        : "",
                                ].join(" ")}
                                onClick={() => handleStorageSelect(storage.storageId)}
                                aria-pressed={value === storage.storageId}
                                tabIndex={0}
                            >
                                <StorageInfoCard
                                    storage={storage}
                                    selected={value === storage.storageId}
                                    showActions={false}
                                />
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ItemStorageField;