/**
 * useCreateJobModal.js
 *
 * Orchestration hook for Create Job modal:
 * - Owns open/close state
 * - Owns create mutation lifecycle state
 * - Calls Job API createJob
 * - Adds updatedBy from the current user
 * - Invalidates job-related caches after success
 */

import { useEffect, useRef } from "react";
import { useCurrentUser } from "../../auth/hooks/useCurrentUser";
import useModal from "../../../components/modal/hooks/useModal";
import useCreateJobMutation from "./useCreateJobMutation";

export interface CreateJobPayload {
    name: string;
    companyId: string | number;
    client: string;
    description: string;
    status: string;
    [key: string]: any;
}

export type CreateJobModalStatus = "idle" | "saving" | "saved" | "error";

export interface UseCreateJobModalReturn {
    open: boolean;
    setOpen: (open: boolean) => void;
    status: CreateJobModalStatus;
    setStatus: (status: CreateJobModalStatus) => void;
    error: string | null;
    setError: (err: string | null) => void;
    pendingClose: boolean;
    setPendingClose: (pending: boolean) => void;
    createJobMutation: any;
}

/**
 * Standardized logger for useCreateJobModal.
 *
 * @constant
 * @type {{info: Function, error: Function}}
 */
const logger = {
    info: (...args: any[]) => console.log("[useCreateJobModal]", ...args),
    error: (...args: any[]) => console.error("[useCreateJobModal]", ...args),
};

/**
 * useCreateJobModal
 * Manages Create Job modal orchestration + mutation and cache invalidation.
 *
 * @function useCreateJobModal
 * @returns {object}
 */
export const useCreateJobModal = () => {
    const modal = useModal(false);
    const mutation = useCreateJobMutation();
    const closeTimeoutRef = useRef<any>();

    // Delayed close effect for modal; shows 'Saved' for ~1s before closing.
    useEffect(() => {
        if (mutation.pendingClose && mutation.status === "saved") {
            closeTimeoutRef.current = setTimeout(() => {
                modal.closeModal();
                mutation.setStatus("idle");
                mutation.setPendingClose(false);
            }, 1000);
        }
        return () => {
            if (closeTimeoutRef.current) {
                clearTimeout(closeTimeoutRef.current);
            }
        };
    }, [mutation.pendingClose, mutation.status, modal]);

    // Compose API for consumers
    return {
        open: modal.open,
        setOpen: modal.setOpen,
        openModal: modal.openModal,
        closeModal: () => {
            modal.closeModal();
            mutation.setError(null);
            mutation.setStatus("idle");
            mutation.setPendingClose(false);
            try {
                mutation.createJobMutation.reset();
            } catch {}
        },
        status: mutation.status,
        setStatus: mutation.setStatus,
        error: mutation.error,
        setError: mutation.setError,
        pendingClose: mutation.pendingClose,
        setPendingClose: mutation.setPendingClose,
        createJobMutation: mutation.createJobMutation,
        handleCreateJob: mutation.handleCreateJob,
    };
};

export default useCreateJobModal;
