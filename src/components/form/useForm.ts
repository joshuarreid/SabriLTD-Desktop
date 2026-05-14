import { useState, useRef, useCallback, useImperativeHandle } from "react";

export interface UseFormOptions<T> {
    initialValues: T;
    validate?: (values: T) => Partial<Record<keyof T, string>>;
    onSubmit: (values: T) => void | Promise<void>;
}

export function useForm<T extends Record<string, any>>({
    initialValues,
    validate,
    onSubmit,
}: UseFormOptions<T>) {
    const [values, setValues] = useState<T>(initialValues);
    const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const formRef = useRef<HTMLFormElement>(null);

    const handleChange = useCallback((field: keyof T, value: any) => {
        setValues((prev) => ({ ...prev, [field]: value }));
    }, []);

    const handleSubmit = useCallback(async (e?: React.FormEvent) => {
        e?.preventDefault?.();
        if (validate) {
            const validationErrors = validate(values);
            setErrors(validationErrors);
            if (Object.keys(validationErrors).length > 0) return;
        }
        setIsSubmitting(true);
        try {
            await onSubmit(values);
        } finally {
            setIsSubmitting(false);
        }
    }, [values, validate, onSubmit]);

    const resetForm = useCallback(() => {
        setValues(initialValues);
        setErrors({});
    }, [initialValues]);

    // For imperative submit
    const imperativeHandle = useCallback(() => ({
        submit: () => {
            if (formRef.current) {
                formRef.current.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
            }
        },
        reset: resetForm,
    }), [resetForm]);

    return {
        values,
        setValues,
        errors,
        setErrors,
        isSubmitting,
        handleChange,
        handleSubmit,
        resetForm,
        formRef,
        imperativeHandle,
    };
}

