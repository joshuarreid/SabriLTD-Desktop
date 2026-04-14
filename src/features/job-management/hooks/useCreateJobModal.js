/**
 * useCreateJobModal.js
 *
 * Orchestration hook for Create Job modal:
 * - Owns open/close state
 * - Owns create mutation lifecycle state
 * - Calls Job API createJob
 * - Invalidates job-related caches after success
 *
 * NOTE:
 * - UI components should remain UI-only; this hook is intended to be consumed by other hooks
 *   (e.g., useJobScreen) and/or route-level orchestration.
 */

import { useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createJob } from "../../../api/job/job";
import {jobKeys} from "../../../api/job/jobQueryKeys";


/**
 * Standardized logger for useCreateJobModal.
 *
 * @constant
 * @type {{info: Function, error: Function}}
 */
const logger = {
    info: (...args) => console.log("[useCreateJobModal]", ...args),
    error: (...args) => console.error("[useCreateJobModal]", ...args),
};

/**
 * @typedef {object} CreateJobPayload
 * @property {string} name
 * @property {string|number} companyId
 * @property {string} client
 * @property {string} description
 * @property {string} status
 */

/**
 * useCreateJobModal
 * Manages Create Job modal orchestration + mutation and cache invalidation.
 *
 * @function useCreateJobModal
 * @returns {object}
 * @property {boolean} open - Whether the modal is open.
 * @property {() => void} openModal - Opens the modal and resets mutation UI state.
 * @property {() => void} closeModal - Closes the modal and clears errors/status.
 * @property {"idle"|"saving"|"saved"|"error"} status - UI-friendly status for the modal.
 * @property {boolean} isSaving - True while create mutation is pending.
 * @property {string|null} error - Error message to render in the modal, if any.
 * @property {(payload: CreateJobPayload) => Promise<void>} handleCreateJob - Submits create job mutation.
 */
export const useCreateJobModal = () => {
    /**
     * Query client for cache invalidation.
     *
     * @type {import('@tanstack/react-query').QueryClient}
     */
    const queryClient = useQueryClient();

    /**
     * Tracks whether the modal is open.
     *
     * @type {[boolean, Function]}
     */
    const [open, setOpen] = useState(false);

    /**
     * UI-friendly create mutation status (mirrors other modal patterns).
     *
     * @type {["idle"|"saving"|"saved"|"error", Function]}
     */
    const [status, setStatus] = useState("idle");

    /**
     * Modal error message, if any.
     *
     * @type {[string|null, Function]}
     */
    const [error, setError] = useState(null);

    /**
     * When true, a successful save will close the modal after a short delay.
     *
     * @type {[boolean, Function]}
     */
    const [pendingClose, setPendingClose] = useState(false);

    /**
     * Timeout ref for delayed close.
     *
     * @type {React.MutableRefObject<any>}
     */
    const closeTimeoutRef = useRef();

    /**
     * createJobMutation
     * TanStack mutation for creating jobs.
     */
    const createJobMutation = useMutation({
        mutationKey: jobKeys.create(),
        /**
         * mutationFn
         * Calls API to create a job.
         *
         * @param {CreateJobPayload} payload
         * @returns {Promise<any>}
         * @throws {Error} If API call fails.
         */
        mutationFn: async (payload) => {
            logger.info("createJobMutation mutationFn called", {
                hasName: !!payload?.name,
                hasCompanyId: payload?.companyId !== "" && payload?.companyId !== null,
                hasClient: !!payload?.client,
                hasDescription: !!payload?.description,
                status: payload?.status,
            });

            const normalized = {
                ...payload,
                companyId: Number(payload.companyId),
                name: String(payload.name || "").trim(),
                client: String(payload.client || "").trim(),
                description: String(payload.description || "").trim(),
                status: payload.status || "Active",
            };

            return createJob(normalized);
        },
        /**
         * onSuccess
         * Invalidates any job list/search/client/company caches so the UI updates consistently.
         *
         * @param {any} data
         */
        onSuccess: async (data) => {
            logger.info("createJobMutation onSuccess", { jobId: data?.jobId });

            try {
                await Promise.all([
                    queryClient.invalidateQueries({ queryKey: jobKeys.lists() }),
                    queryClient.invalidateQueries({ queryKey: jobKeys.search() }),
                    queryClient.invalidateQueries({ queryKey: jobKeys.clients() }),
                    queryClient.invalidateQueries({ queryKey: jobKeys.companies() }),
                ]);

                logger.info("Job queries invalidated after create");
            } catch (e) {
                logger.error("Failed invalidating job queries after create", e);
            }
        },
        /**
         * onError
         * Captures mutation errors.
         *
         * @param {any} err
         */
        onError: (err) => {
            logger.error("createJobMutation onError", err);
        },
    });

    /**
     * openModal
     * Opens the modal and resets UI state.
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
     * Closes the modal and clears mutation state.
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
     * Calls the create job mutation and sets modal UI status.
     *
     * @async
     * @function handleCreateJob
     * @param {CreateJobPayload} payload
     * @returns {Promise<void>}
     */
    const handleCreateJob = async (payload) => {
        logger.info("handleCreateJob called");

        setError(null);
        setStatus("saving");
        setPendingClose(true);

        try {
            await createJobMutation.mutateAsync(payload);
            setStatus("saved");
        } catch (err) {
            logger.error("handleCreateJob failed", err);
            setStatus("error");
            setPendingClose(false);

            const message =
                err?.response?.data?.message ||
                err?.message ||
                "Failed to create job.";

            setError(message);
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
        openModal,
        closeModal,
        status,
        isSaving: createJobMutation.status === "pending",
        error,
        handleCreateJob,
    };
};

export default useCreateJobModal;