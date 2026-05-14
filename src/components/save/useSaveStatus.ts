import { useCallback, useEffect, useRef, useState } from "react";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

export interface UseSaveStatusOptions {
  onSaved?: () => void;
  savedDelay?: number; // ms to show the "saved" animation before calling onSaved/resetting
}

/**
 * useSaveStatus
 * - Centralizes save state for form modals.
 * - Shows "saved" for a short delay before calling optional onSaved callback and resetting to idle.
 * - Provides a helper `runSave` that wraps an async save function and manages the status lifecycle.
 */
export function useSaveStatus(options: UseSaveStatusOptions = {}) {
  const { onSaved, savedDelay = 500 } = options;

  const [status, setStatus] = useState<SaveStatus>("idle");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startSaving = useCallback(() => {
    clearTimer();
    if (mountedRef.current) setStatus("saving");
  }, [clearTimer]);

  const setSaved = useCallback(() => {
    clearTimer();
    if (!mountedRef.current) return;
    setStatus("saved");
    timerRef.current = setTimeout(() => {
      // only run if still mounted
      if (!mountedRef.current) return;
      // call onSaved first (so parent can close modal) then reset status
      try {
        if (onSaved) onSaved();
      } finally {
        // reset state after calling onSaved
        setStatus("idle");
      }
      timerRef.current = null;
    }, savedDelay);
  }, [onSaved, savedDelay, clearTimer]);

  const setError = useCallback(() => {
    clearTimer();
    if (mountedRef.current) setStatus("error");
  }, [clearTimer]);

  const reset = useCallback(() => {
    clearTimer();
    if (mountedRef.current) setStatus("idle");
  }, [clearTimer]);

  const runSave = useCallback(async <T,>(saveFn: () => Promise<T>): Promise<T> => {
    startSaving();
    try {
      const res = await saveFn();
      setSaved();
      return res;
    } catch (err) {
      setError();
      throw err;
    }
  }, [startSaving, setSaved, setError]);

  const isSaving = status === "saving";
  const isSaved = status === "saved";
  const isError = status === "error";

  return {
    status,
    isSaving,
    isSaved,
    isError,
    startSaving,
    setSaved,
    setError,
    reset,
    runSave,
  } as const;
}

export default useSaveStatus;

