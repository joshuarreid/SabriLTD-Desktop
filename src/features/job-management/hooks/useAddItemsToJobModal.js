/**
 * useAddItemsToJobModal.js
 *
 * Orchestration hook for the "Add Items to Job" modal flow.
 *
 * FIXES (Step 5/6):
 * 1) Ensure we never open the modal with an undefined jobId without surfacing a clear error.
 * 2) Ensure normalization is used consistently (normalizedJobId) for mutation + cache invalidations.
 *
 * @function useAddItemsToJobModal
 * @param {object} params
 * @param {number|string|null} params.jobId - The job to add items to.
 * @returns {object} View model for add-items-to-job modal.
 */

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
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
    const asNum =
        candidate === null || candidate === undefined ? NaN : Number(candidate);
    if (Number.isNaN(asNum)) return null;
    return asNum;
};

/**
 * normalizeJobId
 * Safely normalizes a job id into a number.
 *
 * @function normalizeJobId
 * @param {number|string|null|undefined} value
 * @returns {number|null}
 */
const normalizeJobId = (value) => {
    if (value === null || value === undefined) return null;
    const asNum = Number(value);
    if (Number.isNaN(asNum)) return null;
    return asNum;
};

export const useAddItemsToJobModal = ({ jobId }) => {
    logger.info("useAddItemsToJobModal initialized", { jobId });

    const queryClient = useQueryClient();
    const { user: currentUser } = useCurrentUser();

    /**
     * normalizedJobId
     * Used to avoid jobId string/number mismatch.
     *
     * @type {number|null}
     */
    const normalizedJobId = useMemo(() => normalizeJobId(jobId), [jobId]);

    /**
     * Whether the modal is open.
     *
     * @type {[boolean, Function]}
     */
    const [open, setOpen] = useState(false);

    /**
     * Map of selected items keyed by itemId.
     *
     * @type {[Map<number|string, object>, Function]}
     */
    const [selectedItems, setSelectedItems] = useState(() => new Map());

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
     * NOTE: If jobId is not available, we still open the modal (so user doesn't feel "nothing happened"),
     * but we set an error message immediately so it's obvious what's wrong.
     *
     * @function openModal
     * @returns {void}
     */
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
     *
     * @type {number}
     */
    const selectedCount = selectedItems.size;

    /**
     * selectedItemIds
     *
     * @type {Array<number|string>}
     */
    const selectedItemIds = useMemo(
        () => Array.from(selectedItems.keys()),
        [selectedItems],
    );

    /**
     * addItemsMutation
     * Fetches each selected item and appends the jobId to jobIds.
     */
    const addItemsMutation = useMutation({
        mutationKey: normalizedJobId
            ? [...jobKeys.detail(normalizedJobId), "add-items"]
            : [...jobKeys.all, "add-items", "no-job"],
        /**
         * mutationFn
         *
         * @async
         * @param {Array<number|string>} itemIds
         * @returns {Promise<Array<any>>}
         * @throws {Error} If jobId is missing or any update fails.
         */
        mutationFn: async (itemIds) => {
            logger.info("addItemsMutation mutationFn called", {
                jobId,
                normalizedJobId,
                itemCount: itemIds.length,
            });

            if (!normalizedJobId) {
                throw new Error("No job specified.");
            }

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
        /**
         * onSuccess
         *
         * @async
         * @param {Array<any>} data
         * @param {Array<number|string>} itemIds
         * @returns {Promise<void>}
         */
        onSuccess: async (data, itemIds) => {
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
                logger.info("Caches invalidated after adding items to job");
            } catch (e) {
                logger.error("Failed invalidating caches after add items", e);
            }
        },
        /**
         * onError
         *
         * @param {any} err
         * @returns {void}
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
        } catch (err) {
            logger.error("handleAddItems failed", err);
            setStatus("error");
            const message =
                err?.response?.data?.message ||
                err?.message ||
                "Failed to add items to job.";
            setError(message);
        }
    }, [
        jobId,
        normalizedJobId,
        selectedCount,
        selectedItemIds,
        addItemsMutation,
    ]);

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