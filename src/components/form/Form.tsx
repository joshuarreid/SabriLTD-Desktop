import React, { forwardRef, useImperativeHandle } from "react";
import styles from "./form.module.css";

interface FieldConfig {
    name: string;
    label: string;
    type?: "text" | "textarea" | "select";
    options?: Array<{ value: string | number; label: string }>;
    required?: boolean;
    autoFocus?: boolean;
    placeholder?: string;
    disabled?: boolean;
}

interface FormProps<T> {
    fields: FieldConfig[];
    form: ReturnType<typeof import("./useForm").useForm<T>>;
    renderField?: (field: FieldConfig, form: ReturnType<typeof import("./useForm").useForm<T>>) => React.ReactNode;
    error?: any;
    className?: string;
    style?: React.CSSProperties;
}

function DefaultField<T>({ field, form }: { field: FieldConfig; form: any }) {
    const { values, handleChange, errors, isSubmitting } = form;
    const commonProps = {
        id: field.name,
        name: field.name,
        value: values[field.name] ?? "",
        onChange: (e: any) => handleChange(field.name, e.target.value),
        disabled: field.disabled || isSubmitting,
        placeholder: field.placeholder,
        autoFocus: field.autoFocus,
    };
    if (field.type === "textarea") {
        return (
            <textarea {...commonProps} className={styles.formTextarea} rows={4} />
        );
    }
    if (field.type === "select") {
        return (
            <select {...commonProps} className={styles.formSelect}>
                <option value="">Select...</option>
                {(field.options || []).map(opt => (
                    <option key={String(opt.value)} value={String(opt.value)}>{opt.label}</option>
                ))}
            </select>
        );
    }
    return <input type="text" {...commonProps} className={styles.formInput} />;
}

const Form = forwardRef(<T,>(props: FormProps<T>, ref) => {
    const { fields, form, renderField, error, className, style } = props;
    useImperativeHandle(ref, () => form.imperativeHandle(), [form]);
    return (
        <form ref={form.formRef} onSubmit={form.handleSubmit} className={className ? `${styles.form} ${className}` : styles.form} style={style}>
            {fields.map(field => (
                <div key={field.name} className={styles.formField}>
                    <label htmlFor={field.name} className={styles.formLabel}>
                        {field.label}
                        {field.required && <span style={{ color: 'red' }}> *</span>}
                    </label>
                    {renderField ? renderField(field, form) : <DefaultField field={field} form={form} />}
                    {form.errors[field.name] && (
                        <div className={styles.formError}>{form.errors[field.name]}</div>
                    )}
                </div>
            ))}
            {error && <div className={styles.formError}>{error}</div>}
        </form>
    );
});

export default Form;
