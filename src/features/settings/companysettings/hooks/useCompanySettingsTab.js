/**
 * useCompanySettingsTab.js
 *
 * Hook that encapsulates business logic, data fetching and UI state for the CompanySettingsTab.
 * - Loads companies via TanStack Query (getAllCompanies).
 * - Exposes create / update / delete mutations wired to the company API.
 * - Manages modal state (add/edit), delete confirmation, and save/delete status badges.
 *
 * This version intentionally does NOT maintain a persistent "selected" card state to match
 * the same interaction model used by UserSettingsTab (click -> open modal; no long-lived selection).
 *
 * @module useCompanySettingsTab
 */

import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    getAllCompanies,
    createCompany,
    updateCompany,
    deleteCompany,
} from "../../../../api/company/company.js";
import { companyKeys } from "../../../../api/company/companyQueryKeys.js";

/**
 * logger for useCompanySettingsTab hook.
 * @constant
 */
const logger = {
    info: (...args) => console.log("[useCompanySettingsTab]", ...args),
    error: (...args) => console.error("[useCompanySettingsTab]", ...args),
};

/**
 * invalidateAllCompanyKeys
 * Invalidates all relevant company-related query keys after a mutation.
 *
 * @async
 * @param {object} queryClient - React Query client
 * @param {object} company - Partial company object (optional)
 */
const invalidateAllCompanyKeys = async (queryClient, company) => {
    logger.info("Invalidating all relevant company query keys");
    await queryClient.invalidateQueries({ queryKey: companyKeys.all });
    await queryClient.invalidateQueries({ queryKey: companyKeys.lists() });
    await queryClient.invalidateQueries({ queryKey: companyKeys.list() });
    await queryClient.invalidateQueries({ queryKey: companyKeys.withJobs() });
    if (company?.companyId !== undefined && company?.companyId !== null) {
        await queryClient.invalidateQueries({
            queryKey: companyKeys.detail(company.companyId),
        });
        await queryClient.invalidateQueries({
            queryKey: companyKeys.update(company.companyId),
        });
        await queryClient.invalidateQueries({
            queryKey: companyKeys.remove(company.companyId),
        });
    }
};

/**
 * useCompanySettingsTab
 *
 * @returns {object} Hook API consumed by CompanySettingsTab.jsx
 */
