/**
 * useViewItemModal
 * Manages open/close state, selected preview item, and async loading
 * of full item details for the ViewItemModal.
 *
 * @function useViewItemModal
 * @returns {{
 *   isOpen: boolean;
 *   previewItem: object|null;
 *   selectedItemId: number|null;
 *   openWithItem: (item: object) => void;
 *   close: () => void;
 * }}
 */
import { useState, useCallback } from "react";

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
 * Custom hook for controlling the item view modal.
 *
 * - Stores a lightweight "preview" item from search results.
 * - Stores the selected itemId for fetching full details.
 *
 * @param {object|null} initialItem - Optional initial preview item.
 * @returns {object} Modal state and control handlers.
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
     * @type {[number|null, Function]}
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

    return {
        isOpen,
        previewItem,
        selectedItemId,
        openWithItem,
        close,
    };
};