import React from "react";
import styles from "./editcompanymodal.module.css";
import SaveStatus from "../save/SaveStatus";
import { useEditCompanyModal } from "./useEditCompanyModal";
import { FaRegTrashCan } from "react-icons/fa6";

/**
 * logger for EditCompanyModal.
 * @constant
 * @type {{info: Function, error: Function}}
 */
const logger = {
    info: (...args) => console.log("[EditCompanyModal]", ...args),
    error: (...args) => console.error("[EditCompanyModal]", ...args),
};

/**
 * EditCompanyModal
 * Modal for editing or adding a company's profile (name, address, phone, website).
 *
 * @component
 * @param {object} props
 * @param {{companyId?: number, name?: string, address?: string, phone?: string, website?: string}} props.company - Company to edit (for add pass {name:'', address:'', phone:'', website:''})
 * @param {boolean} props.open - Modal open state.
 * @param {boolean} props.isSaving - Whether save action is pending.
 * @param {(companyId: number|null, payload: {name:string,address:string,phone:string,website:string}) => void} props.onSave - Called on submit.
 * @param {() => void} props.onClose - Called to close modal (cancel/backdrop).
 * @param {(companyId: number) => void} [props.onDelete] - Called when delete confirmed.
 * @param {string|null} [props.error] - External error string to display.
 * @param {'saving'|'saved'|'idle'|'error'} [props.saveState] - SaveStatus state (optional).
 * @returns {JSX.Element|null}
 */
const EditCompanyModal = ({
                              company,
                              open,
                              isSaving,
                              onSave,
                              onClose,
                              onDelete,
                              error,
                              saveState = "idle",
                          }) => {
    const {
        draft,
        formError,
        setFormError,
        handleChange,
        handleSubmit,
        resetDraft,
    } = useEditCompanyModal(company, isSaving);

    const [deleteConfirmOpen, setDeleteConfirmOpen] = React.useState(false);

    if (!open || !company) return null;

    /**
     * Handle cancel: clear errors and notify parent to close.
     */
    const handleCancel = () => {
        setFormError(null);
        logger.info("Company modal cancelled");
        onClose();
    };

    /**
     * Determine add vs edit mode.
     * Add mode when no companyId and fields are empty.
     */
    const isAddCompany =
        !company.companyId &&
        (!company.name || company.name === "") &&
        (!company.address || company.address === "") &&
        (!company.phone || company.phone === "") &&
        (!company.website || company.website === "");

    /**
     * Open delete confirmation (only for edit mode).
     */
    const handleTrashClick = (e) => {
        e.stopPropagation();
        setDeleteConfirmOpen(true);
    };

    /**
     * Cancel delete confirmation.
     */
    const handleDeleteCancel = () => {
        setDeleteConfirmOpen(false);
    };

    /**
     * Confirm delete and call parent handler.
     */
    const handleDeleteConfirm = () => {
        setDeleteConfirmOpen(false);
        if (onDelete && company.companyId) {
            logger.info("Company delete confirmed", company.companyId);
            onDelete(company.companyId);
        }
    };

    return (
        <div
            className={styles.modalOverlay}
            onClick={handleCancel}
            tabIndex={-1}
            aria-modal="true"
        >
            <div
                className={styles.modalCard}
                onClick={(e) => e.stopPropagation()}
                tabIndex={0}
                role="dialog"
                aria-modal="true"
                aria-labelledby="edit-company-modal-title"
            >
                {/* Trash icon for edit mode only */}
                {!isAddCompany && (
                    <button
                        type="button"
                        className={styles.trashButton}
                        onClick={handleTrashClick}
                        title="Delete company"
                        aria-label="Delete company"
                        disabled={isSaving}
                        tabIndex={0}
                    >
                        <FaRegTrashCan size={20} />
                    </button>
                )}

                <h2 className={styles.companyTitle} id="edit-company-modal-title">
                    {isAddCompany ? "Add Company" : "Edit Company"}
                </h2>

                <form className={styles.companyForm} onSubmit={(e) => handleSubmit(e, onSave)}>
                    <div className={styles.formGroup}>
                        <label htmlFor="edit-company-name">Name</label>
                        <input
                            id="edit-company-name"
                            name="name"
                            type="text"
                            value={draft.name}
                            onChange={handleChange}
                            autoComplete="off"
                            className={styles.input}
                            disabled={isSaving}
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label htmlFor="edit-company-address">Address</label>
                        <input
                            id="edit-company-address"
                            name="address"
                            type="text"
                            value={draft.address}
                            onChange={handleChange}
                            autoComplete="off"
                            className={styles.input}
                            disabled={isSaving}
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label htmlFor="edit-company-phone">Phone</label>
                        <input
                            id="edit-company-phone"
                            name="phone"
                            type="tel"
                            value={draft.phone}
                            onChange={handleChange}
                            autoComplete="off"
                            className={styles.input}
                            disabled={isSaving}
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label htmlFor="edit-company-website">Website</label>
                        <input
                            id="edit-company-website"
                            name="website"
                            type="url"
                            value={draft.website}
                            onChange={handleChange}
                            autoComplete="off"
                            className={styles.input}
                            disabled={isSaving}
                        />
                    </div>

                    {(formError || error) && (
                        <div className={styles.errorMsg}>{formError || error}</div>
                    )}

                    <div className={styles.formActions}>
                        <button
                            type="submit"
                            className={styles.saveButton}
                            disabled={isSaving}
                            aria-disabled={isSaving}
                        >
                            Save
                        </button>

                        <button
                            type="button"
                            className={styles.resetButton}
                            onClick={handleCancel}
                            disabled={isSaving}
                            aria-disabled={isSaving}
                        >
                            Cancel
                        </button>
                    </div>

                    <div className={styles.saveFeedback}>
                        <SaveStatus status={saveState} />
                    </div>
                </form>

                {/* Delete confirmation overlay */}
                {deleteConfirmOpen && (
                    <div className={styles.confirmOverlay}>
                        <div className={styles.confirmCard}>
                            <h3>Delete this company?</h3>
                            <p>
                                Are you sure you want to delete{" "}
                                <strong>{company.name || "this company"}</strong>? This cannot be undone.
                            </p>
                            <div className={styles.confirmActions}>
                                <button
                                    type="button"
                                    className={styles.confirmDelete}
                                    onClick={handleDeleteConfirm}
                                >
                                    Delete
                                </button>
                                <button
                                    type="button"
                                    className={styles.cancelDelete}
                                    onClick={handleDeleteCancel}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EditCompanyModal;