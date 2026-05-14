import React, { useCallback, useRef, useState } from "react";
import CreateModal from "../../../components/modal/components/CreateModal";
import useSaveStatus from "../../../components/save/useSaveStatus";
import CreateUserForm from "./CreateUserForm";
import { useCreateUser } from "../hooks/useUsers";
import styles from "../../job/styles/createjobmodal.module.css";

interface CreateUserModalProps {
  open: boolean;
  onClose: () => void;
  onCancel: () => void;
  [key: string]: any;
}

interface CreateUserFormHandle {
  submit: () => void;
}

export function CreateUserModal({ open, onClose, onCancel, ...rest }: CreateUserModalProps) {
  const [error, setError] = useState<string | null>(null);

  const { status: saveStatus, isSaving, runSave, reset } = useSaveStatus({
    onSaved: onClose,
    savedDelay: 500,
  });

  const createUser = useCreateUser();
  const formRef = useRef<CreateUserFormHandle | null>(null);

  const closeAndReset = useCallback(() => {
    onClose();
    setError(null);
    reset();
    try {
      createUser.reset && createUser.reset();
    } catch {}
  }, [onClose, reset, createUser]);

  const handleCreate = useCallback(() => {
    formRef.current?.submit?.();
  }, []);

  const handleSubmit = useCallback(
    async (values: any) => {
      setError(null);
      try {
        await runSave(() => createUser.mutateAsync(values));
      } catch (e: any) {
        setError(e && typeof e === "object" && "message" in e ? (e as any).message : "Failed to create");
      }
    },
    [runSave, createUser]
  );

  return (
    <CreateModal
      open={open}
      onClose={closeAndReset}
      onCancel={closeAndReset}
      onCreate={handleCreate}
      isSaving={isSaving}
      saveState={saveStatus}
      title={<h2 className={styles.modalTitle}>New User</h2>}
    >
      <CreateUserForm
        ref={formRef}
        onSubmit={handleSubmit}
        isSaving={isSaving}
        error={error}
        {...rest}
      />
    </CreateModal>
  );
}

export default CreateUserModal;
