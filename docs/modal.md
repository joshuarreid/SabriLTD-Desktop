# Modal architecture

This project uses a **composable modal system** designed for a form-heavy CRUD app.

Core ideas:

- **One generic modal shell** (layout + portal + accessibility + overlay/cancel behavior).
- **Feature modals are thin wrappers** that compose the modal shell with a **feature-specific form**.
- **Form components own form fields and validation** (React Hook Form, controlled inputs, etc.).
- **Save UI is consistent everywhere** via a shared `SaveStatus` component and the shared `useSaveStatus` hook.
- **Deletes are confirmed** with a shared confirmation modal pattern.

---

## Folder layout (high level)

- `src/components/modal/`
  - `components/` – modal building blocks (generic `Modal`, `CreateModal`, `EditModal`, etc.)
  - `hooks/` – generic modal hooks (open/close, ESC behavior, etc.)
  - `styles/` – modal styles

- `src/components/save/`
  - `SaveStatus.jsx` – presentational status indicator (saving/saved/error)
  - `useSaveStatus.ts` – **standardized save lifecycle** (timing + close-after-success)

- `src/components/confirmationmodal/`
  - `ConfirmationModal.jsx` – reusable confirm dialog for destructive actions

Your feature code lives under `src/features/<feature>/...` (jobs, items, etc.). That’s where **feature-specific forms and modal wrappers** should live.

---

## The "contract" for a form modal

A scalable modal pattern is easiest when every form modal follows the same contract:

- **Inputs**
  - `open: boolean`
  - `onClose: () => void`
  - `onSubmit: (values) => Promise<void>` (create/update)
  - For edit: `initialValues` or `entity` (job/item/etc.)

- **Behavior**
  - Clicking **Save** calls `onSubmit`.
  - While saving, status becomes `saving`.
  - On success, show `saved` animation for **500ms**, then close the modal.
  - On failure, show `error` (and optionally render field errors / toast).

- **Outputs**
  - `onClose()` is called after success delay.
  - Caller can refetch/optimistically update outside the modal.

---

## Standard save behavior: `useSaveStatus`

`useSaveStatus` exists so every form modal behaves the same.

**Key points**

- `savedDelay` defaults to **500ms**.
- `onSaved` is executed **after** the delay (perfect for closing the modal after the success animation is visible).
- `runSave(fn)` wraps an async operation and sets status automatically.

Typical usage:

- In the modal wrapper: `const { status, runSave } = useSaveStatus({ onSaved: onClose })`
- In your form submit: `await runSave(() => mutation.mutateAsync(values))`
- Render: `<SaveStatus status={status} />`

> Recommendation: Keep `SaveStatus` presentational only. Put timing, transitions, and close logic in `useSaveStatus`.

---

## Create form modal pattern (with useCreateJob)

### Suggested files

Inside a feature (example `job`):

- `src/features/job/components/JobCreateModal.tsx`
- `src/features/job/components/JobForm.tsx`

### Responsibilities

- `JobCreateModal`
  - owns modal open/close wiring
  - calls create API via `useCreateJob`
  - uses `useSaveStatus({ onSaved: onClose })` to keep behavior consistent

- `JobForm`
  - renders fields
  - validates
  - calls `onSubmit(values)`

### Example (integrated with useCreateJob)

```tsx
import { useCreateJob } from "../../hooks/useJobs";
import useSaveStatus from "../../../components/save/useSaveStatus";
import SaveStatus from "../../../components/save/SaveStatus";

function JobCreateModal({ open, onClose }) {
  const createJob = useCreateJob();
  const { status, runSave } = useSaveStatus({ onSaved: onClose, savedDelay: 500 });

  const handleSubmit = async (values) => {
    await runSave(() => createJob.mutateAsync(values));
  };

  return (
    <CreateModal open={open} onClose={onClose} title="Create job">
      <JobForm mode="create" onSubmit={handleSubmit} />
      <SaveStatus status={status} />
    </CreateModal>
  );
}
```

Notes:

- `useCreateJob` handles cache invalidation and side effects as configured in your project.
- If your `CreateModal` already renders a footer, prefer passing an `onCreate` handler into it and keep the form submit connected via `form` + `button type="submit"`.
- Keep API concerns in the modal wrapper, not in the form fields component, unless you intentionally build a “smart form”.

---

## Edit form modal pattern (with useUpdateJob)

### Suggested files

- `src/features/job/components/JobEditModal.tsx`
- `src/features/job/components/JobForm.tsx` (same form component, different `mode`)

### Responsibilities

- `JobEditModal`
  - receives `job` (or `jobId` + query)
  - maps entity -> initial form values
  - calls update API via `useUpdateJob`
  - closes after successful save delay

