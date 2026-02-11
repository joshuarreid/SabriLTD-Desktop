/**
 * useViewItemModal
 * Manages open/close state and selected item for the View Item modal.
 *
 * @function useViewItemModal
 * @returns {{
 *   isOpen: boolean;
 *   selectedItem: object|null;
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
 * @param {object|null} initialItem - Optional item to preselect when the hook initializes.
 * @returns {object} Modal state and control handlers.
 */
export const useViewItemModal = (initialItem = null) => {
    /**
     * Currently selected item for the modal.
     *
     * @type {[object|null, Function]}
     */
    const [selectedItem, setSelectedItem] = useState(initialItem);

    /**
     * Whether the modal is open.
     *
     * @type {[boolean, Function]}
     */
    const [isOpen, setIsOpen] = useState(Boolean(initialItem));

    /**
     * Opens the modal with the provided item.
     *
     * @function openWithItem
     * @param {object} item - Full item object to display in the modal.
     * @returns {void}
     */
    const openWithItem = useCallback((item) => {
        if (!item) {
            logger.error("openWithItem called without an item");
            return;
        }
        logger.info("Opening ViewItemModal", {
            itemId: item.itemId || item.id,
            name: item.name,
        });
        setSelectedItem(item);
        setIsOpen(true);
    }, []);

    /**
     * Closes the modal and clears the selected item.
     *
     * @function close
     * @returns {void}
     */
    const close = useCallback(() => {
        logger.info("Closing ViewItemModal");
        setIsOpen(false);
        setSelectedItem(null);
    }, []);

    return {
        isOpen,
        selectedItem,
        openWithItem,
        close,
    };
};