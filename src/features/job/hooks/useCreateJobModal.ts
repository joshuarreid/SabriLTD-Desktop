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

import { useEffect, useMemo, useRef, useState } from "react";
import { useCurrentUser } from "../../auth/hooks/useCurrentUser";
import { useCreateJob } from "./useJobs";

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
export const useCreateJobModal = (): UseCreateJobModalReturn => {
    /**
     * Current user context for updatedBy stamping.
     *
     * @type {{user: object|null}}
     */
    const { user: currentUser } = useCurrentUser();

    /**
     * currentUserId
     * Derived id used for create payload stamping.
     *
     * @type {number|string|null}
     */
    const currentUserId = useMemo(() => {
        const id = currentUser?.userId ?? currentUser?.id ?? null;
        return id;
    }, [currentUser]);

    /**
     * Tracks whether the modal is open.
     *
     * @type {[boolean, Function]}
     */
    const [open, setOpen] = useState<boolean>(false);

    /**
     * UI-friendly create mutation status.
     *
     * @type {["idle"|"saving"|"saved"|"error", Function]}
     */
    const [status, setStatus] = useState<CreateJobModalStatus>("idle");

    /**
     * Modal error message, if any.
     *
     * @type {[string|null, Function]}
     */
    const [error, setError] = useState<string | null>(null);

    /**
     * When true, a successful save will close the modal after a short delay.
     *
     * @type {[boolean, Function]}
     */
    const [pendingClose, setPendingClose] = useState<boolean>(false);

    /**
     * Timeout ref for delayed close.
     *
     * @type {React.MutableRefObject<any>}
     */
    const closeTimeoutRef = useRef<any>();

    // Use the new useCreateJob hook
    const createJobMutation = useCreateJob({
        onSuccess: (data: any) => {
            logger.info("createJobMutation onSuccess", { jobId: data?.jobId });
            setStatus("saved");
            setPendingClose(true);
        },
        onError: (err: any) => {
            logger.error("createJobMutation onError", err);
            setStatus("error");
            setError(err?.message || "Failed to create job");
        },
    });

    /**
     * openModal
     *
     * @function openModal
     * @returns {void}
     */
    const openModal = () => {
        logger.info("openModal called");
        setError(null);
        setStatus("idle");
        setPendingClose(false);
        setOpen(true);
    };

    /**
     * closeModal
     *
     * @function closeModal
     * @returns {void}
     */
    const closeModal = () => {
        logger.info("closeModal called");
        setOpen(false);
        setError(null);
        setStatus("idle");
        setPendingClose(false);

        try {
            createJobMutation.reset();
        } catch (e) {
            logger.error("createJobMutation.reset failed", e);
        }
    };

    /**
     * handleCreateJob
     *
     * @async
     * @function handleCreateJob
     * @param {CreateJobPayload} payload
     * @returns {Promise<void>}
     */
    const handleCreateJob = async (payload: CreateJobPayload) => {
        logger.info("handleCreateJob called");

        setError(null);
        setStatus("saving");
        setPendingClose(true);

        try {
            const normalized = {
                ...payload,
                companyId: Number(payload.companyId),
                name: String(payload.name || "").trim(),
                client: String(payload.client || "").trim(),
                description: String(payload.description || "").trim(),
                status: payload.status || "Active",

                // IMPORTANT: stamp updatedBy for API
                updatedBy: currentUserId,
            };
            await createJobMutation.mutateAsync(normalized);
        } catch (err) {
            // onError will handle error state
        }
    };

    /**
     * Delayed close effect for modal; shows 'Saved' for ~1s before closing.
     *
     * @effect
     */
    useEffect(() => {
        if (pendingClose && status === "saved") {
            closeTimeoutRef.current = setTimeout(() => {
                logger.info("Modal closed after post-save delay");
                setOpen(false);
                setStatus("idle");
                setPendingClose(false);
            }, 1000);
        }

        return () => {
            if (closeTimeoutRef.current) {
                clearTimeout(closeTimeoutRef.current);
            }
        };
    }, [pendingClose, status]);

    return {
        open,
        setOpen,
        status,
        setStatus,
        error,
        setError,
        pendingClose,
        setPendingClose,
        createJobMutation,
        openModal,
        closeModal,
        handleCreateJob,
    };
};

export default useCreateJobModal;
