/**
 * ItemStorageField.jsx
 *
 * Item-level field for selecting a building/storage location, styled to match other
 * input fields (Condition and Job): inside a white, shadowed, rounded "card."
 * Renders buildings as a horizontal row, storages as a grid.
 * Animates building/storage cards entry/exit like ItemJobField using framer-motion.
 *
 * - Uses useNaturalSort for storages.
 * - Unselects storage when changing building.
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
import { AnimatePresence, motion } from "framer-motion";
import { useItemStorageField } from "../hooks/useItemStorageField";

import styles from "../styles/itemstoragefield.module.css";
import StorageInfoCard from "../../../components/storageinfocards/StorageInfoCard";
import BuildingInfoCard from "../../../components/storageinfocards/BuildingInfoCard";
import {useNaturalSort} from "../../../components/alphabeticalsortfilter/useNaturalSort";

/**
 * logger for ItemStorageField.
 * @constant
 */
const logger = {
    info: (...args) => console.log("[ItemStorageField]", ...args),
    error: (...args) => console.error("[ItemStorageField]", ...args),
};

/**
 * Framer Motion animation variants for cards.
 * @type {Object}
 */
const cardMotion = {
    initial: { opacity: 0, y: 18, scale: 0.96 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: -10, scale: 0.95 },
    transition: { duration: 0.20, ease: [0.16, 1, 0.3, 1] },
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

    /** Natural sort for storages by name (asc) */
    const sortedStorages = useNaturalSort(storages, { key: "name", order: "asc" });

    /**
     * Handles building card selection.
     * Unselect the current storage on building change.
     * @param {number} buildingId
     */
    const handleBuildingSelect = (buildingId) => {
        logger.info("Building selected", buildingId);
        setSelectedBldgId(buildingId);
        if (onChange) onChange(null); // Unselect storage when building changes.
        onBuildingChange?.(buildingId);
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
                    <AnimatePresence>
                        {buildings.map((bldg) => (
                            <motion.button
                                key={bldg.buildingId}
                                initial={cardMotion.initial}
                                animate={cardMotion.animate}
                                exit={cardMotion.exit}
                                transition={cardMotion.transition}
                                layout="position"
                                type="button"
                                className={[
                                    styles.bldgBtn,
                                    styles.compactBldgBtn,
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
                            </motion.button>
                        ))}
                    </AnimatePresence>
                )}
            </div>

            <div className={styles.storageSection}>
                {loadingStorages ? (
                    <div className={styles.status}>Loading storage…</div>
                ) : errorStorages ? (
                    <div className={styles.status} style={{ color: "#c00" }}>
                        {errorStorages}
                    </div>
                ) : !sortedStorages.length ? (
                    <div className={styles.status} style={{ color: "#888" }}>
                        No storage locations for this building.
                    </div>
                ) : (
                    <div className={styles.storageGrid}>
                        <AnimatePresence>
                            {sortedStorages.map((storage) => (
                                <motion.button
                                    key={storage.storageId}
                                    initial={cardMotion.initial}
                                    animate={cardMotion.animate}
                                    exit={cardMotion.exit}
                                    transition={cardMotion.transition}
                                    layout="position"
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
                                </motion.button>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ItemStorageField;