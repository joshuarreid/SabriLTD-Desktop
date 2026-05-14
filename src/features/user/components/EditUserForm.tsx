import React, {
    forwardRef,
    useEffect,
    useImperativeHandle,
    useRef,
    useState,
} from "react";
import styles from "../styles/edituserprofilemodal.module.css";

export type EditUserValues = {
    name: string;
    email: string;
};

export interface EditUserFormHandle {
    submit: () => void;
}

export interface EditUserFormProps {
    onSubmit: (values: EditUserValues) => void | Promise<void>;
    isSaving?: boolean;
    initialValues?: Partial<EditUserValues>;
    error?: string | null;
    autoFocus?: boolean;
}

const EditUserForm = forwardRef<EditUserFormHandle, EditUserFormProps>(
    ({
        onSubmit,
        isSaving = false,
        initialValues,
        error,
        autoFocus = true,
    }, ref) => {
        const formRef = useRef<HTMLFormElement>(null);
        const nameInputRef = useRef<HTMLInputElement>(null);

        const [draft, setDraft] = useState<EditUserValues>({
            name: initialValues?.name ?? "",
            email: initialValues?.email ?? "",
        });
        const [localError, setLocalError] = useState<string | null>(null);

        useImperativeHandle(ref, () => ({
            submit: () => {
                formRef.current?.dispatchEvent(
                    new Event("submit", { cancelable: true, bubbles: true })
                );
            },
        }));

        useEffect(() => {
            setDraft({
                name: initialValues?.name ?? "",
                email: initialValues?.email ?? "",
            });
            setLocalError(null);
        }, [initialValues?.name, initialValues?.email]);

        useEffect(() => {
            if (!autoFocus) return;
            setTimeout(() => {
                try {
                    nameInputRef.current?.focus?.();
                } catch {
                    // ignore
                }
            }, 0);
        }, [autoFocus]);

        const updateDraft = (field: keyof EditUserValues, value: string) => {
            setDraft((prev) => ({ ...prev, [field]: value }));
        };

        const buildValues = (): EditUserValues => ({
            name: String(draft.name ?? "").trim(),
            email: String(draft.email ?? "").trim(),
        });

        const looksLikeEmail = (value: string) => {
            // light-weight client validation; backend must still validate
            return /^\S+@\S+\.\S+$/.test(value);
        };

        const validate = (values: EditUserValues): string | null => {
            if (!values.name) return "Name is required.";
            if (!values.email) return "Email is required.";
            if (!looksLikeEmail(values.email)) return "Please enter a valid email address.";
            return null;
        };

        const handleSubmit = (e: React.FormEvent) => {
            e.preventDefault();
            setLocalError(null);

            const values = buildValues();
            const err = validate(values);
            if (err) {
                setLocalError(err);
                return;
            }

            onSubmit(values);
        };

        return (
            <form
                ref={formRef}
                className={styles.userForm}
                onSubmit={handleSubmit}
            >
                <div className={styles.formGroup}>
                    <label htmlFor="edit-user-name">Name</label>
                    <input
                        id="edit-user-name"
                        ref={nameInputRef}
                        name="name"
                        type="text"
                        value={draft.name}
                        onChange={(e) => updateDraft("name", e.target.value)}
                        autoComplete="off"
                        className={styles.input}
                        disabled={isSaving}
                    />
                </div>

                <div className={styles.formGroup}>
                    <label htmlFor="edit-user-email">Email</label>
                    <input
                        id="edit-user-email"
                        name="email"
                        type="email"
                        value={draft.email}
                        onChange={(e) => updateDraft("email", e.target.value)}
                        autoComplete="off"
                        className={styles.input}
                        disabled={isSaving}
                    />
                </div>

                {(localError || error) && (
                    <div className={styles.errorMsg}>{localError || error}</div>
                )}
            </form>
        );
    }
);

EditUserForm.displayName = "EditUserForm";

export default EditUserForm;

