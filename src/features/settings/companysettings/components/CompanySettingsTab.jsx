/**
 * CompanySettingsTab.jsx
 *
 * Presentational container wired to useCompanySettingsTab that renders:
 * - CompanyInfoCard tiles
 * - EditCompanyModal (real modal wired to API)
 * - Card-level delete confirmation
 *
 * This component contains ONLY render logic and delegates business logic to the hook.
 */

import React from "react";
import styles from "../styles/companysettingstab.module.css";
import AlphabeticalSortFilter from "../../../../components/alphabeticalsortfilter/AlphabeticalSortFilter";
import CompanyInfoCard from "./CompanyInfoCard";
import EditCompanyModal from "../../../../components/editcompanymodal/EditCompanyModal";
import { useCompanySettingsTab } from "../hooks/useCompanySettingsTab";

/**
 * logger for CompanySettingsTab.
 * @constant
 */
const logger = {
    info: (...args) => console.log("[CompanySettingsTab]", ...args),
    error: (...args) => console.error("[CompanySettingsTab]", ...args),
};

/**
 * CompanySettingsTab - presentational container
 *
 * @component
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
        // selection
        selectedId,
        setSelectedId,
    } = useCompanySettingsTab();

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
                    <AlphabeticalSortFilter value={"a-z"} onChange={() => {}} />
                </div>
            </div>

            <div className={styles.gridContainer}>
                {(companies ?? []).map((company) => (
                    <CompanyInfoCard
                        key={company.companyId}
                        company={company}
                        selected={selectedId === company.companyId}
                        onClick={(c) => {
                            setSelectedId(c.companyId);
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