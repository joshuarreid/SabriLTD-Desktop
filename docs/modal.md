# Modal architecture (Canonical User Pattern)

This project uses a **composable modal system**. The **User feature** is the canonical reference for how modals should be built:

- `src/features/user/components/CreateUserModal.tsx`
- `src/features/user/components/EditUserModal.tsx`
- `src/features/user/components/CreateUserForm.tsx`
- `src/features/user/components/EditUserForm.tsx`
- `src/features/user/components/UserSettingsTab.tsx` (orchestrates which modal is open + delete state)

---

## Core ideas

- **One generic modal shell** (`Modal`) for portal + overlay + ESC + structure.
- **Create/Edit modal wrappers** (`CreateModal`, `EditModal`) for consistent header/footer buttons.
- **Feature modals are thin wrappers** (ex: `CreateUserModal`, `EditUserModal`) that connect:
  - API mutations
  - standardized save lifecycle (`useSaveStatus`)
  - close/reset behavior
  - (Edit only) destructive actions (delete) + confirmation/status
- **Form components are UI-only** (fields + validation) and expose a **programmatic submit** API.
- **Save UI is consistent everywhere** via shared `SaveStatus`.

---

## Folder layout

- `src/components/modal/`
  - `components/` – `Modal`, `CreateModal`, `EditModal`
  - `styles/` – generic modal styles
- `src/components/save/`
  - `SaveStatus.jsx` – UI-only status indicator (`saving` / `saved`)
  - `useSaveStatus.ts` – standard save lifecycle (timing + delayed close)
- `src/components/confirmationmodal/`
  - `ConfirmationModal.jsx` – reusable confirm dialog + delete status badge
- `src/features/<feature>/components/`
  - feature-specific modal wrappers + forms (ex: `CreateUserModal.tsx`, `EditUserModal.tsx`)

---

## REQUIRED contract: Create modal wrapper (CreateUserModal pattern)

**Props:**
- `open: boolean`
- `onClose: () => void`
- `onCancel: () => void` (usually same as `onClose`)
- plus any data needed by the form (options, initial values, etc.)

**Behavior:**
1. Clicking **Create** triggers the child form submit via `ref.submit()` (imperative API).
2. Wrapper owns `useSaveStatus({ onSaved: onClose, savedDelay: 500 })`.
3. While saving:
   - form inputs disabled (`isSaving`)
   - modal footer buttons disabled
   - `SaveStatus` shows bottom-right
4. On success:
   - show the “Saved” state for `savedDelay`
   - modal closes via `onSaved`
5. `closeAndReset()` clears wrapper error + resets save lifecycle + resets the mutation if available.

---

## REQUIRED contract: Edit modal wrapper (EditUserModal pattern)

**Props:**
- `open: boolean`
- `onClose: () => void`
- `onCancel: () => void`
- `id` (ex: `userId`)
- `initialValues?: Partial<Values>`
- Optional delete wiring:
  - `onDelete?: () => void`
  - `deleteStatus?: 'idle' | 'deleting' | 'deleted' | 'error'`
  - `deletingText?`, `deletedText?`

**Behavior (save):**
- Uses `useSaveStatus({ onSaved: onClose, savedDelay: 500 })`.
- Clicking **Save** triggers `ref.submit()`.

**Behavior (delete):**
- The trashcan lives in the header (`EditModal`).
- Clicking the trashcan opens `ConfirmationModal`.
- Confirming calls `onDelete()`.
- Delete status animation is driven by `deleteStatus`.
- The parent (e.g. `UserSettingsTab`) coordinates closing the modal after delete animation.

---

## Standard save lifecycle: `useSaveStatus`

- Use `useSaveStatus` in the **modal wrapper**, not in the form.
- `runSave(fn)` wraps the async mutation and manages `saving → saved → idle`.
- `onSaved` runs **after** `savedDelay` (ensures users see the animation).
- Required config: `savedDelay: 500`, `onSaved: onClose`.

---

## Common pitfalls (to avoid)

- **Modal closes immediately after success**: Only close via `useSaveStatus({ onSaved: onClose })`.
- **Footer buttons don’t submit**: Use the form imperative API (`ref.submit()`).
- **Stale form values when reopening**: Ensure the form syncs values when `initialValues` changes.
- **Delete succeeds but edit modal stays open**: The parent screen should close the edit modal after `deleteStatus === 'deleted'` (after an animation delay).
