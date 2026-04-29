import React, { useEffect, useMemo, useRef, useState } from "react";

import styles from "../styles/createjobmodal.module.css";
import Modal from "../../../components/modal/Modal";

/**
 * Standardized logger for CreateJobModal.
 */
const logger = {
    info: (...args) => console.log("[CreateJobModal]", ...args),
    error: (...args) => console.error("[CreateJobModal]", ...args),
};

const CreateJobModal = ({
    open,
    isSaving,
    saveState,
    onSave,
    onClose,
    error,
    companyOptions,
    statusOptions,
}) => {
    const nameInputRef = useRef(null);

    const [draft, setDraft] = useState({
        name: "",
        companyId: "",
        client: "",
        description: "",
        status: "Active",
    });

    useEffect(() => {
        if (open) {
            logger.info("Modal opened");
            setTimeout(() => {
                try {
                    nameInputRef.current?.focus?.();
                } catch (e) {
                    logger.error("Failed to focus name input", e);
                }
            }, 0);
        }
    }, [open]);

    const companyChoices = useMemo(() => {
        return (companyOptions || []).filter((o) => o.value !== "all");
    }, [companyOptions]);

    const statusChoices = useMemo(() => {
        return (statusOptions || []).filter((o) => o.value !== "all");
    }, [statusOptions]);

    const updateDraft = (field, value) => {
        setDraft((prev) => ({ ...prev, [field]: value }));
    };

    const canSubmit = useMemo(() => {
        const hasName = !!draft.name?.trim();
        const hasCompany = draft.companyId !== "" && draft.companyId !== null;
        const hasClient = !!draft.client?.trim();
        const hasDescription = !!draft.description?.trim();
        return hasName && hasCompany && hasClient && hasDescription && !isSaving;
    }, [draft.name, draft.companyId, draft.client, draft.description, isSaving]);

    const buildPayload = () => {
        return {
            name: draft.name?.trim(),
            companyId: draft.companyId,
            client: draft.client?.trim(),
            description: draft.description?.trim(),
            status: draft.status || "Active",
        };
    };

    const handleConfirm = () => {
        const payload = buildPayload();
        logger.info("Create job confirmed", {
            hasName: !!payload.name,
            hasCompanyId: payload.companyId !== "" && payload.companyId !== null,
            hasClient: !!payload.client,
            hasDescription: !!payload.description,
            status: payload.status,
        });
        onSave(payload);
    };

    if (!open) return null;

    return (
        <Modal
            open={open}
            onClose={onClose}
            title={<h2 className={styles.modalTitle}>New Job</h2>}
            size="sm"
        >
            <div className={styles.form}>
                <div className={styles.formGroup}>
                    <label className={styles.label} htmlFor="create-job-name">
                        Job Name
                    </label>
                    <input
                        id="create-job-name"
                        ref={nameInputRef}
                        className={styles.input}
                        value={draft.name}
                        onChange={(e) => updateDraft("name", e.target.value)}
                        placeholder="Enter job name"
                    />
                </div>

                <div className={styles.formGroup}>
                    <label className={styles.label} htmlFor="create-job-company">
                        Company
                    </label>
                    <select
                        id="create-job-company"
                        className={styles.select}
                        value={draft.companyId}
                        onChange={(e) => updateDraft("companyId", e.target.value)}
                    >
                        <option value="">Select a company</option>
                        {companyChoices.map((opt) => (
                            <option key={String(opt.value)} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                </div>

                <div className={styles.formGroup}>
                    <label className={styles.label} htmlFor="create-job-client">
                        Client
                    </label>
                    <input
                        id="create-job-client"
                        className={styles.input}
                        value={draft.client}
                        onChange={(e) => updateDraft("client", e.target.value)}
                        placeholder="Enter client name"
                    />
                </div>

                <div className={styles.formGroup}>
                    <label className={styles.label} htmlFor="create-job-status">
                        Status
                    </label>
                    <select
                        id="create-job-status"
                        className={styles.select}
                        value={draft.status}
                        onChange={(e) => updateDraft("status", e.target.value)}
                    >
                        {statusChoices.length > 0 ? (
                            statusChoices.map((opt) => (
                                <option key={String(opt.value)} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))
                        ) : (
                            <>
                                <option value="Active">Active</option>
                                <option value="Pending Storage">Pending Storage</option>
                                <option value="Closed">Closed</option>
                            </>
                        )}
                    </select>
                </div>

                <div className={styles.formGroup}>
                    <label
                        className={styles.label}
                        htmlFor="create-job-description"
                    >
                        Description
                    </label>
                    <textarea
                        id="create-job-description"
                        className={styles.textarea}
                        value={draft.description}
                        onChange={(e) => updateDraft("description", e.target.value)}
                        placeholder="Enter job description"
                        rows={4}
                    />
                </div>

                {error ? <div className={styles.errorMsg}>{error}</div> : null}

                <div className={styles.saveFeedback}>
                    {saveState === "saved" ? (
                        <div className={styles.savedMsg}>Saved</div>
                    ) : null}
                </div>

                <div className={styles.formActions}>
                    <button
                        type="button"
                        className={styles.saveButton}
                        onClick={handleConfirm}
                        disabled={!canSubmit}
                        aria-disabled={!canSubmit}
                    >
                        {isSaving ? "Saving..." : "Create"}
                    </button>

                    <button
                        type="button"
                        className={styles.cancelButton}
                        onClick={onClose}
                        disabled={isSaving}
                        aria-disabled={isSaving}
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default CreateJobModal;
