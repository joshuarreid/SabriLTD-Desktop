/**
 * ItemStorageField.jsx
 *
 * @component
 * See JSDoc above for full contract.
 *
 * Shows max 24 StorageInfoCards in a 4x6 grid per page with static height.
 * Adds page controls at the bottom if >24 storages.
 */
import React, { useState, useEffect, useMemo } from "react";
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

const cardMotion = {
    initial: { opacity: 0, y: 18, scale: 0.96 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: -10, scale: 0.95 },
    transition: { duration: 0.20, ease: [0.16, 1, 0.3, 1] },
};

const STORAGE_PAGE_SIZE = 24;

/**
 * ItemStorageField
 * @param {object} props - see above
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

    const sortedStorages = useNaturalSort(storages, { key: "name", order: "asc" });

    // --- Pagination state ---
    const [page, setPage] = useState(1);
    const totalPages = Math.max(1, Math.ceil(sortedStorages.length / STORAGE_PAGE_SIZE));

    useEffect(() => {
        setPage(1);
    }, [selectedBldg?.buildingId, sortedStorages.length]);

    // Current page data (with placeholders if needed)
    const pagedStorages = useMemo(() => {
        const start = (page - 1) * STORAGE_PAGE_SIZE;
        const cards = sortedStorages.slice(start, start + STORAGE_PAGE_SIZE);
        const pad = STORAGE_PAGE_SIZE - cards.length;
        return pad > 0 ? [...cards, ...Array(pad).fill(null)] : cards;
    }, [sortedStorages, page]);

    // --- Modal state for Add Storage ---
    const [editStorageModalOpen, setEditStorageModalOpen] = useState(false);
    const [pendingStorage, setPendingStorage] = useState(null);

    const handleAddStorage = () => {
        logger.info("Opening AddStorageModal (empty), for buildingId", selectedBldg?.buildingId);
        setPendingStorage({
            name: "", description: "", buildingId: selectedBldg?.buildingId || ""
        });
        setEditStorageModalOpen(true);
    };

    const handleStorageModalSave = (storageId, payload) => {
        logger.info("handleStorageModalSave (in item field)", { storageId, payload, buildingId: selectedBldg?.buildingId });
        const fullPayload = { ...payload, buildingId: selectedBldg?.buildingId };
        if (!storageId) {
            createStorageMutation.mutate(fullPayload, {
                onSuccess: () => {
                    setEditStorageModalOpen(false);
                    setPendingStorage(null);
                }
            });
        }
    };

    const handleStorageModalClose = () => {
        setEditStorageModalOpen(false);
        setPendingStorage(null);
    };

    const handleBuildingSelect = (buildingId) => {
        logger.info("Building selected", buildingId);
        setSelectedBldgId(buildingId);
        if (onChange) onChange(null);
        onBuildingChange?.(buildingId);
    };

    const handleStorageSelect = (storageId) => {
        logger.info("Storage selected", storageId);
        onChange?.(value === storageId ? null : storageId);
    };

    useEffect(() => {
        if (editStorageModalOpen && storageAddStatus === "saved") {
            setEditStorageModalOpen(false);
            setPendingStorage(null);
        }
    }, [editStorageModalOpen, storageAddStatus]);

    const isSaving = createStorageMutation?.isPending || storageAddStatus === "saving";
    const storageError = createStorageMutation?.error?.message || null;
    const canGoPrev = page > 1;
    const canGoNext = page < totalPages;

    return (
        <div className={styles.inputCardRoot}>
            <label htmlFor="item-condition" className={styles.label}>
                Storage Locations
            </label>
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
                <label htmlFor="item-condition" className={styles.label}>
                </label>
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
                ) : (
                    <>
                        <div className={styles.storageGrid}>
                            <AnimatePresence>
                                {pagedStorages.map((storage, idx) =>
                                    storage ? (
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
                                    ) : (
                                        // blank grid placeholder
                                        <div
                                            key={`empty-${idx}`}
                                            className={styles.storageBtn}
                                            tabIndex={-1}
                                            aria-hidden="true"
                                            style={{visibility:"hidden"}}
                                        />
                                    )
                                )}
                            </AnimatePresence>
                        </div>
                        {totalPages > 1 && (
                            <div className={styles.paginationRow}>
                                <button
                                    type="button"
                                    className={styles.paginationBtn}
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                    disabled={!canGoPrev}
                                    aria-label="Previous page"
                                >
                                    &larr;
                                </button>
                                <span className={styles.paginationStatus}>
                                    Page {page} of {totalPages}
                                </span>
                                <button
                                    type="button"
                                    className={styles.paginationBtn}
                                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                    disabled={!canGoNext}
                                    aria-label="Next page"
                                >
                                    &rarr;
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>

            <EditStorageModal
                storage={pendingStorage}
                selectedBuildingId={selectedBldg?.buildingId}
                open={editStorageModalOpen}
                isSaving={isSaving}
                error={storageError}
                saveState={isSaving ? "saving" : ""}
                onSave={handleStorageModalSave}
                onClose={handleStorageModalClose}
                onDelete={null}
            />
        </div>
    );
};

export default ItemStorageField;