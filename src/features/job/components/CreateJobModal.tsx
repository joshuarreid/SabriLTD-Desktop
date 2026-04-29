import React from "react";

import styles from "../styles/createjobmodal.module.css";
import JobModal from "./JobModal";
import CreateJobForm from "./CreateJobForm";

/**
 * Standardized logger for CreateJobModal.
 */
const logger = {
    info: (...args) => console.log("[CreateJobModal]", ...args),
    error: (...args) => console.error("[CreateJobModal]", ...args),
};

const CreateJobModal = (props) => {
    return (
        <JobModal
            open={props.open}
            onClose={props.onClose}
            title={<h2 className={styles.modalTitle}>New Job</h2>}
            size="sm"
            {...props}
        >
            <CreateJobForm />
        </JobModal>
    );
};

export default CreateJobModal;