### Example (integrated with useUpdateJob)

```tsx
import { useUpdateJob } from "../../hooks/useJobs";
import useSaveStatus from "../../../components/save/useSaveStatus";
import SaveStatus from "../../../components/save/SaveStatus";

function JobEditModal({ open, onClose, job }) {
  const updateJob = useUpdateJob();
  const { status, runSave } = useSaveStatus({ onSaved: onClose });

  const handleSubmit = async (values) => {
    await runSave(() => updateJob.mutateAsync({ jobId: job.id, job: values }));
  };

  return (
    <EditModal open={open} onClose={onClose} title="Edit job">
      <JobForm mode="edit" initialValues={job} onSubmit={handleSubmit} />
      <SaveStatus status={status} />
    </EditModal>
  );
}
```

Notes:

- Prefer a form prop like `initialValues` and reset the form when the modal opens (depends on your form library).
- If you fetch the job inside the modal, handle loading states and disable Save until the form is ready.
- `useUpdateJob` handles cache invalidation and side effects as configured in your project.

---

## Delete confirmation modal pattern (with useDeleteJob and useDeleteStatus)

Deletes should use the same feedback and timing pattern as saves, but with `DeleteStatus` and `useDeleteStatus`.

### Suggested files

- `src/features/job/components/JobDeleteButton.tsx` (or `JobDeleteModal.tsx`)

### Responsibilities

- A small wrapper opens a `ConfirmationModal`
- Confirm runs delete mutation via `useDeleteJob` and `useDeleteStatus`
- On success, show the deleted animation for 0.5s, then close the modal and optionally show a toast

### Example (integrated with useDeleteJob and useDeleteStatus)

```tsx
import { useDeleteJob } from "../../hooks/useJobs";
import useDeleteStatus from "../../../components/delete/useDeleteStatus";
import ConfirmationModal from "../../../components/confirmationmodal/ConfirmationModal";

function JobDeleteButton({ jobId, onDeleted }) {
  const [open, setOpen] = useState(false);
  const deleteJob = useDeleteJob();
  const { status, runDelete } = useDeleteStatus({
    onDeleted: () => {
      setOpen(false);
      onDeleted?.();
    },
    deletedDelay: 500,
  });

  const handleConfirm = async () => {
    await runDelete(() => deleteJob.mutateAsync(jobId));
  };

  return (
    <>
      <button onClick={() => setOpen(true)}>Delete</button>
      <ConfirmationModal
        open={open}
        title="Delete job?"
        description="This can’t be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleConfirm}
        onCancel={() => setOpen(false)}
        deleteStatus={status}
      />
    </>
  );
}
```

**Notes:**
- `deleteStatus` is passed to `ConfirmationModal`, which will show the correct badge and disable buttons as appropriate.
- The modal closes after the deleted animation (0.5s by default).
- You can use the same pattern for any destructive action.

---

## Where should logic live?

Keep the system scalable by putting logic in the right place:

- **Modal shell (`Modal`)**
  - portal, overlay, escape key, focus trapping (if implemented), sizing, basic layout

- **Modal wrapper (`JobCreateModal`, `JobEditModal`)**
  - connects feature concerns (API calls/mutations)
  - wires `open`/`onClose`
  - standardizes save behavior via `useSaveStatus`

- **Form component (`JobForm`)**
  - fields and validation
  - maps UI -> values and emits `onSubmit(values)`

- **Shared UI (`SaveStatus`, `ConfirmationModal`)**
  - UI only; keep them reusable and free of app-specific logic

---

## Checklist for a new feature modal

1. Create a form component for the entity (`<Entity>Form`).
2. Create a create wrapper modal (`<Entity>CreateModal`) that:
   - uses `useSaveStatus({ onSaved: onClose })`
   - uses `runSave(() => api.create(values))`
   - renders `<SaveStatus status={status} />`
3. Create an edit wrapper modal (`<Entity>EditModal`) that:
   - passes `initialValues`
   - uses `runSave(() => api.update(id, values))`
4. Use `ConfirmationModal` for delete.

---

## Common pitfalls (and how to avoid them)

- **Closing immediately after save**: users don’t see success feedback.
  - Fix: always close via `useSaveStatus({ onSaved: onClose })`.

- **Duplicated save logic**: each modal implements its own timers and states.
  - Fix: use `useSaveStatus` everywhere.

- **Putting API code inside field components**: makes reusing forms harder.
  - Fix: keep API calls in modal wrappers.

- **Form state not resetting when re-opening**: stale values appear.
  - Fix: reset form on `open` change (depends on your form library).
