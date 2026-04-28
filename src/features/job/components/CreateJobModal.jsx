/**
 * CreateJobModal.jsx
 *
 * Create job modal for JobScreen.
 * UI-only component: collects fields and delegates save/close.
 */

import React, { useEffect, useMemo, useRef, useState } from "react";
import styles from "./createjobmodal.module.css";

/**
 * Standardized logger for CreateJobModal.
 *
 * @constant
 * @type {{info: Function, error: Function}}
 */
const logger = {
    info: (...args) => console.log("[CreateJobModal]", ...args),
    error: (...args) => console.error("[CreateJobModal]", ...args),
};

/**
 * @typedef {object} CreateJobPayload
 * @property {string} name
 * @property {string|number} companyId
 * @property {string} client
 * @property {string} description
 * @property {string} status
 */

/**
 * CreateJobModal
 *
 * @component
 * @param {object} props
 * @param {boolean} props.open
 * @param {boolean} props.isSaving
 * @param {"idle"|"saving"|"saved"|"error"} props.saveState
 * @param {(payload: CreateJobPayload) => void} props.onSave
 * @param {() => void} props.onClose
 * @param {string|null} props.error
 * @param {Array<{value: string|number, label: string}>} props.companyOptions
 * @param {Array<{value: string, label: string}>} props.statusOptions
 * @returns {JSX.Element|null}
 */
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
    /**
     * Ref used for initial focus and basic keyboard handling.
     *
     * @type {React.MutableRefObject<HTMLInputElement|null>}
     */
    const nameInputRef = useRef(null);

    /**
     * Local form state for create job.
     *
     * @type {[CreateJobPayload, Function]}
     */
    const [draft, setDraft] = useState({
        name: "",
        companyId: "",
        client: "",
        description: "",
        status: "Active",
    });

    /**
     * Focus the first field when the modal opens.
     *
     * @effect
     */
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

    /**
     * Normalizes company options (excludes "all").
     *
     * @returns {Array<{value: string|number, label: string}>}
     */
    const companyChoices = useMemo(() => {
        return (companyOptions || []).filter((o) => o.value !== "all");
    }, [companyOptions]);

    /**
     * Normalizes status options (excludes "all").
     *
     * @returns {Array<{value: string, label: string}>}
     */
    const statusChoices = useMemo(() => {
        return (statusOptions || []).filter((o) => o.value !== "all");
    }, [statusOptions]);

    /**
     * updateDraft(field, value)
     * - Local helper used to update the draft object.
     *
     * @param {string} field
     * @param {any} value
     * @returns {void}
     */
    const updateDraft = (field, value) => {
        setDraft((prev) => ({ ...prev, [field]: value }));
    };

    /**
     * canSubmit
     * Basic validation for required fields.
     * NOTE: client + description are REQUIRED.
     *
     * @returns {boolean}
     */
    const canSubmit = useMemo(() => {
        const hasName = !!draft.name?.trim();
        const hasCompany = draft.companyId !== "" && draft.companyId !== null;
        const hasClient = !!draft.client?.trim();
        const hasDescription = !!draft.description?.trim();

        return hasName && hasCompany && hasClient && hasDescription && !isSaving;
    }, [draft.name, draft.companyId, draft.client, draft.description, isSaving]);

    /**
     * buildPayload
     * Normalizes and returns the payload for the create job action.
     *
     * @function buildPayload
     * @returns {CreateJobPayload}
     */
    const buildPayload = () => {
        return {
            name: draft.name?.trim(),
            companyId: draft.companyId,
            client: draft.client?.trim(),
            description: draft.description?.trim(),
            status: draft.status || "Active",
        };
    };

    /**
     * handleConfirm
     * Validates and submits payload.
     *
     * @function handleConfirm
     * @returns {void}
     */
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

    /**
     * handleOverlayClick
     * Closes modal when clicking outside the card.
     *
     * @function handleOverlayClick
     * @param {React.MouseEvent<HTMLDivElement>} event
     * @returns {void}
     */
    const handleOverlayClick = (event) => {
        if (event.target === event.currentTarget) {
            logger.info("Overlay clicked (closing modal)");
            onClose();
        }
    };

    /**
     * handleKeyDown
     * Provides basic keyboard interactions.
     *
     * @function handleKeyDown
     * @param {React.KeyboardEvent<HTMLDivElement>} event
     * @returns {void}
     */
    const handleKeyDown = (event) => {
        if (event.key === "Escape") {
            logger.info("Escape pressed (closing modal)");
            event.preventDefault();
            onClose();
            return;
        }

        if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
            if (!canSubmit) return;
            logger.info("Ctrl/Cmd+Enter pressed (submitting)");
            event.preventDefault();
            handleConfirm();
        }
    };

    if (!open) return null;

    return (
        <div
            className={styles.modalOverlay}
            role="dialog"
            aria-modal="true"
            aria-label="Create new job"
            onMouseDown={handleOverlayClick}
            onKeyDown={handleKeyDown}
            tabIndex={-1}
        >
            <div className={styles.modalCard}>
                <h2 className={styles.modalTitle}>New Job</h2>

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
                                    <option value="Pending Storage">
                                        Pending Storage
                                    </option>
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
            </div>
        </div>
    );
};

export default CreateJobModal;