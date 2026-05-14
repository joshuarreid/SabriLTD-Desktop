import React, { forwardRef, useEffect, useMemo } from "react";
import Form from "../../../components/form/Form";
import { useForm } from "../../../components/form/useForm";

type UserFormValues = {
    name: string;
    email: string;
};

export type CreateUserFormHandle = {
    submit: () => void;
    reset?: () => void;
};

interface CreateUserFormProps {
    onSubmit: (values: UserFormValues) => void | Promise<void>;
    error?: any;
    isSaving?: boolean;
    autoFocus?: boolean;
    initialValues?: Partial<UserFormValues>;
}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const CreateUserForm = forwardRef<CreateUserFormHandle, CreateUserFormProps>(
    ({ onSubmit, error, isSaving = false, autoFocus = false, initialValues }, ref) => {
        const formInitialValues: UserFormValues = {
            name: initialValues?.name || "",
            email: initialValues?.email || "",
        };

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
                // Keep the form UI-only; normalize light input sanitation here.
                await onSubmit({
                    name: String(vals.name || "").trim(),
                    email: String(vals.email || "").trim(),
                });
            },
        });

        // Expose imperative submit/reset to the modal footer.
        React.useImperativeHandle(ref, () => form.imperativeHandle(), [form]);

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

        return <Form ref={ref} fields={fields} form={form} error={error} />;
    }
);

export default CreateUserForm;

