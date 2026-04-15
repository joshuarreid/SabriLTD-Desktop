/**
 * useAddItemsToJobModal.js
 *
 * Orchestration hook for the "Add Items to Job" modal flow.
 * - Owns open/close state for the modal
 * - Tracks selected items (multi-select via single-click in add mode)
 * - Calls updateItem API for each selected item to append the jobId to its jobIds
 * - Invalidates relevant caches after success
 *
 * @function useAddItemsToJobModal
 * @param {object} params
 * @param {number|string|null} params.jobId - The job to add items to.
 * @returns {object} View model for add-items-to-job modal.
 */

import { useState, useCallback, useRef, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getItemById, updateItem } from "../../../api/item/item";
import { itemKeys } from "../../../api/item/ItemQueryKeys";
import { jobKeys } from "../../../api/job/jobQueryKeys";
import { useCurrentUser } from "../../../hooks/useCurrentUser";

/**
 * Logger for useAddItemsToJobModal.
 *
 * @constant
 * @type {{info: Function, error: Function}}
 */
const logger = {
    info: (...args) => console.log("[useAddItemsToJobModal]", ...args),
    error: (...args) => console.error("[useAddItemsToJobModal]", ...args),
};

/**
 * resolveCurrentUserId
 * Resolves a numeric user id from the useCurrentUser payload.
 *
 * @function resolveCurrentUserId
 * @param {any} user
 * @returns {number|null}
 */
const resolveCurrentUserId = (user) => {
    const candidate = user?.userId ?? user?.id ?? null;
    const asNum = candidate === null || candidate === undefined ? NaN : Number(candidate);
    if (Number.isNaN(asNum)) return null;
    return asNum;
};

