# Form architecture (CRUD forms, Canonical User Pattern)

This doc is the **playbook** for building CRUD forms in this repo. The **User feature** is the canonical reference:

- `src/features/user/components/CreateUserForm.tsx`
- `src/features/user/components/EditUserForm.tsx`

---

## Key properties of the pattern

- Forms are UI-only: field rendering + validation + collecting values.
- Forms use the shared form engine (`useForm` + `<Form />`).
- Forms support **imperative submit** so modal footer buttons can submit.
- Edit forms support **re-initialization** when `initialValues` changes (for entity switching).

---

## REQUIRED contract: modal-backed forms

**Props:**
- `onSubmit(values) => Promise<void> | void`
- `isSaving?: boolean` (disable inputs while saving)
- `initialValues?: Partial<Values>` (optional)
- `error?: any` (server error passed down from the modal wrapper)
- any data needed to render fields (options arrays, etc.)

**Imperative ref (REQUIRED):**
- Every modal-backed form must support: `ref.submit()`
- Implementation: Use `forwardRef` and forward the ref to `<Form ref={ref} ... />`.

---

## REQUIRED behavior: edit form re-initialization

- Compute `formInitialValues` from `initialValues`.
- Run an effect that calls `form.setValues(formInitialValues)` and `form.setErrors({})` when they change.
- This prevents stale data when switching entities.

---

## Where normalization belongs

- Keep forms UI-only.
- Trimming strings, converting ids, and adding metadata belongs in the **modal wrapper** (business/API logic).

---

## Minimal template (copy/paste)

```tsx
import React, { forwardRef, useEffect, useMemo } from "react";
import Form from "../../../components/form/Form";
import { useForm } from "../../../components/form/useForm";

type Values = {
  name: string;
  email: string;
};

type Props = {
  onSubmit: (values: Values) => void | Promise<void>;
  error?: any;
  isSaving?: boolean;
  autoFocus?: boolean;
  initialValues?: Partial<Values>;
};

const MyForm = forwardRef<{ submit: () => void; reset?: () => void }, Props>(
  ({ onSubmit, error, isSaving = false, autoFocus = false, initialValues }, ref) => {
    const formInitialValues: Values = useMemo(
      () => ({
        name: initialValues?.name ?? "",
        email: initialValues?.email ?? "",
      }),
      [initialValues?.name, initialValues?.email]
    );

    const validate = (values: Values) => {
      const errors: Partial<Record<keyof Values, string>> = {};
      if (!values.name.trim()) errors.name = "Name is required.";
      if (!values.email.trim()) errors.email = "Email is required.";
      return errors;
    };

    const form = useForm<Values>({ initialValues: formInitialValues, validate, onSubmit });

    // Edit/reuse case
    useEffect(() => {
      form.setValues(formInitialValues);
      form.setErrors({});
    }, [formInitialValues]);

    const fields = useMemo(
      () => [
        { name: "name", label: "Name", required: true, autoFocus, disabled: isSaving },
        { name: "email", label: "Email", required: true, disabled: isSaving },
      ],
      [autoFocus, isSaving]
    );

    return <Form ref={ref} fields={fields} form={form} error={error} />;
  }
);

export default MyForm;
```

---

## Anti-patterns (don’t do these)

- Don’t put mutation hooks or query invalidation inside the form component.
- Don’t call `onClose()` from inside the form.
- Don’t rely on `<button type="submit">` in the modal footer.
- Don’t forget to disable inputs while saving (double submits).
