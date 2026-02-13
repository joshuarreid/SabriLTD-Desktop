/**
 * useViewItemModal
 * Manages open/close state and the business logic for the item details modal.
 * Handles preview item, fetches and resolves full details (including photos),
 * and returns display fields for the ViewItemModal UI.
 *
 * @function useViewItemModal
 * @param {object|null} [initialItem=null] - Optional initial preview item.
 * @returns {{
 *   isOpen: boolean;
 *   previewItem: object|null;
 *   selectedItemId: number|string|null;
 *   details: object|null;
 *   isDetailsPending: boolean;
 *   isDetailsError: boolean;
 *   detailsError: any;
 *   resolvedId: number|string|null;
 *   resolvedName: string;
 *   resolvedDescription: string;
 *   resolvedCondition: string|null;
 *   resolvedStorageDesc: string;
 *   resolvedUpdatedBy: string|null;
 *   resolvedDateAdded: string;
 *   resolvedDateUpdated: string;
 *   resolvedTags: string[];
 *   resolvedJobs: Array;
 *   resolvedComments: Array;
 *   resolvedPhotos: Array;
 *   resolvedBuilding: object|null;
 *   openWithItem: (item: object) => void;
 *   close: () => void;
 * }}
 */

import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import itemKeys from "../../../api/item/ItemQueryKeys";
import { getItemDetails } from "../../../api/item/item";

/**
 * Logger for useViewItemModal.
 *
 * @constant
 * @type {{info: Function, error: Function}}
 */
const logger = {
    info: (...args) => console.log("[useViewItemModal]", ...args),
    error: (...args) => console.error("[useViewItemModal]", ...args),
};

/**
 * Custom hook for controlling the item view modal and data resolution.
 * Handles all business/data logic, delegates UI rendering to the modal component.
 *
 * @param {object|null} initialItem - Optional initial preview item.
 * @returns {object}
 */
export const useViewItemModal = (initialItem = null) => {
    /**
     * @type {[boolean, Function]}
     * Whether the view item modal is currently open.
     */
    const [isOpen, setIsOpen] = useState(Boolean(initialItem));

    /**
     * @type {[object|null, Function]}
     * The preview item provided as the initial selection (e.g., from grid/search).
     */
    const [previewItem, setPreviewItem] = useState(initialItem);

    /**
     * @type {[number|string|null, Function]}
     * The selected itemId for which to fetch detail data.
     */
    const [selectedItemId, setSelectedItemId] = useState(
        initialItem ? initialItem.itemId ?? initialItem.id ?? null : null,
    );

    /**
     * Opens the modal with a preview item and sets the itemId to fetch details.
     * @function openWithItem
     * @param {object} item - Normalized preview item from the UI grid.
     * @returns {void}
     */
    const openWithItem = useCallback((item) => {
        if (!item) {
            logger.error("openWithItem called without an item");
            return;
        }
        const id = item.itemId ?? item.id;
        if (id == null) {
            logger.error(
                "openWithItem called with item that has no itemId or id",
                item,
            );
        }
        logger.info("Opening ViewItemModal", {
            itemId: id,
            name: item.name,
        });
        setPreviewItem(item);
        setSelectedItemId(id ?? null);
        setIsOpen(true);
    }, []);

    /**
     * Closes the modal and clears selection.
     * @function close
     * @returns {void}
     */
    const close = useCallback(() => {
        logger.info("Closing ViewItemModal");
        setIsOpen(false);
        setPreviewItem(null);
        setSelectedItemId(null);
    }, []);

    /**
     * Item details query.
     * Uses canonical query key for React Query cache alignment.
     */
    const {
        data: details,
        isPending: isDetailsPending,
        isError: isDetailsError,
        error: detailsError,
    } = useQuery({
        queryKey: itemKeys.details(selectedItemId),
        enabled: Boolean(selectedItemId) && isOpen,
        queryFn: async () => {
            logger.info("useViewItemModal fetching item details", {
                itemId: selectedItemId,
            });
            return getItemDetails(selectedItemId);
        },
        staleTime: 10 * 60 * 1000, // 10 minutes
    });

    /**
     * Business logic: resolve fields for the UI.
     * Prefer details (if loaded), otherwise fall back to preview item data.
     */

    /** @type {number|string|null} */
    const resolvedId =
        (details && details.itemId) ??
        (previewItem && (previewItem.itemId ?? previewItem.id)) ??
        null;

    /** @type {string} */
    const resolvedName =
        (details && details.name) || (previewItem && previewItem.name) || "";

    /** @type {string} */
    const resolvedDescription =
        (details && details.description) ||
        (previewItem && previewItem.description) ||
        "";

    /** @type {string|null} */
    const resolvedCondition =
        (details && details.condition && details.condition.name) ||
        (previewItem &&
            (previewItem.conditionName ||
                previewItem.condition ||
                (previewItem.condition && previewItem.condition.name))) ||
        null;

    /** @type {string} */
    const resolvedStorageDesc =
        (details && details.storageDesc) ||
        (previewItem && previewItem.storageDesc) ||
        "";

    /** @type {string|null} */
    const resolvedUpdatedBy =
        (details &&
            details.updatedBy &&
            (details.updatedBy.name ||
                details.updatedBy.email ||
                details.updatedBy.userId)) ||
        (previewItem && previewItem.updatedBy) ||
        null;

    /** @type {string} */
    const resolvedDateAdded =
        (details && details.dateAdded) ||
        (previewItem && previewItem.dateAdded) ||
        "";

    /** @type {string} */
    const resolvedDateUpdated =
        (details && details.dateUpdated) ||
        (previewItem && previewItem.dateUpdated) ||
        "";

    /** @type {string[]} */
    const resolvedTagsFromDetails =
        details && Array.isArray(details.tags)
            ? details.tags
                .map((t) =>
                    typeof t === "string"
                        ? t
                        : t && typeof t === "object"
                            ? t.name
                            : null,
                )
                .filter(Boolean)
            : [];

    const resolvedTagsFromPreview =
        previewItem && Array.isArray(previewItem.tags)
            ? previewItem.tags.map((t) =>
                typeof t === "string"
                    ? t
                    : t && typeof t === "object"
                        ? t.name
                        : null,
            )
            : [];

    const resolvedTags =
        resolvedTagsFromDetails.length > 0
            ? resolvedTagsFromDetails
            : resolvedTagsFromPreview.filter(Boolean);

    /** @type {Array} */
    const resolvedJobs =
        details && Array.isArray(details.jobs) ? details.jobs : [];

    /** @type {Array} */
    const resolvedComments =
        details && Array.isArray(details.comments) ? details.comments : [];

    /** @type {Array} */
    const resolvedPhotos =
        details && Array.isArray(details.photos) ? details.photos : [];

    /** @type {object|null} */
    const resolvedBuilding =
        details && details.buildingWithStorage ? details.buildingWithStorage : null;

    logger.info("Modal state resolved", {
        isOpen,
        previewItem,
        selectedItemId,
        resolvedId,
        resolvedName,
    });

    return {
        isOpen,
        previewItem,
        selectedItemId,
        details: details || null,
        isDetailsPending,
        isDetailsError,
        detailsError,
        resolvedId,
        resolvedName,
        resolvedDescription,
        resolvedCondition,
        resolvedStorageDesc,
        resolvedUpdatedBy,
        resolvedDateAdded,
        resolvedDateUpdated,
        resolvedTags,
        resolvedJobs,
        resolvedComments,
        resolvedPhotos,
        resolvedBuilding,
        openWithItem,
        close,
    };
};

export default useViewItemModal;