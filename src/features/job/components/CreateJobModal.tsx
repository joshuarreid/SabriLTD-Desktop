import React from "react";

import styles from "../styles/createjobmodal.module.css";
import JobModal from "./JobModal";
import CreateJobForm from "./CreateJobForm";

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
    const { open, onClose, trigger = null, ...rest } = props;
    return (
        <JobModal
            open={open}
            onClose={() => {
                logger.info("Modal closed");
                onClose();
            }}
            title={<h2 className={styles.modalTitle}>New Job</h2>}
            size="sm"
            trigger={trigger}
        >
            <CreateJobForm
                {...rest}
                error={props.error ?? null}
                autoFocus={props.autoFocus ?? false}
                initialValues={props.initialValues ?? {}}
            />
        </JobModal>
    );
};

export default CreateJobModal;
