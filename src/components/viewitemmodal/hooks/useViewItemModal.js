/**
 * useViewItemModal
 * Manages open/close state, selected preview item, and full item details
 * for the ViewItemModal. Owns all business logic, data fetching, and field
 * resolution so that ViewItemModal.jsx can remain UI-only.
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
 * Custom hook for controlling the item view modal and loading details.
 *
 * - Stores a lightweight "preview" item from search results.
 * - Tracks the selected itemId for fetching full details.
 * - Fetches item details via React Query using itemKeys.details(itemId)
 *   and getItemDetails(itemId), so the cache is shared across the app.
 *
 * @param {object|null} initialItem - Optional initial preview item.
 * @returns {object} Modal state, details, resolved fields, and handlers.
 */
export const useViewItemModal = (initialItem = null) => {
    /**
     * Whether the view item modal is currently open.
     *
     * @type {[boolean, Function]}
     */
    const [isOpen, setIsOpen] = useState(Boolean(initialItem));

    /**
     * Lightweight preview item from the grid (Meilisearch hit).
     *
     * @type {[object|null, Function]}
     */
    const [previewItem, setPreviewItem] = useState(initialItem);

    /**
     * Selected itemId used to query the details API.
     *
     * @type {[number|string|null, Function]}
     */
    const [selectedItemId, setSelectedItemId] = useState(
        initialItem ? initialItem.itemId ?? initialItem.id ?? null : null,
    );

    /**
     * Opens the modal with a preview item and sets the itemId to fetch details.
     *
     * @function openWithItem
     * @param {object} item - Lightweight item object from ItemCardGrid.
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
     * Closes the modal and clears preview/detailed selection.
     *
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
     * Uses the same queryKey pattern and fetcher as the rest of the project:
     *   - queryKey: itemKeys.details(selectedItemId)
     *   - queryFn:  () => getItemDetails(selectedItemId)
     *
     * Because other parts of the app can also use itemKeys.details(id),
     * this ensures the cache is shared correctly.
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

    // --- Merge preview + details to display (transferred from ViewItemModal.jsx) ---

    /**
     * Resolved ID, prefers details.itemId then preview itemId/id.
     *
     * @type {number|string|null}
     */
    const resolvedId =
        (details && details.itemId) ??
        (previewItem && (previewItem.itemId ?? previewItem.id)) ??
        null;

    /**
     * Resolved name, prefers details.name then preview name.
     *
     * @type {string}
     */
    const resolvedName =
        (details && details.name) || (previewItem && previewItem.name) || "";

    /**
     * Resolved description, prefers details.description then preview description.
     *
     * @type {string}
     */
    const resolvedDescription =
        (details && details.description) ||
        (previewItem && previewItem.description) ||
        "";

    /**
     * Resolved condition display name.
     *
     * @type {string|null}
     */
    const resolvedCondition =
        (details && details.condition && details.condition.name) ||
        (previewItem &&
            (previewItem.conditionName ||
                previewItem.condition ||
                (previewItem.condition && previewItem.condition.name))) ||
        null;

    /**
     * Resolved storage description.
     *
     * @type {string}
     */
    const resolvedStorageDesc =
        (details && details.storageDesc) ||
        (previewItem && previewItem.storageDesc) ||
        "";

    /**
     * Resolved "updatedBy" display (name/email/userId or raw preview value).
     *
     * @type {string|null}
     */
    const resolvedUpdatedBy =
        (details &&
            details.updatedBy &&
            (details.updatedBy.name ||
                details.updatedBy.email ||
                details.updatedBy.userId)) ||
        (previewItem && previewItem.updatedBy) ||
        null;

    /**
     * Resolved dateAdded and dateUpdated.
     *
     * @type {string}
     */
    const resolvedDateAdded =
        (details && details.dateAdded) ||
        (previewItem && previewItem.dateAdded) ||
        "";
    const resolvedDateUpdated =
        (details && details.dateUpdated) ||
        (previewItem && previewItem.dateUpdated) ||
        "";

    /**
     * Resolved tags from details (preferred) or preview.
     *
     * @type {string[]}
     */
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

    /**
     * Resolved jobs, comments, photos, and building.
     *
     * @type {Array}
     */
    const resolvedJobs =
        details && Array.isArray(details.jobs) ? details.jobs : [];
    const resolvedComments =
        details && Array.isArray(details.comments) ? details.comments : [];
    const resolvedPhotos =
        details && Array.isArray(details.photos) ? details.photos : [];
    const resolvedBuilding =
        details && details.buildingWithStorage ? details.buildingWithStorage : null;

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