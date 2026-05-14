import React, { useMemo, forwardRef, useEffect } from "react";
import { useAllCompanies } from "../../company/hooks/useCompanies";
import { useForm } from "../../../components/form/useForm";
import Form from "../../../components/form/Form";
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

type JobFormValues = {
    name: string;
    companyId: string;
    client: string;
    description: string;
    status: string;
};

type SelectOption = { value: string | number; label: string };

const CreateJobForm = forwardRef<any, CreateJobFormProps>(({
    onSubmit,
    error,
    statusOptions,
    autoFocus,
    isSaving = false,
    initialValues,
}, ref) => {
    const { data: companiesData, isLoading: companiesLoading } = useAllCompanies();
    const companyOptions = useMemo<SelectOption[]>(() => {
        if (!companiesData || !Array.isArray((companiesData as any).data)) return [];
        return (companiesData as any).data.map((company: any) => ({
            value: String(company.companyId),
            label: company.name,
        }));
    }, [companiesData]);

    const companyChoices = useMemo(
        () => (companyOptions || []).filter((o: SelectOption) => o.value !== "all"),
        [companyOptions],
    );

    const statusChoices = useMemo(
        () => (statusOptions || []).filter((o: SelectOption) => o.value !== "all"),
        [statusOptions],
    );

    // Initial values fallback
    const formInitialValues: JobFormValues = {
        name: initialValues?.name || "",
        companyId: initialValues?.companyId ? String(initialValues.companyId) : "",
        client: initialValues?.client || "",
        description: initialValues?.description || "",
        status: initialValues?.status || "Active",
    };

    // Validation logic
    const validate = (values: JobFormValues) => {
        const errors: Partial<Record<keyof JobFormValues, string>> = {};
        if (!values.name.trim()) errors.name = "Job name is required.";
        if (!values.companyId || values.companyId === "") errors.companyId = "Company is required.";
        else if (isNaN(Number(values.companyId)) || Number(values.companyId) <= 0) errors.companyId = "Please select a valid company.";
        return errors;
    };

    // useForm hook
    const form = useForm<JobFormValues>({
        initialValues: formInitialValues,
        validate,
        onSubmit: (vals: JobFormValues) => {
            onSubmit({
                ...vals,
                name: vals.name.trim(),
                client: vals.client.trim(),
                description: vals.description.trim(),
                companyId: Number(vals.companyId),
                status: vals.status || "Active",
            });
        },
    });

    // Expose imperative submit
    React.useImperativeHandle(ref, () => form.imperativeHandle(), [form]);

    // Autofocus logic
    useEffect(() => {
        if (autoFocus) {
            setTimeout(() => {
                const el = document.getElementById("name");
                if (el) (el as HTMLInputElement).focus();
            }, 0);
        }
    }, [autoFocus]);

    // Field config
    const fields = [
        {
            name: "name",
            label: "Job Name",
            required: true,
            autoFocus: autoFocus,
            placeholder: "Enter job name",
            disabled: isSaving,
        },
        {
            name: "companyId",
            label: "Company",
            type: "select",
            required: true,
            options: companiesLoading ? [{ value: "", label: "Loading companies..." }] : companyChoices,
            disabled: companiesLoading || isSaving,
        },
        {
            name: "client",
            label: "Client",
            placeholder: "Enter client name",
            disabled: isSaving,
        },
        {
            name: "status",
            label: "Status",
            type: "select",
            options: statusChoices.length > 0 ? statusChoices : [
                { value: "Active", label: "Active" },
                { value: "Pending Storage", label: "Pending Storage" },
                { value: "Closed", label: "Closed" },
            ],
            disabled: isSaving,
        },
        {
            name: "description",
            label: "Description",
            type: "textarea",
            placeholder: "Enter job description",
            disabled: isSaving,
        },
    ];

    return (
        <Form
            ref={ref}
            fields={fields}
            form={form}
            error={error}
            className={styles.form}
        />
    );
});

export default CreateJobForm;
