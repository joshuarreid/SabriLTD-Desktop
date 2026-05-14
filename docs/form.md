# Form architecture (CRUD forms)

This doc is the **agent playbook** for building CRUD forms in this repo.

It complements `docs/modal.md`:
- **Modals** orchestrate save lifecycle + mutations.
- **Forms** are UI-only: field rendering + validation + collecting values.

The canonical example is the Job feature:
- `src/features/job/components/CreateJobModal.tsx`
- `src/features/job/components/CreateJobForm.tsx`

---

## Current form API (generic and reusable)

We standardize form UI using:

- `src/components/form/useForm.ts`
- `src/components/form/Form.tsx`
- `src/components/form/form.module.css`

### Key idea

Instead of each feature hand-rolling `<label>/<input>` markup and draft state, forms:

1) Define a **values type** (ex: `JobFormValues`).
2) Define `initialValues`.
3) Define a synchronous `validate(values)` function.
4) Define a `fields` array (label, name, type, options, disabled, etc.).
5) Render the generic `<Form />` and pass the `form` object from `useForm`.

This keeps form components small, consistent, and easy to reuse.

---

## Code architecture pattern (copy/paste friendly)

Use this pattern for *new* CRUD screens. It’s intentionally concise and mirrors the Job feature.

### 1) Modal wrapper (owns mutation + save lifecycle)

**Contract**
- Inputs: `open`, `onClose`, plus any context needed for the mutation.
- Owns: mutation hook, save lifecycle, server error.
- Calls: `formRef.current?.submit()` from the footer button.
- Normalizes: values → API payload (trim strings, convert ids to numbers).

**Template (Create)**

```tsx
// CreateXModal.tsx
import React, { useRef, useState } from "react";
// import { CreateModal } from "...";
// import { useCreateX } from "../api/...";
// import { useSaveStatus } from "../../../components/save/useSaveStatus";
import CreateXForm from "./CreateXForm";

export default function CreateXModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const formRef = useRef<{ submit: () => void } | null>(null);
  const [error, setError] = useState<any>(null);

  // const mutation = useCreateX();
  // const { isSaving, saved, runSave, reset: resetSave } = useSaveStatus({ onSaved: onClose, savedDelay: 500 });

  const closeAndReset = () => {
    onClose();
    setError(null);
    // resetSave();
    // mutation.reset?.();
  };

  const handleSubmit = async (values: any) => {
    setError(null);

    // Normalize at the edge (wrapper owns business/API rules)
    const payload = {
      ...values,
      name: String(values.name || "").trim(),
      companyId: Number(values.companyId),
      status: values.status || "Active",
    };

    try {
      // await runSave(() => mutation.mutateAsync(payload));
    } catch (e: any) {
      setError(e);
    }
  };

  return (
    // <CreateModal
    //   open={open}
    //   onClose={closeAndReset}
    //   onCreate={() => formRef.current?.submit()}
    //   isSaving={isSaving}
    //   saved={saved}
    //   error={error}
    // >
    //   <CreateXForm ref={formRef} onSubmit={handleSubmit} isSaving={isSaving} error={error} autoFocus />
    // </CreateModal>

    <div style={{ display: open ? "block" : "none" }}>
      <CreateXForm ref={formRef} onSubmit={handleSubmit} isSaving={false} error={error} autoFocus />
      <button onClick={() => formRef.current?.submit()}>Create</button>
      <button onClick={closeAndReset}>Cancel</button>
    </div>
  );
}
```

### 2) Feature form (UI-only, uses generic useForm + Form)

**Contract**
- Inputs: `onSubmit(values)`, `isSaving`, `error`, `autoFocus`, `initialValues`, plus any options data.
- Owns: client-side validation and field config.
- Does *not* own: mutations, query invalidation, save lifecycle.

**Template (Create/Edit form)**

```tsx
// CreateXForm.tsx
import React, { forwardRef, useEffect, useMemo } from "react";
import Form from "../../../components/form/Form";
import { useForm } from "../../../components/form/useForm";

type XFormValues = {
  name: string;
  companyId: string;
  status: string;
  description: string;
};

type Props = {
  onSubmit: (values: XFormValues) => void | Promise<void>;
  error?: any;
  isSaving?: boolean;
  autoFocus?: boolean;
  initialValues?: Partial<XFormValues>;
};

const CreateXForm = forwardRef<{ submit: () => void; reset?: () => void }, Props>(
  ({ onSubmit, error, isSaving = false, autoFocus = false, initialValues }, ref) => {
    const formInitialValues: XFormValues = {
      name: initialValues?.name || "",
      companyId: initialValues?.companyId ? String(initialValues.companyId) : "",
      status: initialValues?.status || "Active",
      description: initialValues?.description || "",
    };

    const validate = (values: XFormValues) => {
      const errors: Partial<Record<keyof XFormValues, string>> = {};
      if (!values.name.trim()) errors.name = "Name is required.";
      if (!values.companyId) errors.companyId = "Company is required.";
      return errors;
    };

    const form = useForm<XFormValues>({
      initialValues: formInitialValues,
      validate,
      onSubmit,
    });

    // Optional: allow the parent modal to call submit/reset
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
        { name: "name", label: "Name", required: true, autoFocus, disabled: isSaving },
        { name: "companyId", label: "Company", type: "select" as const, required: true, options: [], disabled: isSaving },
        { name: "status", label: "Status", type: "select" as const, options: [{ value: "Active", label: "Active" }], disabled: isSaving },
        { name: "description", label: "Description", type: "textarea" as const, disabled: isSaving },
      ],
      [autoFocus, isSaving]
    );

    return <Form ref={ref} fields={fields} form={form} error={error} />;
  }
);

export default CreateXForm;
```

