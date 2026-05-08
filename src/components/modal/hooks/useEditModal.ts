import { useState, useCallback } from "react";

export function useEditModal() {
  const [open, setOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveState, setSaveState] = useState(null);

  const openModal = useCallback(() => setOpen(true), []);
  const closeModal = useCallback(() => setOpen(false), []);

  const startSaving = useCallback(() => setIsSaving(true), []);
  const stopSaving = useCallback(() => setIsSaving(false), []);
  const setSaveStatus = useCallback((state: any) => setSaveState(state), []);

  return {
    open,
    openModal,
    closeModal,
    isSaving,
    startSaving,
    stopSaving,
    saveState,
    setSaveStatus,
  };
}

