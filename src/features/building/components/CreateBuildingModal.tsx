import React, { useRef } from "react";
import CreateModal from "../../../components/modal/components/CreateModal";
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
    const { open, onClose, onSave, onCancel, isSaving, saveState = 'idle', error, autoFocus, initialValues, ...rest } = props;
    const normalizedError = error ?? null;
    const formRef = useRef<any>(null);
    const handleCreate = () => {
        if (formRef.current && typeof formRef.current.submit === 'function') {
            formRef.current.submit();
        }
    };
    return (
        <CreateModal
            open={open}
            onClose={() => {
                logger.info("Modal closed");
                onClose();
            }}
            onCreate={handleCreate}
            onCancel={onCancel}
            isSaving={isSaving}
            saveState={saveState}
            title={<h2>New Building</h2>}
        >
            <CreateBuildingForm
                ref={formRef}
                error={normalizedError}
                autoFocus={autoFocus}
                initialValues={initialValues}
                isSaving={isSaving}
                onSave={onSave}
                onCancel={onCancel}
                {...rest}
            />
        </CreateModal>
    );
};

export default CreateBuildingModal;
