import React, { useRef } from "react";

import CreateModal from "../../../components/modal/components/CreateModal";
import CreateJobForm from "./CreateJobForm";
import styles from "../styles/createjobmodal.module.css";

interface CreateJobModalProps {
    open: boolean;
    onClose: () => void;
    isSaving: boolean;
    saveState: any;
    onSave: (data: any) => void;
    onCancel: () => void;
    error?: any;
    companyOptions: any[];
    statusOptions: any[];
    autoFocus?: boolean;
    initialValues?: any;
    [key: string]: any;
}

/**
 * Standardized logger for CreateJobModal.
 */
const logger = {
    info: (...args: any[]) => console.log("[CreateJobModal]", ...args),
    error: (...args: any[]) => console.error("[CreateJobModal]", ...args),
};

const CreateJobModal: React.FC<CreateJobModalProps> = (props) => {
    logger.info("Rendering CreateJobModal with props", props);
    const {
        open,
        onClose,
        onSave,
        onCancel,
        isSaving,
        saveState = "idle",
        error,
        autoFocus,
        initialValues,
        ...rest
    } = props;
    const normalizedError = error ?? null;
    const formRef = useRef<any>(null);
    const handleCreate = () => {
        if (formRef.current && typeof formRef.current.submit === "function") {
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
            title={<h2 className={styles.modalTitle}>New Job</h2>}
        >
            <CreateJobForm
                ref={formRef}
                error={normalizedError}
                autoFocus={!!autoFocus}
                initialValues={initialValues}
                isSaving={isSaving}
                saveState={saveState}
                onSave={onSave}
                onCancel={onCancel}
                {...rest}
            />
        </CreateModal>
    );
};

export default CreateJobModal;