export const useCompanySettingsTab = () => {
    logger.info("useCompanySettingsTab initialized");

    const queryClient = useQueryClient();

    // --- Query: companies list ---
    const {
        data: companies = [],
        isPending,
        isError,
        error,
    } = useQuery({
        queryKey: companyKeys.lists(),
        queryFn: () => getAllCompanies(),
    });

    // NOTE: intentionally do NOT keep a persistent selection state here in order to
    // mirror the user tiles behavior (click opens modal, but no sticky 'selected' state).

    // --- Modal / save state ---
    const [editStatus, setEditStatus] = useState("idle"); // 'idle'|'saving'|'saved'|'error'
    const [addStatus, setAddStatus] = useState("idle"); // 'idle'|'saving'|'saved'|'error'
    const [modalMode, setModalMode] = useState(null); // 'edit'|'add'|null
    const [modalCompany, setModalCompany] = useState(null);
    const [modalError, setModalError] = useState(null);
    const [pendingClose, setPendingClose] = useState(false);

    // --- Delete confirmation state ---
    const [removingId, setRemovingId] = useState(null);
    const [deleteStatus, setDeleteStatus] = useState("idle"); // 'idle'|'deleting'|'deleted'|'error'

    // Refs to manage timeouts
    const closeTimeoutRef = useRef(null);
    const deleteTimeoutRef = useRef(null);

    // --- Mutations ---

    /**
     * createCompanyMutation
     * Creates a company and invalidates company keys on success.
     */
    const createCompanyMutation = useMutation({
        mutationFn: (company) => createCompany(company),
        onMutate: () => setAddStatus("saving"),
        onSuccess: async (created) => {
            logger.info("Company created, invalidating keys", created);
            await invalidateAllCompanyKeys(queryClient, created);
            setAddStatus("saved");
            setTimeout(() => setAddStatus("idle"), 1400);
        },
        onError: (err) => {
            logger.error("createCompany failed", err);
            setAddStatus("error");
            setTimeout(() => setAddStatus("idle"), 1600);
        },
    });

    /**
     * updateCompanyMutation
     * Updates a company by id and invalidates keys.
     */
    const updateCompanyMutation = useMutation({
        mutationFn: ({ companyId, company }) => updateCompany(companyId, company),
        onMutate: () => setEditStatus("saving"),
        onSuccess: async (_updated, _vars) => {
            logger.info("Company updated, invalidating keys");
            await invalidateAllCompanyKeys(queryClient, _vars?.company || _vars);
            setEditStatus("saved");
            setTimeout(() => setEditStatus("idle"), 1400);
        },
        onError: (err) => {
            logger.error("updateCompany failed", err);
            setEditStatus("error");
            setTimeout(() => setEditStatus("idle"), 1600);
        },
    });

    /**
     * deleteCompanyMutation
     * Deletes a company by id and invalidates keys.
     */
    const deleteCompanyMutation = useMutation({
        mutationFn: (companyId) => deleteCompany(companyId),
        onMutate: () => {
            logger.info("deleteCompanyMutation onMutate");
            setDeleteStatus("deleting");
        },
        onSuccess: async (_data, companyId) => {
            logger.info("Company deleted, invalidating keys", companyId);
            await invalidateAllCompanyKeys(queryClient, { companyId });
            setDeleteStatus("deleted");
            setTimeout(() => {
                setDeleteStatus("idle");
                setRemovingId(null);
            }, 1000);
        },
        onError: (err) => {
            logger.error("deleteCompany failed", err);
            setDeleteStatus("error");
            setTimeout(() => setDeleteStatus("idle"), 1600);
        },
    });

    // --- Modal & CRUD handlers ---

    /**
     * openEditModal
     * @param {object} company
     */
    const openEditModal = (company) => {
        logger.info("openEditModal", company?.companyId);
        setModalCompany(company);
        setModalMode("edit");
        setModalError(null);
        setPendingClose(false);
    };

    /**
     * openAddModal
     */
    const openAddModal = () => {
        logger.info("openAddModal");
        setModalCompany({ name: "", address: "", phone: "", website: "" });
        setModalMode("add");
        setModalError(null);
        setPendingClose(false);
    };

    /**
     * handleModalSaveEdit
     * @param {number} companyId
     * @param {object} payload
     */
    const handleModalSaveEdit = (companyId, payload) => {
        logger.info("handleModalSaveEdit", { companyId, payload });
        setModalError(null);
        setPendingClose(true);
        updateCompanyMutation.mutate(
            { companyId, company: payload },
            {
                onSuccess: () => {
                    setModalCompany(null);
                    setModalMode(null);
                },
                onError: (err) => {
                    setModalError(err?.message || "Failed to save company.");
                    setPendingClose(false);
                },
            }
        );
    };

    /**
     * handleModalSaveAdd
     * @param {object} payload
     */
    const handleModalSaveAdd = (payload) => {
        logger.info("handleModalSaveAdd", payload);
        setModalError(null);
        setPendingClose(true);
        createCompanyMutation.mutate(payload, {
            onSuccess: () => {
                setModalCompany(null);
                setModalMode(null);
            },
            onError: (err) => {
                setModalError(err?.message || "Failed to create company.");
                setPendingClose(false);
            },
        });
    };

    /**
     * closeModal - resets modal state and transient statuses
     */
    const closeModal = () => {
        logger.info("closeModal");
        setModalCompany(null);
        setModalMode(null);
        setModalError(null);
        setPendingClose(false);
        setEditStatus((s) => (s === "saved" ? "idle" : s));
        setAddStatus((s) => (s === "saved" ? "idle" : s));
    };

    // --- Delete flow handlers ---

    /**
     * handlePromptDelete
     * @param {number} companyId
     */
    const handlePromptDelete = (companyId) => {
        logger.info("handlePromptDelete", companyId);
        setRemovingId(companyId);
        setDeleteStatus("idle");
    };

    /**
     * handleConfirmDelete - confirms current removingId
     */
    const handleConfirmDelete = () => {
        if (!removingId) {
            logger.error("handleConfirmDelete called but removingId is null");
            return;
        }
        logger.info("handleConfirmDelete", removingId);
        deleteCompanyMutation.mutate(removingId);
    };

    /**
     * handleDeleteDirect - delete provided companyId immediately (modal-level confirm)
     * @param {number} companyId
     */
    const handleDeleteDirect = (companyId) => {
        if (!companyId) {
            logger.error("handleDeleteDirect called with invalid companyId", companyId);
            return;
        }
        logger.info("handleDeleteDirect called", companyId);
        deleteCompanyMutation.mutate(companyId);
    };

    /**
     * handleCancelDelete
     */
    const handleCancelDelete = () => {
        logger.info("handleCancelDelete");
        setRemovingId(null);
        setDeleteStatus("idle");
    };

    // --- Effects: modal auto-close and delete reset ---

    useEffect(() => {
        const status = modalMode === "add" ? addStatus : editStatus;
        if (pendingClose && status === "saved") {
            logger.info("Modal save finished; scheduling close");
            closeTimeoutRef.current = setTimeout(() => {
                closeModal();
            }, 800);
        }
        return () => {
            if (closeTimeoutRef.current) {
                clearTimeout(closeTimeoutRef.current);
                closeTimeoutRef.current = null;
            }
        };
    }, [pendingClose, editStatus, addStatus, modalMode]);

    useEffect(() => {
        if (deleteStatus === "deleted") {
            logger.info("Delete completed; scheduling reset");
            deleteTimeoutRef.current = setTimeout(() => {
                setDeleteStatus("idle");
                setRemovingId(null);
            }, 800);
        } else if (deleteStatus === "error") {
            deleteTimeoutRef.current = setTimeout(() => setDeleteStatus("idle"), 1200);
        }

        return () => {
            if (deleteTimeoutRef.current) {
                clearTimeout(deleteTimeoutRef.current);
                deleteTimeoutRef.current = null;
            }
        };
    }, [deleteStatus]);

    // Cleanup timers on unmount
    useEffect(() => {
        return () => {
            if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
            if (deleteTimeoutRef.current) clearTimeout(deleteTimeoutRef.current);
        };
    }, []);

    // --- Public API returned ---
    return {
        companies,
        isPending,
        isError,
        error,
        // modal + save state
        editStatus,
        addStatus,
        modalMode,
        modalCompany,
        modalError,
        pendingClose,
        openEditModal,
        openAddModal,
        handleModalSaveEdit,
        handleModalSaveAdd,
        closeModal,
        // delete flow
        removingId,
        deleteStatus,
        handlePromptDelete,
        handleConfirmDelete,
        handleCancelDelete,
        handleDeleteDirect,
        // expose raw mutations for advanced usage/testing
        createCompanyMutation,
        updateCompanyMutation,
        deleteCompanyMutation,
    };
};

export default useCompanySettingsTab;