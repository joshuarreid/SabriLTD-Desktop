/**
 * CompanySettingsTab.jsx
 *
 * Presentational container that consumes useCompanySettingsTab hook for business
 * logic. Renders CompanyInfoCard tiles, wired EditCompanyModal, and delete confirmation UI.
 *
 * Per Bulletproof React conventions: this file contains render logic only and
 * delegates side-effects/state to the hook.
 */

import React from "react";
import styles from "../styles/companysettingstab.module.css";
import AlphabeticalSortFilter from "../../../../components/alphabeticalsortfilter/AlphabeticalSortFilter";
import CompanyInfoCard from "./CompanyInfoCard";
import { useCompanySettingsTab } from "../hooks/useCompanySettingsTab";
import EditCompanyModal from "../../../../components/editcompanymodal/EditCompanyModal";

/**
 * logger for CompanySettingsTab.
 * @constant
 * @type {{info: Function, error: Function}}
 */
const logger = {
    info: (...args) => console.log("[CompanySettingsTab]", ...args),
    error: (...args) => console.error("[CompanySettingsTab]", ...args),
};

/**
 * CompanySettingsTab
 *
 * Presentational container for the company settings UI.
 *
 * @component
 * @returns {JSX.Element}
 */
const CompanySettingsTab = () => {
    logger.info("CompanySettingsTab rendered");

    const {
        companies,
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

    const removingCompany = removingId
        ? companies.find((c) => c.companyId === removingId)
        : null;

    // compute isSaving and saveState for modal SaveStatus
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

            {/* Wire up the real modal (EditCompanyModal) to the hook handlers.
                - onSave delegates to handleModalSaveEdit / handleModalSaveAdd
                - onDelete uses handleDeleteDirect because EditCompanyModal shows its own confirm */}
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
                        // EditCompanyModal already confirms with the user inside the modal.
                        // We perform direct delete (no secondary prompt) since user already confirmed.
                        handleDeleteDirect(companyId);
                    }}
                    error={modalError}
                    saveState={modalSaveState}
                />
            )}

            {/* Wireframe delete confirmation (presentational) for card-level delete */}
            {removingCompany && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalCard}>
                        <h3 className={styles.modalTitle}>Delete Company?</h3>
                        <p className={styles.modalBody}>
                            Are you sure you want to delete company &quot;{removingCompany.name}&quot;? This is a mock
                            confirmation for the wireframe.
                        </p>
                        <div className={styles.modalActions}>
                            <button
                                type="button"
                                className={styles.dangerButton}
                                onClick={handleConfirmDelete}
                                disabled={deleteStatus === "deleting"}
                            >
                                {deleteStatus === "deleting" ? "Deleting…" : "Delete (mock)"}
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