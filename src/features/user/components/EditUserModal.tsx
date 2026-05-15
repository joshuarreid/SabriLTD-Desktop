import React, { useCallback, useRef, useState } from "react";

import EditModal from "../../../components/modal/components/EditModal";
import useSaveStatus from "../../../components/save/useSaveStatus";
import { useUpdateUser } from "../hooks/useUsers";
import EditUserForm, { type EditUserFormHandle } from "./EditUserForm";
import styles from "../../job/styles/createjobmodal.module.css";

interface EditUserModalProps {
  open: boolean;
  onClose: () => void;
  onCancel: () => void;
  userId: number;
  initialValues?: { name?: string; email?: string };
  autoFocus?: boolean;
  [key: string]: any;
}

export function EditUserModal({
  open,
  onClose,
  onCancel,
  userId,
  initialValues,
  autoFocus,
  ...rest
}: EditUserModalProps) {
  const [error, setError] = useState<string | null>(null);

  const { status: saveStatus, isSaving, runSave, reset: resetSaveStatus } = useSaveStatus({
    onSaved: onClose,
    savedDelay: 500,
  });

  const updateUser = useUpdateUser();
  const formRef = useRef<EditUserFormHandle | null>(null);

  const closeAndReset = useCallback(() => {
    onClose();
    setError(null);
    resetSaveStatus();
    try {
      updateUser.reset && updateUser.reset();
    } catch {}
  }, [onClose, resetSaveStatus, updateUser]);

  const handleSave = useCallback(() => {
    formRef.current?.submit?.();
  }, []);

  const handleSubmit = useCallback(
    async (values: { name: string; email: string }) => {
      setError(null);
      const payload = {
        name: String(values.name || "").trim(),
        email: String(values.email || "").trim(),
      };

      try {
        await runSave(() => updateUser.mutateAsync({ userId, payload } as any));
      } catch (e: any) {
        setError(e?.message || "Failed to update user");
        throw e;
      }
    },
    [runSave, updateUser, userId]
  );

  return (
    <EditModal
      open={open}
      onClose={closeAndReset}
      onCancel={closeAndReset}
      onSave={handleSave as any}
      onDelete={rest.onDelete}
      isSaving={isSaving}
      saveState={saveStatus}
      title={<h2 className={styles.modalTitle}>Edit User</h2>}
      deleteStatus={rest.deleteStatus}
      deletingText={rest.deletingText}
      deletedText={rest.deletedText}
    >
      <EditUserForm
        ref={formRef}
        onSubmit={handleSubmit}
        isSaving={isSaving}
        error={error}
        autoFocus={!!autoFocus}
        {...(initialValues ? { initialValues } : {})}
        {...rest}
      />
    </EditModal>
  );
}

export default EditUserModal;
