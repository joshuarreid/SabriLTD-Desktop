import { useState, useCallback } from "react";

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

  const openModal = useCallback((id: string | number) => {
    setJobId(id);
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

  const onAddItems = useCallback(() => {
    setIsSaving(true);
    setStatus("saving");
    // TODO: Implement API call to add items to job
    setTimeout(() => {
      setIsSaving(false);
      setStatus("saved");
    }, 1000);
  }, []);

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