---

## REQUIRED contracts

### A) Create/Edit modal form contract (UI-only)

**Form props** (example: `CreateJobForm.tsx`):

- `onSubmit(values) => void | Promise<void>`
- `isSaving?: boolean` (disable inputs while saving)
- `initialValues?: Partial<Values>` (optional)
- `error?: string | any` (server error from modal wrapper)
- Any data needed to render fields (options arrays, etc.)

**Imperative ref (REQUIRED)**

Every modal-backed form must support:

- `ref.submit()`

Why: the **Save/Create** button lives in the modal footer (outside the `<form>`).

Implementation requirement:

- Use `forwardRef` + `useImperativeHandle`
- Keep a real `<form>` element (the generic `Form.tsx` already does this)
- Implement `submit()` by dispatching a submit event on the form element

In the current architecture:

- The generic `useForm()` exposes `formRef` and `imperativeHandle()`
- The generic `Form` calls `useImperativeHandle(ref, () => form.imperativeHandle())`

That means your feature form usually just needs to forward the ref to `<Form />`.

---

## Modal wrapper pattern (Create/Edit)

Model wrappers after `CreateJobModal.tsx`.

### Responsibilities checklist

1. Own wrapper error state:
   - `const [error, setError] = useState<string | null>(null)`

2. Own save lifecycle:
   - `useSaveStatus({ onSaved: onClose, savedDelay: 500 })`

3. Create a `formRef` and a footer handler:
   - `handleCreate/handleSave` calls `formRef.current?.submit()`

4. Implement `closeAndReset()`:
   - calls `onClose()`
   - clears wrapper error
   - resets `useSaveStatus`
   - (optional) resets mutation state (`mutation.reset()` if available)

5. Implement `handleSubmit(values)`:
   - `setError(null)`
   - normalize values (IDs as numbers, trim strings)
   - `await runSave(() => mutation.mutateAsync(payload))`
   - catch and set an error message

### Payload normalization rules (do these in wrapper)

Do normalization in the wrapper because it’s **business/API logic**.

Common rules used in this repo:

- Convert dropdown IDs to numbers:
  - `companyId: Number(values.companyId)`
- Trim user input strings:
  - `name: String(values.name || "").trim()`
- Provide defaults:
  - `status: values.status || "Active"`
- Add metadata:
  - `updatedBy: currentUserId` (if required by backend)

---

## Form implementation pattern (UI-only, using the generic API)

Model forms after `CreateJobForm.tsx`.

### Responsibilities checklist

1. Gather any data needed for field options
   - ex: `useAllCompanies()`
   - transform API results into `options: Array<{ value; label }>`

2. Define the form values type

- Keep values as strings for inputs/selects.
- Convert to numbers in the wrapper (or at the edge right before payload creation).

3. Create `initialValues`

- Usually derived from `initialValues?: Partial<Values>` prop.

4. Validation

- Provide a synchronous `validate(values)` function.
- Return an object keyed by field name with error messages.

5. Wire `useForm({ initialValues, validate, onSubmit })`

- `useForm` owns:
  - values
  - errors
  - submit handler
  - isSubmitting

6. Define the `fields` array for `<Form />`

Typical supported config (see `Form.tsx`):

- `name` (must match values key)
- `label`
- `type?: "text" | "textarea" | "select"`
- `options?: { value; label }[]` for selects
- `required?: boolean`
- `autoFocus?: boolean`
- `placeholder?: string`
- `disabled?: boolean` (usually `isSaving`)

7. Render

- Render the generic `<Form />` and pass:
  - `fields`
  - `form`
  - `error` (server error)

### Error rendering priority

- Field errors from `validate()` are shown next to the field.
- Server errors from the wrapper are rendered below the fields.

---

## Anti-patterns (don’t do these)

- **Don’t call `onClose()` immediately after a successful mutation**
  - Use `useSaveStatus({ onSaved: onClose })` so users see the “Saved” state for 500ms.

- **Don’t put mutation hooks or query invalidation inside the form component**
  - Keep forms UI-only.

- **Don’t rely on `<button type="submit">` in the modal footer**
  - The footer is not inside the `<form>`. Use imperative `ref.submit()`.

- **Don’t forget to disable inputs while saving**
  - Users can double-submit.

---

## Minimal templates (high-level)

### Create/Edit modal wrapper template

- Use `CreateModal` / `EditModal`
- Use `useSaveStatus`
- Imperatively submit the child form
- Normalize values into API payload

### Create/Edit form template

- Define `Values` type
- Build `initialValues`
- Implement `validate(values)`
- Use `useForm({ initialValues, validate, onSubmit })`
- Define `fields` and render `<Form />`

(Use the Job feature as the source of truth when in doubt.)
