/**
 * useAddItemsToJobModal.ts
 *
 * Orchestration hook for the "Add Items to Job" modal flow.
 *
 * FIXES (Step 5/6):
 * 1) Ensure we never open the modal with an undefined jobId without surfacing a clear error.
 * 2) Ensure normalization is used consistently (normalizedJobId) for mutation + cache invalidations.
 *
 * @function useAddItemsToJobModal
 * @param {object} params
 * @param {number|string|null} params.jobId - The job to add item to.
 * @returns {object} View model for add-item-to-job modal.
 */

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getItemById, updateItem } from "../../../api/item/item";
import { itemKeys } from "../../../api/item/ItemQueryKeys";
import { jobKeys } from "../api/jobQueryKeys";
import { useCurrentUser } from "../../auth/hooks/useCurrentUser";

// Types
export interface AddItemsToJobModalParams {
    jobId: number | string | null;
}

export interface Item {
    itemId?: number | string;
    id?: number | string;
    name?: string;
    description?: string;
    conditionId?: number | string;
    jobIds?: (number | string)[];
    storageId?: number | string;
    storageDesc?: string;
    photoIds?: (number | string)[];
    tagIds?: (number | string)[];
    comments?: any[];
    updatedBy?: number | string;
    archived?: boolean;
    [key: string]: any;
}

export interface UseAddItemsToJobModalReturn {
    open: boolean;
    openModal: () => void;
    closeModal: () => void;
    selectedItems: Map<number | string, Item>;
    selectedCount: number;
    selectedItemIds: (number | string)[];
    toggleItem: (item: Item) => void;
    isItemSelected: (itemId: number | string) => boolean;
    handleAddItems: () => Promise<void>;
    status: "idle" | "saving" | "saved" | "error";
    isSaving: boolean;
    error: string | null;
}

const logger = {
    info: (...args: any[]) => console.log("[useAddItemsToJobModal]", ...args),
    error: (...args: any[]) => console.error("[useAddItemsToJobModal]", ...args),
};

const resolveCurrentUserId = (user: any): number | null => {
    const candidate = user?.userId ?? user?.id ?? null;
    const asNum = candidate === null || candidate === undefined ? NaN : Number(candidate);
    if (Number.isNaN(asNum)) return null;
    return asNum;
};

const normalizeJobId = (value: number | string | null | undefined): number | null => {
    if (value === null || value === undefined) return null;
    const asNum = Number(value);
    if (Number.isNaN(asNum)) return null;
    return asNum;
};

