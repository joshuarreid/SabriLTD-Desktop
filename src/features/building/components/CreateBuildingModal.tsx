import React from "react";
import BuildingModal from "./BuildingModal";
import CreateBuildingForm from "./CreateBuildingForm";

interface CreateBuildingModalProps {
    open: boolean;
    onClose: () => void;
    isSaving: boolean;
    saveState?: 'saving' | 'saved' | 'idle' | 'error';
    onSave: (data: { name: string; address: string; manager: string }) => void;
    onCancel: () => void;
    error?: string | null;
    autoFocus?: boolean;
    initialValues?: {
        name?: string;
        address?: string;
        manager?: string;
    };
    [key: string]: any;
}

const logger = {
    info: (...args: unknown[]) => console.log("[CreateBuildingModal]", ...args),
    error: (...args: unknown[]) => console.error("[CreateBuildingModal]", ...args),
};

const CreateBuildingModal: React.FC<CreateBuildingModalProps> = (props) => {
    logger.info("Rendering CreateBuildingModal with props", props);
    const { open, onClose, trigger = null, ...rest } = props;
    return (
        <BuildingModal
            open={open}
            onClose={() => {
                logger.info("Modal closed");
                onClose();
            }}
            title={<h2>New Building</h2>}
            size="sm"
            {...(trigger !== undefined ? { trigger } : {})}
        >
            <CreateBuildingForm {...rest} />
        </BuildingModal>
    );
};

export default CreateBuildingModal;

