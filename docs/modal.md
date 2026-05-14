# Modal architecture

This project uses a **composable modal system** designed for a form-heavy CRUD app.

Core ideas:

- **One generic modal shell** (`Modal`) for portal + overlay + ESC + structure.
- **Create/Edit modal wrappers** (`CreateModal`, `EditModal`) for consistent header/footer buttons.
- **Feature modals are thin wrappers** (ex: `CreateJobModal`) that connect:
  - API mutations
  - standardized save lifecycle (`useSaveStatus`)
  - close/reset behavior
- **Form components own fields + validation** and expose a **programmatic submit** API.
- **Save UI is consistent everywhere** via shared `SaveStatus`.

---

## Folder layout

- `src/components/modal/`
  - `components/` – `Modal`, `CreateModal`, `EditModal`
  - `hooks/` – modal hooks (if needed)
  - `styles/` – generic modal styles

- `src/components/save/`
  - `SaveStatus.jsx` – UI-only status indicator (`saving` / `saved`)
  - `useSaveStatus.ts` – standard save lifecycle (timing + delayed close)

- `src/features/<feature>/components/`
  - feature-specific modal wrappers + forms (ex: `CreateJobModal.tsx`, `CreateJobForm.tsx`)

---

## The REQUIRED contract for a **Create Form Modal** (the “Create Job” pattern)

This is the pattern we want for **every create modal** going forward.

### Inputs (props)

**Modal wrapper** (feature-level, ex: `CreateJobModal.tsx`):

- `open: boolean`
- `onClose: () => void`
- `onCancel: () => void` (usually same as `onClose`)
- options data needed by the form (ex: `statusOptions`, `companyOptions`, etc.)

**Form component** (ex: `CreateJobForm.tsx`):

- `onSubmit(values) => Promise<void> | void`
- `isSaving?: boolean`
- `initialValues?: Partial<Values>`
- (optional) `error` string to display (server errors)

### Behavior (must match)

1. Clicking **Create** in the modal triggers the form submit (programmatically).
2. While saving:
   - `useSaveStatus` state becomes `saving`
   - the modal disables buttons (`isSaving`)
   - `SaveStatus` shows a spinner **in the bottom-right of the modal footer**
3. On success:
   - state becomes `saved`
   - `SaveStatus` shows “Saved” for **500ms**
   - then the modal closes automatically (delayed close)
4. Cancel closes immediately (no delay), and resets local save + error state.

### Visual requirement

- The save animation is shown **inside the modal footer, bottom-right**.
  - This is implemented in `src/components/modal/components/CreateModal.tsx`.

---

## Standard save lifecycle: `useSaveStatus` (do this exactly)

Use `useSaveStatus` in the **modal wrapper**, not in the form.

- `runSave(fn)` wraps the async mutation and manages `saving → saved → idle`.
- `onSaved` runs **after** `savedDelay` (this is what ensures users see the animation).

Required configuration for create modals:

- `savedDelay: 500`
- `onSaved: onClose`

---

## Reference implementation (this is the canonical template)

### 1) Feature modal wrapper (example: `CreateJobModal.tsx`)

**Responsibilities**

- Owns `useSaveStatus({ onSaved: onClose, savedDelay: 500 })`
- Owns the mutation hook (ex: `useCreateJob()`)
- Normalizes payload (IDs to numbers, trim strings, etc.)
- Passes `isSaving` into the form to disable inputs
- Uses `CreateModal` and passes:
  - `onCreate` callback that triggers the child form’s `submit()` via ref
  - `isSaving`
  - `saveState` from `useSaveStatus`

Skeleton:

```tsx
import React, { useCallback, useRef, useState } from "react";
import CreateModal from "src/components/modal/components/CreateModal";
import useSaveStatus from "src/components/save/useSaveStatus";

export function CreateThingModal({ open, onClose, onCancel, ...rest }) {
  const [error, setError] = useState<string | null>(null);

  const { status: saveStatus, isSaving, runSave, reset } = useSaveStatus({
    onSaved: onClose,
    savedDelay: 500,
  });

  const formRef = useRef<{ submit: () => void } | null>(null);

  const closeAndReset = useCallback(() => {
    onClose();
    setError(null);
    reset();
  }, [onClose, reset]);

  const handleCreate = useCallback(() => {
    formRef.current?.submit?.();
  }, []);

  const handleSubmit = useCallback(async (values) => {
    setError(null);
    try {
      await runSave(() => /* mutation */ Promise.resolve(values));
    } catch (e: any) {
      setError(e?.message ?? "Failed to create");
    }
  }, [runSave]);

  return (
    <CreateModal
      open={open}
      onClose={closeAndReset}
      onCancel={closeAndReset}
      onCreate={handleCreate}
      isSaving={isSaving}
      saveState={saveStatus}
      title={<h2>New Thing</h2>}
    >
      <CreateThingForm
        ref={formRef}
        onSubmit={handleSubmit}
        isSaving={isSaving}
        error={error}
        {...rest}
      />
    </CreateModal>
  );
}
```

### 2) Form contract (example: `CreateJobForm.tsx`)

**Responsibilities**

- Owns field state + validation
- Calls `onSubmit(values)` when valid
- Exposes an imperative `submit()` API using `forwardRef` + `useImperativeHandle`
- Disables inputs while `isSaving` is true

Required imperative API:

```tsx
useImperativeHandle(ref, () => ({
  submit: () => {
    formRef.current?.dispatchEvent(
      new Event("submit", { cancelable: true, bubbles: true })
    );
  },
}));
```

---

## CreateModal requirements (shared component)

`src/components/modal/components/CreateModal.tsx` must:

- Render **Cancel** and **Create** buttons in the footer
- Disable both buttons while `isSaving`
- Render `<SaveStatus status={saveState} />` in the **footer bottom-right**
  - It should always be mounted; it returns `null` for `idle`

This is what guarantees the animation is visible.

---

## Checklist: when making a new create modal

1. Create `Create<Thing>Modal.tsx` in `src/features/<thing>/components/`.
2. Create `Create<Thing>Form.tsx` in the same folder.
3. In the modal wrapper:
   - use `useSaveStatus({ onSaved: onClose, savedDelay: 500 })`
   - implement `closeAndReset()` that resets save + errors
   - implement `handleCreate()` that calls `formRef.current.submit()`
   - wrap the mutation call with `await runSave(() => mutateAsync(payload))`
4. In the form:
   - `forwardRef` + `useImperativeHandle` with `submit()`
   - validate required fields
   - disable inputs using `isSaving`
5. UI requirement:
   - confirm you see the spinner + saved checkmark **bottom-right** before the modal closes.

---

## Common pitfalls (what to avoid)

- **Modal closes immediately after success**
  - Cause: calling `onClose()` directly after mutation.
  - Fix: only close via `useSaveStatus({ onSaved: onClose })`.

- **SaveStatus not visible**
  - Cause: rendering it in the wrong place (header/top-right) or behind layout.
  - Fix: render it in `CreateModal` footer bottom-right.

- **Create button doesn’t submit**
  - Cause: button is outside the `<form>`.
  - Fix: use the imperative `submit()` API via `ref` exactly as above.

- **Stale form values when reopening**
  - Fix: reset local state when `open` changes OR structure form state around `initialValues` with an effect.