export const useAddItemsToJobModal = ({ jobId }: AddItemsToJobModalParams): UseAddItemsToJobModalReturn => {
    logger.info("useAddItemsToJobModal initialized", { jobId });

    const queryClient = useQueryClient();
    const { user: currentUser } = useCurrentUser();
    const normalizedJobId = useMemo(() => normalizeJobId(jobId), [jobId]);
    const [open, setOpen] = useState<boolean>(false);
    const [selectedItems, setSelectedItems] = useState<Map<number | string, Item>>(() => new Map());
    const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
    const [error, setError] = useState<string | null>(null);
    const closeTimeoutRef = useRef<any>();

    const openModal = useCallback(() => {
        logger.info("openModal called", { jobId, normalizedJobId });
        setSelectedItems(new Map());
        setStatus("idle");
        if (!normalizedJobId) {
            setError("No job specified. Please refresh and try again.");
        } else {
            setError(null);
        }
        setOpen(true);
    }, [jobId, normalizedJobId]);

    const closeModal = useCallback(() => {
        logger.info("closeModal called");
        setOpen(false);
        setSelectedItems(new Map());
        setStatus("idle");
        setError(null);
    }, []);

    const toggleItem = useCallback((item: Item) => {
        if (!item) return;
        const id = item.itemId ?? item.id;
        if (id == null) {
            logger.error("toggleItem called with item missing id", item);
            return;
        }
        setSelectedItems((prev) => {
            const next = new Map(prev);
            if (next.has(id)) {
                next.delete(id);
                logger.info("Item deselected", { itemId: id });
            } else {
                next.set(id, item);
                logger.info("Item selected", { itemId: id });
            }
            return next;
        });
    }, []);

    const isItemSelected = useCallback((itemId: number | string) => selectedItems.has(itemId), [selectedItems]);
    const selectedCount = selectedItems.size;
    const selectedItemIds = useMemo(() => Array.from(selectedItems.keys()), [selectedItems]);

    const addItemsMutation = useMutation({
        mutationKey: normalizedJobId
            ? [...jobKeys.detail(normalizedJobId), "add-item"]
            : [...jobKeys.all, "add-item", "no-job"],
        mutationFn: async (itemIds: (number | string)[]) => {
            logger.info("addItemsMutation mutationFn called", {
                jobId,
                normalizedJobId,
                itemCount: itemIds.length,
            });
            if (!normalizedJobId) {
                throw new Error("No job specified.");
            }
            const updatedById = resolveCurrentUserId(currentUser);
            const results: any[] = [];
            for (const itemId of itemIds) {
                const fullItem = await getItemById(itemId);
                if (!fullItem) {
                    logger.error("Could not fetch item for update", { itemId });
                    throw new Error(`Failed to fetch item ${itemId}`);
                }
                const existingJobIds = Array.isArray(fullItem.jobIds)
                    ? fullItem.jobIds
                    : [];
                if (existingJobIds.includes(normalizedJobId)) {
                    logger.info("Item already has this jobId, skipping", {
                        itemId,
                        jobId: normalizedJobId,
                    });
                    results.push(fullItem);
                    continue;
                }
                const payload = {
                    name: fullItem.name,
                    description: fullItem.description,
                    conditionId: fullItem.conditionId,
                    jobIds: [...existingJobIds, normalizedJobId],
                    storageId: fullItem.storageId,
                    storageDesc: fullItem.storageDesc,
                    photoIds: fullItem.photoIds || [],
                    tagIds: fullItem.tagIds || [],
                    comments: fullItem.comments || [],
                    updatedBy: updatedById || fullItem.updatedBy,
                    archived: fullItem.archived ?? false,
                };
                logger.info("Updating item to add jobId", {
                    itemId,
                    jobId: normalizedJobId,
                    jobIdsCount: payload.jobIds.length,
                });
                const result = await updateItem(itemId, payload);
                results.push(result);
            }
            return results;
        },
        onSuccess: async (data: any, itemIds: (number | string)[]) => {
            logger.info("addItemsMutation onSuccess", {
                updatedCount: Array.isArray(data) ? data.length : 0,
            });
            try {
                const invalidations = [
                    queryClient.invalidateQueries({ queryKey: itemKeys.search() }),
                    queryClient.invalidateQueries({ queryKey: itemKeys.lists() }),
                ];
                for (const itemId of itemIds) {
                    invalidations.push(
                        queryClient.invalidateQueries({
                            queryKey: itemKeys.detail(itemId),
                        }),
                    );
                    invalidations.push(
                        queryClient.invalidateQueries({
                            queryKey: itemKeys.details(itemId),
                        }),
                    );
                }
                if (normalizedJobId) {
                    invalidations.push(
                        queryClient.invalidateQueries({
                            queryKey: jobKeys.detail(normalizedJobId),
                        }),
                    );
                }
                await Promise.all(invalidations);
                logger.info("Caches invalidated after adding item to job");
            } catch (e) {
                logger.error("Failed invalidating caches after add item", e);
            }
        },
        onError: (err: any) => {
            logger.error("addItemsMutation onError", err);
        },
    });

    const handleAddItems = useCallback(async () => {
        if (selectedCount === 0) {
            logger.info("handleAddItems called with no selections");
            return;
        }
        if (!normalizedJobId) {
            logger.error("handleAddItems called without a jobId", { jobId });
            setError("No job specified. Please refresh and try again.");
            return;
        }
        logger.info("handleAddItems called", {
            jobId,
            normalizedJobId,
            selectedCount,
            selectedItemIds,
        });
        setError(null);
        setStatus("saving");
        try {
            await addItemsMutation.mutateAsync(selectedItemIds);
            setStatus("saved");
        } catch (err: any) {
            logger.error("handleAddItems failed", err);
            setStatus("error");
            const message =
                err?.response?.data?.message ||
                err?.message ||
                "Failed to add item to job.";
            setError(message);
        }
    }, [jobId, normalizedJobId, selectedCount, selectedItemIds, addItemsMutation]);

    useEffect(() => {
        if (status === "saved") {
            closeTimeoutRef.current = setTimeout(() => {
                logger.info("Modal closed after post-save delay");
                closeModal();
            }, 1000);
        }
        return () => {
            if (closeTimeoutRef.current) {
                clearTimeout(closeTimeoutRef.current);
            }
        };
    }, [status, closeModal]);

    return {
        open,
        openModal,
        closeModal,
        selectedItems,
        selectedCount,
        selectedItemIds,
        toggleItem,
        isItemSelected,
        handleAddItems,
        status,
        isSaving: addItemsMutation.status === "pending",
        error,
    };
};

export default useAddItemsToJobModal;

