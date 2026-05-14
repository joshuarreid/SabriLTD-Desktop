import React, { useEffect, useMemo, useRef, useState, forwardRef, useImperativeHandle } from "react";
import { useAllCompanies } from "../../company/hooks/useCompanies";

import styles from "../styles/createjobmodal.module.css";

interface CreateJobFormProps {
    onSubmit: (data: any) => void | Promise<void>;
    error: any;
    statusOptions: Array<{ value: string | number; label: string }>;
    autoFocus: boolean;
    isSaving?: boolean;
    initialValues?: {
        name?: string;
        companyId?: string | number;
        client?: string;
        description?: string;
        status?: string;
    };
}

type SelectOption = { value: string | number; label: string };

const CreateJobForm = forwardRef<any, CreateJobFormProps>(({
    onSubmit,
    error,
    statusOptions,
    autoFocus,
    isSaving = false,
    initialValues,
}, ref) => {
    const nameInputRef = useRef<HTMLInputElement>(null);
    const formRef = useRef<HTMLFormElement>(null);

    const [draft, setDraft] = useState({
        name: initialValues?.name || "",
        companyId: initialValues?.companyId || "",
        client: initialValues?.client || "",
        description: initialValues?.description || "",
        status: initialValues?.status || "Active",
    });
    const [localError, setLocalError] = useState<string | null>(null);

    const { data: companiesData, isLoading: companiesLoading } = useAllCompanies();
    const companyOptions = useMemo<SelectOption[]>(() => {
        if (!companiesData || !Array.isArray((companiesData as any).data)) return [];
        return (companiesData as any).data.map((company: any) => ({
            value: String(company.companyId),
            label: company.name,
        }));
    }, [companiesData]);

    useImperativeHandle(ref, () => ({
        submit: () => {
            if (formRef.current) {
                formRef.current.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
            }
        },
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

    const companyChoices = useMemo(
        () => (companyOptions || []).filter((o: SelectOption) => o.value !== "all"),
        [companyOptions],
    );

    const statusChoices = useMemo(
        () => (statusOptions || []).filter((o: SelectOption) => o.value !== "all"),
        [statusOptions],
    );

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

    const handleSubmit = (e: React.FormEvent) => {
        e?.preventDefault?.();
        setLocalError(null);
        // Validate companyId
        if (!draft.companyId || draft.companyId === "") {
            setLocalError("Company is required.");
            return;
        }
        const companyIdNum = Number(draft.companyId);
        if (isNaN(companyIdNum) || companyIdNum <= 0) {
            setLocalError("Please select a valid company.");
            return;
        }
        onSubmit({
            ...buildPayload(),
            companyId: companyIdNum,
        });
    };

    return (
        <form ref={formRef} className={styles.form} onSubmit={handleSubmit}>
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
                    disabled={isSaving}
                />
            </div>

            <div className={styles.formGroup}>
                <label className={styles.label} htmlFor="create-job-company">
                    Company <span style={{color: 'red'}}>*</span>
                </label>
                <select
                    id="create-job-company"
                    className={styles.select}
                    value={String(draft.companyId)}
                    onChange={(e) => updateDraft("companyId", e.target.value)}
                    disabled={companiesLoading || isSaving}
                    required
                >
                    <option value="">{companiesLoading ? "Loading companies..." : "Select a company"}</option>
                    {companyChoices.map((opt: SelectOption) => (
                        <option key={String(opt.value)} value={String(opt.value)}>
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
                    disabled={isSaving}
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
                    disabled={isSaving}
                >
                    {statusChoices.length > 0 ? (
                        statusChoices.map((opt: SelectOption) => (
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
                <label className={styles.label} htmlFor="create-job-description">
                    Description
                </label>
                <textarea
                    id="create-job-description"
                    className={styles.textarea}
                    value={draft.description}
                    onChange={(e) => updateDraft("description", e.target.value)}
                    placeholder="Enter job description"
                    rows={4}
                    disabled={isSaving}
                />
            </div>

            {localError && <div className={styles.errorMsg}>{localError}</div>}
            {error && <div className={styles.errorMsg}>{error}</div>}
        </form>
    );
});

export default CreateJobForm;
