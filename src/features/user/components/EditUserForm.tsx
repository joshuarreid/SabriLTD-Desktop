import React, { forwardRef, useEffect, useMemo } from "react";
import Form from "../../../components/form/Form";
import { useForm } from "../../../components/form/useForm";

type UserFormValues = {
    name: string;
    email: string;
};

export type EditUserFormHandle = {
    submit: () => void;
    reset?: () => void;
};

interface EditUserFormProps {
    onSubmit: (values: UserFormValues) => void | Promise<void>;
    error?: any;
    isSaving?: boolean;
    autoFocus?: boolean;
    initialValues?: Partial<UserFormValues>;
}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const EditUserForm = forwardRef<EditUserFormHandle, EditUserFormProps>(
    ({ onSubmit, error, isSaving = false, autoFocus = false, initialValues }, ref) => {
        const formInitialValues: UserFormValues = useMemo(
            () => ({
                name: initialValues?.name || "",
                email: initialValues?.email || "",
            }),
            [initialValues?.name, initialValues?.email]
        );

        const validate = (values: UserFormValues) => {
            const errors: Partial<Record<keyof UserFormValues, string>> = {};

            if (!values.name.trim()) errors.name = "Name is required.";

            const email = values.email.trim();
            if (!email) errors.email = "Email is required.";
            else if (!emailRegex.test(email)) errors.email = "Please enter a valid email.";

            return errors;
        };

        const form = useForm<UserFormValues>({
            initialValues: formInitialValues,
            validate,
            onSubmit: async (vals) => {
                // Keep this component UI-only; normalize light input trimming here.
                await onSubmit({
                    name: String(vals.name || "").trim(),
                    email: String(vals.email || "").trim(),
                });
            },
        });

        // When the modal is reused for a different user (or reopened), sync new initialValues.
        useEffect(() => {
            form.setValues(formInitialValues);
            form.setErrors({});
        }, [formInitialValues]);

        useEffect(() => {
            if (!autoFocus) return;
            setTimeout(() => {
                const el = document.getElementById("name");
                (el as HTMLInputElement | null)?.focus?.();
            }, 0);
        }, [autoFocus]);

        const fields = useMemo(
            () => [
                {
                    name: "name",
                    label: "Name",
                    required: true,
                    autoFocus,
                    placeholder: "Jane Doe",
                    disabled: isSaving,
                },
                {
                    name: "email",
                    label: "Email",
                    required: true,
                    placeholder: "jane@example.com",
                    disabled: isSaving,
                },
            ],
            [autoFocus, isSaving]
        );

        // Forward the ref to the generic <Form />, which exposes submit/reset per form.md.
        return <Form ref={ref} fields={fields} form={form} error={error} />;
    }
);

export default EditUserForm;
