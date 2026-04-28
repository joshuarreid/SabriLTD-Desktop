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
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createJob } from "../../../api/job/job.ts";
import { jobKeys } from "../../../api/job/jobQueryKeys.ts";
import {useCurrentUser} from "../../auth/hooks/useCurrentUser.js";


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
 */
export const useCreateJobModal = () => {
    /**
     * Query client for cache invalidation.
     *
     * @type {import('@tanstack/react-query').QueryClient}
     */
    const queryClient = useQueryClient();

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
    const [open, setOpen] = useState(false);

    /**
     * UI-friendly create mutation status.
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
         * Calls API to create a job. Adds updatedBy from current user.
         *
         * @async
         * @function mutationFn
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
                hasUpdatedBy: !!currentUserId,
            });

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

            return createJob(normalized);
        },

        /**
         * onSuccess
         * Invalidates job list/search/client/company caches so the UI updates consistently.
         *
         * @async
         * @function onSuccess
         * @param {any} data
         * @returns {Promise<void>}
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
         *
         * @function onError
         * @param {any} err
         * @returns {void}
         */
        onError: (err) => {
            logger.error("createJobMutation onError", err);
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