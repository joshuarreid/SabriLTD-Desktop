import React, { useCallback, useMemo, useRef, useState } from "react";

import CreateModal from "../../../components/modal/components/CreateModal";
import CreateJobForm from "./CreateJobForm";
import styles from "../styles/createjobmodal.module.css";
import { useCreateJob } from "../hooks/useJobs";
import useSaveStatus from "../../../components/save/useSaveStatus";
import { useCurrentUser } from "../../user/hooks/useCurrentUser";

type CreateJobValues = {
    name: string;
    companyId: string | number;
    client: string;
    description: string;
    status: string;
};

interface CreateJobModalProps {
    open: boolean;
    onClose: () => void;
    onCancel: () => void;
    statusOptions: any[];
    autoFocus?: boolean;
    initialValues?: Partial<CreateJobValues>;
    // allow pass-through props (companyOptions, etc.) without typing everything here
    [key: string]: any;
}

const CreateJobModal: React.FC<CreateJobModalProps> = (props) => {
    const {
        open,
        onClose,
        onCancel,
        statusOptions,
        autoFocus,
        initialValues,
        ...rest
    } = props;

    const { user: currentUser } = useCurrentUser();
    const currentUserId = useMemo(
        () => currentUser?.userId ?? currentUser?.id ?? null,
        [currentUser],
    );

    const [error, setError] = useState<string | null>(null);

    const { status: saveStatus, isSaving, runSave, reset: resetSaveStatus } = useSaveStatus({
        onSaved: onClose,
        savedDelay: 500,
    });

    const createJob = useCreateJob();

    const formRef = useRef<any>(null);

    const closeAndReset = useCallback(() => {
        onClose();
        setError(null);
        resetSaveStatus();
        try {
            createJob.reset();
        } catch {
            // ignore
        }
    }, [onClose, resetSaveStatus, createJob]);

    const handleCreate = useCallback(() => {
        if (formRef.current && typeof formRef.current.submit === "function") {
            formRef.current.submit();
        }
    }, []);

    const handleSubmit = useCallback(
        async (values: CreateJobValues) => {
            setError(null);

            // Ensure companyId is a number and present
            const normalized = {
                ...values,
                companyId: Number(values.companyId), // backend expects companyId
                name: String(values.name || "").trim(),
                client: String(values.client || "").trim(),
                description: String(values.description || "").trim(),
                status: values.status || "Active",
                updatedBy: currentUserId,
            };

            try {
                await runSave(() => createJob.mutateAsync(normalized as any));
            } catch (err: any) {
                setError(err?.message || "Failed to create job");
            }
        },
        [createJob, runSave, currentUserId],
    );

    return (
        <CreateModal
            open={open}
            onClose={closeAndReset}
            onCreate={handleCreate}
            onCancel={closeAndReset}
            isSaving={isSaving}
            saveState={saveStatus}
            title={<h2 className={styles.modalTitle}>New Job</h2>}
        >
            <CreateJobForm
                ref={formRef}
                error={error}
                autoFocus={!!autoFocus}
                initialValues={initialValues as any}
                onSubmit={handleSubmit}
                statusOptions={statusOptions}
                isSaving={isSaving}
                {...rest}
            />
        </CreateModal>
    );
};

export default CreateJobModal;
