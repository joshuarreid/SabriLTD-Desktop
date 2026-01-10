/**
 * useEditItemModal
 *
 * Handles state and navigation logic for editing/viewing an item with multi-photo support in EditItemModal.
 * Manages the current photo index, modal open/close control, and exposes handlers for navigation.
 *
 * @function
 * @param {object} params
 * @param {Array<{photoId:number, url:string}>} params.photos - The photo objects for the item.
 * @param {boolean} params.open - Modal open state.
 * @param {function} params.onClose - Close handler for modal.
 * @returns {object}
 *   { photo, current, photos, handlePrev, handleNext, handleSelect, handleCancel }
 */

import { useState, useEffect } from "react";

/**
 * logger for useEditItemModal.
 * @constant
 */
const logger = {
    info: (...args) => console.log("[useEditItemModal]", ...args),
    error: (...args) => console.error("[useEditItemModal]", ...args),
};

/**
 * useEditItemModal business logic hook for EditItemModal.
 * @param {object} params - See above.
 * @returns {object}
 */
export const useEditItemModal = ({ photos = [], open, onClose }) => {
    const [current, setCurrent] = useState(0);

    // Reset to first photo when modal opens or when photos change
    useEffect(() => {
        if (open && photos.length > 0) {
            setCurrent(0);
        }
    }, [open, photos.length]);

    /** Handles modal cancel/close and resets */
    const handleCancel = () => {
        logger.info("EditItemModal cancelled");
        if (onClose) onClose();
    };

    /** Go to previous photo */
    const handlePrev = () => {
        setCurrent((prev) => Math.max(prev - 1, 0));
    };

    /** Go to next photo */
    const handleNext = () => {
        setCurrent((prev) => Math.min(prev + 1, photos.length - 1));
    };

    /**
     * Select photo by index (dot click).
     * @param {number} idx
     */
    const handleSelect = (idx) => {
        setCurrent(idx);
    };

    return {
        photo: photos[current],
        current,
        photos,
        handlePrev,
        handleNext,
        handleSelect,
        handleCancel,
        isFirst: current === 0,
        isLast: current === photos.length - 1,
    };
};

export default useEditItemModal;