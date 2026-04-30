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
import {
    useAllCompanies,
    useCreateCompany,
    useUpdateCompany,
    useDeleteCompany,
} from "./useCompanies";
import type { Company } from "../api/company.types";

/**
 * logger for useCompanySettingsTab hook.
 * @constant
 */
const logger = {
    info: (...args: unknown[]) => console.log("[useCompanySettingsTab]", ...args),
    error: (...args: unknown[]) => console.error("[useCompanySettingsTab]", ...args),
};

/**
 * useCompanySettingsTab
 *
 * @returns {object} Hook API consumed by CompanySettingsTab.jsx
 */
export const useCompanySettingsTab = () => {
    logger.info("useCompanySettingsTab initialized");

    // --- Query: companies list ---
    const {
        data: companiesData,
        isPending,
        isError,
        error,
    } = useAllCompanies();
    const companies: Company[] = companiesData?.data || [];

    // --- Modal / save state ---
    const [editStatus, setEditStatus] = useState<'idle'|'saving'|'saved'|'error'>("idle");
    const [addStatus, setAddStatus] = useState<'idle'|'saving'|'saved'|'error'>("idle");
    const [modalMode, setModalMode] = useState<'edit'|'add'|null>(null);
    const [modalCompany, setModalCompany] = useState<Company | null>(null);
    const [modalError, setModalError] = useState<string | null>(null);
    const [pendingClose, setPendingClose] = useState(false);

    // --- Delete confirmation state ---
    const [removingId, setRemovingId] = useState<number | null>(null);
    const [deleteStatus, setDeleteStatus] = useState<'idle'|'deleting'|'deleted'|'error'>("idle");

    // Refs to manage timeouts
    const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const deleteTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // --- Mutations ---
    const createCompanyMutation = useCreateCompany();
    const updateCompanyMutation = useUpdateCompany();
    const deleteCompanyMutation = useDeleteCompany();

    // --- Modal & CRUD handlers ---
    const openEditModal = (company: Company) => {
        logger.info("openEditModal", company?.companyId);
        setModalCompany(company);
        setModalMode("edit");
        setModalError(null);
        setPendingClose(false);
    };

    const openAddModal = () => {
        logger.info("openAddModal");
        setModalCompany({ name: "", address: "", phone: "", website: "" });
        setModalMode("add");
        setModalError(null);
        setPendingClose(false);
    };

    const handleModalSaveEdit = (companyId: number, payload: Company) => {
        logger.info("handleModalSaveEdit", { companyId, payload });
        setModalError(null);
        setPendingClose(true);
        setEditStatus("saving");
        updateCompanyMutation.mutate(
            { companyId, company: payload },
            {
                onSuccess: () => {
                    logger.info("Company updated, invalidating keys");
                    setEditStatus("saved");
                    setTimeout(() => setEditStatus("idle"), 1400);
                    setModalCompany(null);
                    setModalMode(null);
                },
                onError: (err: any) => {
                    logger.error("updateCompany failed", err);
                    setEditStatus("error");
                    setTimeout(() => setEditStatus("idle"), 1600);
                    setModalError(err?.message || "Failed to save company.");
                    setPendingClose(false);
                },
            }
        );
    };

    const handleModalSaveAdd = (payload: Company) => {
        logger.info("handleModalSaveAdd", payload);
        setModalError(null);
        setPendingClose(true);
        setAddStatus("saving");
        createCompanyMutation.mutate(payload, {
            onSuccess: () => {
                logger.info("Company created, invalidating keys");
                setAddStatus("saved");
                setTimeout(() => setAddStatus("idle"), 1400);
                setModalCompany(null);
                setModalMode(null);
            },
            onError: (err: any) => {
                logger.error("createCompany failed", err);
                setAddStatus("error");
                setTimeout(() => setAddStatus("idle"), 1600);
                setModalError(err?.message || "Failed to create company.");
                setPendingClose(false);
            },
        });
    };

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
    const handlePromptDelete = (companyId: number) => {
        logger.info("handlePromptDelete", companyId);
        setRemovingId(companyId);
        setDeleteStatus("idle");
    };

    const handleConfirmDelete = () => {
        if (!removingId) {
            logger.error("handleConfirmDelete called but removingId is null");
            return;
        }
        logger.info("handleConfirmDelete", removingId);
        setDeleteStatus("deleting");
        deleteCompanyMutation.mutate(removingId, {
            onSuccess: () => {
                logger.info("Company deleted, invalidating keys", removingId);
                setDeleteStatus("deleted");
                setTimeout(() => {
                    setDeleteStatus("idle");
                    setRemovingId(null);
                }, 1000);
            },
            onError: () => {
                logger.error("deleteCompany failed");
                setDeleteStatus("error");
                setTimeout(() => setDeleteStatus("idle"), 1600);
            },
        });
    };

    const handleDeleteDirect = (companyId: number) => {
        if (!companyId) {
            logger.error("handleDeleteDirect called with invalid companyId", companyId);
            return;
        }
        logger.info("handleDeleteDirect called", companyId);
        setDeleteStatus("deleting");
        deleteCompanyMutation.mutate(companyId, {
            onSuccess: () => {
                logger.info("Company deleted, invalidating keys", companyId);
                setDeleteStatus("deleted");
                setTimeout(() => {
                    setDeleteStatus("idle");
                    setRemovingId(null);
                }, 1000);
            },
            onError: () => {
                logger.error("deleteCompany failed");
                setDeleteStatus("error");
                setTimeout(() => setDeleteStatus("idle"), 1600);
            },
        });
    };

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