export const useAddItemsToJobModal = ({ jobId }) => {
    logger.info("useAddItemsToJobModal initialized", { jobId });

    const queryClient = useQueryClient();
    const { user: currentUser } = useCurrentUser();

    /**
     * Whether the modal is open.
     *
     * @type {[boolean, Function]}
     */
    const [open, setOpen] = useState(false);

    /**
     * Map of selected items keyed by itemId.
     * Value is the item preview object for display purposes.
     *
     * @type {[Map<number|string, object>, Function]}
     */
    const [selectedItems, setSelectedItems] = useState(new Map());

    /**
     * UI-friendly status for the add operation.
     *
     * @type {["idle"|"saving"|"saved"|"error", Function]}
     */
    const [status, setStatus] = useState("idle");

    /**
     * Error message from the add operation.
     *
     * @type {[string|null, Function]}
     */
    const [error, setError] = useState(null);

    /**
     * Timeout ref for delayed close after success.
     *
     * @type {React.MutableRefObject<any>}
     */
    const closeTimeoutRef = useRef();

    /**
     * openModal
     * Opens the modal and resets selection + status.
     *
     * @function openModal
     * @returns {void}
     */
    const openModal = useCallback(() => {
        logger.info("openModal called");
        setSelectedItems(new Map());
        setStatus("idle");
        setError(null);
        setOpen(true);
    }, []);

    /**
     * closeModal
     * Closes the modal and clears all state.
     *
     * @function closeModal
     * @returns {void}
     */
    const closeModal = useCallback(() => {
        logger.info("closeModal called");
        setOpen(false);
        setSelectedItems(new Map());
        setStatus("idle");
        setError(null);
    }, []);

    /**
     * toggleItem
     * Toggles an item in/out of the selection set.
     *
     * @function toggleItem
     * @param {object} item - Item preview object. Must have itemId or id.
     * @returns {void}
     */
    const toggleItem = useCallback((item) => {
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

    /**
     * isItemSelected
     * Checks whether an item is currently selected.
     *
     * @function isItemSelected
     * @param {number|string} itemId
     * @returns {boolean}
     */
    const isItemSelected = useCallback(
        (itemId) => selectedItems.has(itemId),
        [selectedItems],
    );

    /**
     * selectedCount
     * Number of currently selected items.
     *
     * @type {number}
     */
    const selectedCount = selectedItems.size;

    /**
     * selectedItemIds
     * Array of selected item IDs.
     *
     * @type {Array<number|string>}
     */
    const selectedItemIds = Array.from(selectedItems.keys());

    /**
     * addItemsMutation
     * Mutation that fetches each selected item's full data,
     * appends the jobId to its jobIds array, and calls updateItem.
     */
    const addItemsMutation = useMutation({
        mutationKey: [...jobKeys.detail(jobId), "add-items"],
        /**
         * mutationFn
         * Processes all selected items and updates each to include this jobId.
         *
         * @param {Array<number|string>} itemIds
         * @returns {Promise<Array<any>>}
         */
        mutationFn: async (itemIds) => {
            logger.info("addItemsMutation mutationFn called", {
                jobId,
                itemCount: itemIds.length,
            });

            const updatedById = resolveCurrentUserId(currentUser);

            const results = [];

            for (const itemId of itemIds) {
                const fullItem = await getItemById(itemId);

                if (!fullItem) {
                    logger.error("Could not fetch item for update", { itemId });
                    throw new Error(`Failed to fetch item ${itemId}`);
                }

                const existingJobIds = Array.isArray(fullItem.jobIds)
                    ? fullItem.jobIds
                    : [];

                const numericJobId = Number(jobId);

                if (existingJobIds.includes(numericJobId)) {
                    logger.info("Item already has this jobId, skipping", {
                        itemId,
                        jobId: numericJobId,
                    });
                    results.push(fullItem);
                    continue;
                }

                const payload = {
                    name: fullItem.name,
                    description: fullItem.description,
                    conditionId: fullItem.conditionId,
                    jobIds: [...existingJobIds, numericJobId],
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
                    jobId: numericJobId,
                    jobIdsCount: payload.jobIds.length,
                });

                const result = await updateItem(itemId, payload);
                results.push(result);
            }

            return results;
        },
        /**
         * onSuccess
         * Invalidates item and job caches so the UI reflects changes.
         *
         * @param {Array<any>} data
         * @param {Array<number|string>} itemIds
         */
        onSuccess: async (data, itemIds) => {
            logger.info("addItemsMutation onSuccess", {
                updatedCount: data.length,
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

                if (jobId) {
                    invalidations.push(
                        queryClient.invalidateQueries({
                            queryKey: jobKeys.detail(jobId),
                        }),
                    );
                }

                await Promise.all(invalidations);
                logger.info("Caches invalidated after adding items to job");
            } catch (e) {
                logger.error("Failed invalidating caches after add items", e);
            }
        },
        /**
         * onError
         *
         * @param {any} err
         */
        onError: (err) => {
            logger.error("addItemsMutation onError", err);
        },
    });

    /**
     * handleAddItems
     * Triggers the mutation for all currently selected items.
     *
     * @async
     * @function handleAddItems
     * @returns {Promise<void>}
     */
    const handleAddItems = useCallback(async () => {
        if (selectedCount === 0) {
            logger.info("handleAddItems called with no selections");
            return;
        }

        if (!jobId) {
            logger.error("handleAddItems called without a jobId");
            setError("No job specified.");
            return;
        }

        logger.info("handleAddItems called", {
            jobId,
            selectedCount,
            selectedItemIds,
        });

        setError(null);
        setStatus("saving");

        try {
            await addItemsMutation.mutateAsync(selectedItemIds);
            setStatus("saved");
        } catch (err) {
            logger.error("handleAddItems failed", err);
            setStatus("error");
            const message =
                err?.response?.data?.message ||
                err?.message ||
                "Failed to add items to job.";
            setError(message);
        }
    }, [jobId, selectedCount, selectedItemIds, addItemsMutation]);

    /**
     * Delayed close effect: shows 'Saved' for ~1s before closing.
     *
     * @effect
     */
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