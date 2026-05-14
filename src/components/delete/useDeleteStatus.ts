import { useCallback, useEffect, useRef, useState } from "react";

export type DeleteStatus = "idle" | "deleting" | "deleted" | "error";

export interface UseDeleteStatusOptions {
  onDeleted?: () => void;
  deletedDelay?: number; // ms to show the "deleted" animation before calling onDeleted/resetting
}

/**
 * useDeleteStatus
 * - Centralizes delete state for confirmation modals.
 * - Shows "deleted" for a short delay before calling optional onDeleted callback and resetting to idle.
 * - Provides a helper `runDelete` that wraps an async delete function and manages the status lifecycle.
 */
export function useDeleteStatus(options: UseDeleteStatusOptions = {}) {
  const { onDeleted, deletedDelay = 500 } = options;

  const [status, setStatus] = useState<DeleteStatus>("idle");
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

  const startDeleting = useCallback(() => {
    clearTimer();
    if (mountedRef.current) setStatus("deleting");
  }, [clearTimer]);

  const setDeleted = useCallback(() => {
    clearTimer();
    if (!mountedRef.current) return;
    setStatus("deleted");
    timerRef.current = setTimeout(() => {
      if (!mountedRef.current) return;
      try {
        if (onDeleted) onDeleted();
      } finally {
        setStatus("idle");
      }
      timerRef.current = null;
    }, deletedDelay);
  }, [onDeleted, deletedDelay, clearTimer]);

  const setError = useCallback(() => {
    clearTimer();
    if (mountedRef.current) setStatus("error");
  }, [clearTimer]);

  const reset = useCallback(() => {
    clearTimer();
    if (mountedRef.current) setStatus("idle");
  }, [clearTimer]);

  const runDelete = useCallback(async <T,>(deleteFn: () => Promise<T>): Promise<T> => {
    startDeleting();
    try {
      const res = await deleteFn();
      setDeleted();
      return res;
    } catch (err) {
      setError();
      throw err;
    }
  }, [startDeleting, setDeleted, setError]);

  const isDeleting = status === "deleting";
  const isDeleted = status === "deleted";
  const isError = status === "error";

  return {
    status,
    isDeleting,
    isDeleted,
    isError,
    startDeleting,
    setDeleted,
    setError,
    reset,
    runDelete,
  } as const;
}

export default useDeleteStatus;

