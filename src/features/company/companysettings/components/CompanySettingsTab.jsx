/**
 * CompanySettingsTab.jsx
 *
 * Presentational container wired to useCompanySettingsTab that renders:
 * - CompanyInfoCard tiles
 * - EditCompanyModal (real modal wired to API)
 * - Card-level delete confirmation
 *
 * This version mirrors the UserSettingsTab interaction model: there is no long-lived
 * selected card state — clicking a card simply opens the modal and closing the modal
 * does not leave the card highlighted.
 *
 * @component
 */

import React, { useMemo, useState } from "react";
import styles from "../styles/companysettingstab.module.css";
import AlphabeticalSortFilter from "../../../../components/alphabeticalsortfilter/AlphabeticalSortFilter.js";
import CompanyInfoCard from "./CompanyInfoCard.jsx";
import EditCompanyModal from "@/features/company/editcompanymodal/EditCompanyModal.jsx";
import { useCompanySettingsTab } from "../hooks/useCompanySettingsTab.js";

/**
 * logger for CompanySettingsTab.
 * @constant
 */
const logger = {
    info: (...args) => console.log("[CompanySettingsTab]", ...args),
    error: (...args) => console.error("[CompanySettingsTab]", ...args),
};

/**
 * SORT OPTIONS used by AlphabeticalSortFilter
 * @constant {Array<{key: string, label: string, field: string, order: "asc"|"desc"}>}
 */
const COMPANY_SORT_OPTIONS = [
    { key: "a-z", label: "A to Z", field: "name", order: "asc" },
    { key: "z-a", label: "Z to A", field: "name", order: "desc" },
];

/**
 * CompanySettingsTab - presentational container
 *
 * @returns {JSX.Element}
 */
const CompanySettingsTab = () => {
    logger.info("CompanySettingsTab rendered");

    const {
        companies,
        isPending,
        isError,
        error,
        // modal + save state
        editStatus,
        addStatus,
        modalMode,
        modalCompany,
        modalError,
        pendingClose,
        openEditModal,
        openAddModal,
        handleModalSaveEdit,
        handleModalSaveAdd,
        closeModal,
        // delete flow
        removingId,
        deleteStatus,
        handlePromptDelete,
        handleConfirmDelete,
        handleCancelDelete,
        handleDeleteDirect,
    } = useCompanySettingsTab();

    const [sortKey, setSortKey] = useState("a-z");

    const currentSort = useMemo(
        () => COMPANY_SORT_OPTIONS.find((opt) => opt.key === sortKey) || COMPANY_SORT_OPTIONS[0],
        [sortKey],
    );

    const sortedCompanies = useMemo(() => {
        if (isPending || isError) return [];
        const base = Array.isArray(companies) ? [...companies] : [];
        const field = currentSort.field || "name";
        const order = currentSort.order || "asc";

        base.sort((a, b) => {
            const aName = String(a?.[field] ?? "").toLowerCase();
            const bName = String(b?.[field] ?? "").toLowerCase();
            if (aName === bName) return 0;
            if (order === "asc") {
                return aName.localeCompare(bName, undefined, { numeric: true, sensitivity: "base" });
            }
            return bName.localeCompare(aName, undefined, { numeric: true, sensitivity: "base" });
        });

        return base;
    }, [companies, isPending, isError, currentSort.field, currentSort.order]);

    const onSortChange = (key) => {
        logger.info("Sort changed", key);
        setSortKey(key);
    };

    const removingCompany = removingId ? companies.find((c) => c.companyId === removingId) : null;

    if (isPending) {
        return <div className={styles.loading}>Loading companies...</div>;
    }

    if (isError) {
        return <div className={styles.error}>Error: {error?.message || "Failed to load companies."}</div>;
    }

    const modalIsSaving = editStatus === "saving" || addStatus === "saving";
    const modalSaveState = modalMode === "edit" ? editStatus : addStatus;

    return (
        <div className={styles.companyPanel}>
            <div className={styles.headerSection}>
                <h2 className={styles.sectionTitle}>Manage Companies</h2>
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <button type="button" className={styles.addCompanyBtn} onClick={openAddModal}>
                        + Add Company
                    </button>
                    <AlphabeticalSortFilter value={sortKey} onChange={onSortChange} />
                </div>
            </div>

            <div className={styles.gridContainer}>
                {(sortedCompanies ?? []).map((company) => (
                    <CompanyInfoCard
                        key={company.companyId}
                        company={company}
                        // DO NOT pass a persistent `selected` prop so the card won't stay highlighted
                        onClick={(c) => {
                            // open modal (no setSelected behavior) — matches user tiles interaction
                            openEditModal(c);
                        }}
                        onEdit={(c) => openEditModal(c)}
                        onDelete={(companyId) => handlePromptDelete(companyId)}
                    />
                ))}
            </div>

            {/* Edit/Add modal wired to real API via hook */}
            {modalCompany && (
                <EditCompanyModal
                    company={modalCompany}
                    open={!!modalCompany}
                    isSaving={modalIsSaving}
                    onSave={(companyId, payload) => {
                        if (modalMode === "edit") {
                            handleModalSaveEdit(companyId, payload);
                        } else {
                            handleModalSaveAdd(payload);
                        }
                    }}
                    onClose={closeModal}
                    onDelete={(companyId) => {
                        // EditCompanyModal shows its own confirmation. Perform direct delete if confirmed.
                        handleDeleteDirect(companyId);
                    }}
                    error={modalError}
                    saveState={modalSaveState}
                />
            )}

            {/* Card-level delete confirmation */}
            {removingCompany && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalCard}>
                        <h3 className={styles.modalTitle}>Delete Company?</h3>
                        <p className={styles.modalBody}>
                            Are you sure you want to delete company &quot;{removingCompany.name}&quot;? This is a
                            confirmation.
                        </p>
                        <div className={styles.modalActions}>
                            <button
                                type="button"
                                className={styles.dangerButton}
                                onClick={handleConfirmDelete}
                                disabled={deleteStatus === "deleting"}
                            >
                                {deleteStatus === "deleting" ? "Deleting…" : "Delete"}
                            </button>
                            <button
                                type="button"
                                className={styles.secondaryButton}
                                onClick={handleCancelDelete}
                                disabled={deleteStatus === "deleting"}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CompanySettingsTab;