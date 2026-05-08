import React from "react";
import Modal from "../../../components/modal/components/Modal";
import EditItemForm from "./EditItemForm";
import { useEditItemModal } from "../hooks/useEditItemModal";
import useItemTagField from "../hooks/useItemTagField";

interface EditItemModalProps {
    open: boolean;
    onClose: () => void;
    trigger?: React.ReactNode;
    photos?: { photoId: number; url: string }[];
    // Accept any additional props for EditItemForm
    [key: string]: any;
}

const logger = {
    info: (...args: any[]) => console.log("[EditItemModal]", ...args),
    error: (...args: any[]) => console.error("[EditItemModal]", ...args),
};

const EditItemModal: React.FC<EditItemModalProps> = (props) => {
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

