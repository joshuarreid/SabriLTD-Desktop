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
 * - Includes a "+ New" storage button that launches the same modal and API as the settings screen.
 * - Business logic for adding storage moved fully into useItemStorageField.
 *
 * @component
 * @param {object} props
 * @param {number|null} props.value - The currently selected storageId (or null).
 * @param {function} props.onChange - Called with updates: (storageId: number|null) => void
 * @param {number|null} [props.selectedBuildingId] - Optionally preselect a building.
 * @param {function} [props.onBuildingChange] - Optional: callback when building changes.
 * @returns {JSX.Element}
 */

import React, { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useItemStorageField } from "../hooks/useItemStorageField";
import { useNaturalSort } from "../../../components/alphabeticalsortfilter/useNaturalSort";
import styles from "../styles/itemstoragefield.module.css";
import StorageInfoCard from "../../../components/storageinfocards/StorageInfoCard";
import BuildingInfoCard from "../../../components/storageinfocards/BuildingInfoCard";
import EditStorageModal from "../../../components/editstoragemodal/EditStorageModal";

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
 * EMPTY_STORAGE
 * Default storage object for add modal
 * @constant
 */
const EMPTY_STORAGE = { name: "", description: "", buildingId: "" };

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
        createStorageMutation,
        storageAddStatus,
    } = useItemStorageField({ selectedBuildingId });

    /** Natural sort for storages by name (asc) */
    const sortedStorages = useNaturalSort(storages, { key: "name", order: "asc" });

    // --- Modal state for Add Storage ---
    const [editStorageModalOpen, setEditStorageModalOpen] = useState(false);
    const [pendingStorage, setPendingStorage] = useState(null);

    /**
     * Handles add new storage button: open modal for this building.
     * @function
     */
    const handleAddStorage = () => {
        logger.info("Opening AddStorageModal (empty), for buildingId", selectedBldg?.buildingId);
        setPendingStorage({
            ...EMPTY_STORAGE,
            buildingId: selectedBldg?.buildingId || ""
        });
        setEditStorageModalOpen(true);
    };

    /**
     * Handles add storage modal save.
     * Triggers the storage add mutation from the hook.
     * @function
     * @param {number|null} storageId
     * @param {{name: string, description: string}} payload
     */
    const handleStorageModalSave = (storageId, payload) => {
        logger.info("handleStorageModalSave (in item field)", { storageId, payload, buildingId: selectedBldg?.buildingId });
        const fullPayload = {
            ...payload,
            buildingId: selectedBldg?.buildingId,
        };
        if (!storageId) {
            createStorageMutation.mutate(fullPayload, {
                onSuccess: () => {
                    setEditStorageModalOpen(false);
                    setPendingStorage(null);
                },
                onError: () => {
                    // Error state handled by modal
                }
            });
        }
    };

    /**
     * Close/cancel for storage modal.
     * @function
     */
    const handleStorageModalClose = () => {
        setEditStorageModalOpen(false);
        setPendingStorage(null);
    };

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

    /**
     * Side-effect: auto-close modal on successful save, show error otherwise.
     */
    useEffect(() => {
        if (editStorageModalOpen && storageAddStatus === "saved") {
            setEditStorageModalOpen(false);
            setPendingStorage(null);
        }
    }, [editStorageModalOpen, storageAddStatus]);

    /**
     * Save/Loading/Error for add storage modal.
     * @type {boolean}
     */
    const isSaving = createStorageMutation?.isPending || storageAddStatus === "saving";
    const storageError = createStorageMutation?.error?.message || null;

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

            <div className={styles.storageSectionHeaderRow}>
                <span className={styles.storageSectionLabel}>Storage Locations</span>
                {/* + New button right aligned, same style as settings */}
                <button
                    className={styles.addStorageBtn}
                    type="button"
                    onClick={handleAddStorage}
                    disabled={!selectedBldg}
                    tabIndex={0}
                >
                    + New
                </button>
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

            {/* --- Add Storage Modal, identical to settings --- */}
            <EditStorageModal
                storage={pendingStorage}
                selectedBuildingId={selectedBldg?.buildingId}
                open={editStorageModalOpen}
                isSaving={isSaving}
                error={storageError}
                saveState={isSaving ? "saving" : ""}
                onSave={handleStorageModalSave}
                onClose={handleStorageModalClose}
                // No delete in embed mode.
                onDelete={null}
            />
        </div>
    );
};

export default ItemStorageField;