import React, { useEffect, useMemo, useRef, useState, forwardRef, useImperativeHandle } from "react";
import { useAllCompanies } from "../../company/hooks/useCompanies";

import styles from "../styles/createjobmodal.module.css";

interface CreateJobFormProps {
    isSaving: boolean;
    saveState: any;
    onSave: (data: any) => void;
    onCancel: () => void;
    error: any;
    statusOptions: Array<{ value: string | number; label: string }>;
    autoFocus: boolean;
    initialValues: {
        name?: string;
        companyId?: string | number;
        client?: string;
        description?: string;
        status?: string;
    };
}

const CreateJobForm = forwardRef<any, CreateJobFormProps>(({
    isSaving,
    saveState,
    onSave,
    onCancel,
    error,
    statusOptions,
    autoFocus,
    initialValues,
}, ref) => {
    console.log("[CreateJobForm] statusOptions prop:", statusOptions);

    const nameInputRef = useRef<HTMLInputElement>(null);
    const formRef = useRef<HTMLFormElement>(null);
    const [draft, setDraft] = useState({
        name: initialValues?.name || "",
        companyId: initialValues?.companyId || "",
        client: initialValues?.client || "",
        description: initialValues?.description || "",
        status: initialValues?.status || "Active",
    });

    const { data: companiesData, isLoading: companiesLoading } = useAllCompanies();
    const companyOptions = useMemo(() => {
        if (!companiesData || !Array.isArray(companiesData.data)) return [];
        return companiesData.data.map((company: any) => ({
            value: company.id,
            label: company.name,
        }));
    }, [companiesData]);

    useImperativeHandle(ref, () => ({
        submit: () => {
            if (formRef.current) {
                formRef.current.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
            }
        }
    }));

    useEffect(() => {
        if (autoFocus) {
            setTimeout(() => {
                try {
                    nameInputRef.current?.focus?.();
                } catch (e) {}
            }, 0);
        }
    }, [autoFocus]);

    const companyChoices = useMemo(() => {
        const filtered = (companyOptions || []).filter((o) => o.value !== "all");
        console.log("[CreateJobForm] companyChoices after filter:", filtered);
        return filtered;
    }, [companyOptions]);

    const statusChoices = useMemo(() => {
        return (statusOptions || []).filter((o) => o.value !== "all");
    }, [statusOptions]);

    const updateDraft = (field: string, value: string) => {
        setDraft((prev) => ({ ...prev, [field]: value }));
    };

    const buildPayload = () => {
        return {
            name: draft.name?.trim(),
            companyId: draft.companyId,
            client: draft.client?.trim(),
            description: draft.description?.trim(),
            status: draft.status || "Active",
        };
    };

    const handleConfirm = (e: React.FormEvent) => {
        e?.preventDefault?.();
        onSave(buildPayload());
    };

    return (
        <form ref={formRef} className={styles.form} onSubmit={handleConfirm}>
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
                    disabled={companiesLoading}
                >
                    <option value="">{companiesLoading ? "Loading companies..." : "Select a company"}</option>
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
            {/* Action buttons removed; handled by modal */}
        </form>
    );
});

export default CreateJobForm;
