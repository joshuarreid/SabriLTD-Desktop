import { useState, useCallback } from "react";
import { useCurrentUser } from "../../auth/hooks/useCurrentUser";
import { useQueryClient } from "@tanstack/react-query";
import { useAddItemsToJob } from "./useJobs";

export type JobAddItemsModalStatus = "idle" | "saving" | "saved" | "error";

export interface UseJobAddItemsModalReturn {
  open: boolean;
  openModal: (jobId: string | number) => void;
  closeModal: () => void;
  jobId: string | number | null;
  selectedItems: any[];
  toggleItem: (item: any) => void;
  isItemSelected: (itemId: string | number) => boolean;
  selectedCount: number;
  onAddItems: () => void;
  onOpenItemDetails: (item: any) => void;
  isSaving: boolean;
  status: JobAddItemsModalStatus;
  error: string | null;
}

export function useJobAddItemsModal(): UseJobAddItemsModalReturn {
  const [open, setOpen] = useState(false);
  const [jobId, setJobId] = useState<string | number | null>(null);
  const [selectedItems, setSelectedItems] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<JobAddItemsModalStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const { user: currentUser } = useCurrentUser();
  const queryClient = useQueryClient();
  const addItemsToJobMutation = useAddItemsToJob();

  const openModal = useCallback((id: string | number) => {
    const normalizedId = typeof id === "string" ? parseInt(id, 10) : id;
    if (normalizedId === null || normalizedId === undefined || Number.isNaN(normalizedId)) {
      setError("No job specified. Please refresh and try again.");
      setStatus("error");
      setOpen(true);
      setJobId(null);
      setSelectedItems([]);
      return;
    }
    setJobId(normalizedId);
    setOpen(true);
    setSelectedItems([]);
    setStatus("idle");
    setError(null);
  }, []);

  const closeModal = useCallback(() => {
    setOpen(false);
    setJobId(null);
    setSelectedItems([]);
    setStatus("idle");
    setError(null);
  }, []);

  const toggleItem = useCallback((item: any) => {
    setSelectedItems((prev) => {
      const exists = prev.find((i) => i.id === item.id);
      if (exists) {
        return prev.filter((i) => i.id !== item.id);
      } else {
        return [...prev, item];
      }
    });
  }, []);

  const isItemSelected = useCallback(
    (itemId: string | number) => selectedItems.some((i) => i.id === itemId),
    [selectedItems]
  );

  const onAddItems = useCallback(async () => {
    if (!jobId || selectedItems.length === 0) return;
    setIsSaving(true);
    setStatus("saving");
    setError(null);
    try {
      const itemIds = selectedItems.map(item => item.id);
      await addItemsToJobMutation.mutateAsync({ jobId, itemIds });
      setStatus("saved");
      setIsSaving(false);
      setTimeout(() => {
        setOpen(false);
        setJobId(null);
        setSelectedItems([]);
        setStatus("idle");
      }, 1000);
    } catch (err: any) {
      // Log the error response for debugging
      console.error("Add items to job error:", err?.response ?? err);
      setError(err && typeof err === "object" && "message" in err ? (err as any).message : "Failed to add items");
      setStatus("error");
      setIsSaving(false);
    }
  }, [jobId, selectedItems, addItemsToJobMutation]);

  const onOpenItemDetails = useCallback((item: any) => {
    // TODO: Implement open item details logic
  }, []);

  return {
    open,
    openModal,
    closeModal,
    jobId,
    selectedItems,
    toggleItem,
    isItemSelected,
    selectedCount: selectedItems.length,
    onAddItems,
    onOpenItemDetails,
    isSaving,
    status,
    error,
  };
}
