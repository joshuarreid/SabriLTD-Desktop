/**
 * EditItemModal.jsx
 *
 * Modal layout for dashboard item editing:
 * - General Information, Photo, and two vertical columns.
 * - Left stacks: General, Associations, Tag/Category.
 * - Right stacks: Photo, Comments.
 * Follows Bulletproof React, logging, and JSDoc standards.
 */

import React from "react";
import Modal from "../../../components/modal/Modal";
import EditItemForm from "./EditItemForm";
import { useEditItemModal } from "../hooks/useEditItemModal";
import useItemTagField from "../hooks/useItemTagField";

/**
 * logger for EditItemModal.
 * @constant
 */
const logger = {
    info: (...args) => console.log("[EditItemModal]", ...args),
    error: (...args) => console.error("[EditItemModal]", ...args),
};

/**
 * EditItemModal
 * Thin wrapper modal for editing an inventory item, following the new pattern.
 *
 * @component
 * @param {Object} props
 * @param {boolean} props.open - Whether the modal is open.
 * @param {Function} props.onClose - Callback for cancel/close.
 * @param {any} [props.trigger] - Optional trigger element.
 * @param {any} [props.item] - The item to edit.
 * @param {any} [props.edit] - Edit handler or state.
 * @param {any} [props.photos] - Photos to preview.
 * @param {any} [props.*] - Any additional props for EditItemForm.
 * @returns {JSX.Element|null}
 */
const EditItemModal = (props) => {
    logger.info("Rendering EditItemModal with props", props);
    const { open, onClose, trigger = null, photos = [], ...rest } = props;
    // Use the original business logic hook
    const modalState = useEditItemModal({ photos, open, onClose });
    // Use the tag field hook with controlled state
    const itemTagFieldState = useItemTagField({
        selectedCategoryId: modalState.selectedCategoryId,
        tagSearch: modalState.tagSearch,
    });
    return (
        <Modal
            open={open}
            onClose={() => {
                logger.info("Modal closed");
                onClose();
            }}
            title={<h2>Edit Item</h2>}
            size="xxl"
            trigger={trigger}
        >
            <EditItemForm
                {...modalState}
                itemTagFieldState={itemTagFieldState}
            />
        </Modal>
    );
};

export default EditItemModal;