/**
 * useCompanySettingsTab.js
 *
 * Hook that encapsulates business logic and UI state for the CompanySettingsTab.
 * - Holds company list (wireframe/mock for now), modal state, delete flow, selection.
 * - Exposes handlers for the presentational component to consume.
 *
 * Follows Bulletproof React conventions: hooks contain side-effects, state, and logic.
 */

import { useState, useEffect, useRef } from "react";

/**
 * logger for useCompanySettingsTab hook.
 * @constant
 * @type {{info: Function, error: Function}}
 */
const logger = {
    info: (...args) => console.log("[useCompanySettingsTab]", ...args),
    error: (...args) => console.error("[useCompanySettingsTab]", ...args),
};

/**
 * useCompanySettingsTab
 *
 * Encapsulates business logic & ephemeral UI state for the companies settings tab.
 *
 * Responsibilities:
 *  - Provide companies list (mocked here for the wireframe).
 *  - Manage modal state for add/edit flows (modalMode/modalCompany/modalError).
 *  - Provide save simulations and save status flags (editStatus/addStatus).
 *  - Manage delete confirmation flow (removingId/deleteStatus).
 *  - Selection state (selectedId) and helpers.
 *
 * @returns {object} Public API for CompanySettingsTab component.
 */
export const useCompanySettingsTab = () => {
    logger.info("useCompanySettingsTab initialized");

    /**
     * Mock list of companies for wireframe/demo usage.
     * Use a lazy initializer to avoid re-creating on every render.
     * @type {Array<Object>}
     */
    const [companies] = useState(() => [
        {
            companyId: 301,
            name: "Acme Corp.",
            address: "123 Industry Road",
            phone: "+1-555-1234",
            website: "https://acme.com",
        },
        {
            companyId: 302,
            name: "Globex Industries",
            address: "456 Commerce Ave",
            phone: "+1-555-9876",
            website: "https://globex.example",
        },
        {
            companyId: 303,
            name: "Initech",
            address: "789 Office Park Blvd",
            phone: "+1-555-0000",
            website: "https://initech.example",
        },
    ]);

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

    // --- Selection state ---
    const [selectedId, setSelectedId] = useState(null);

    // Refs for timeouts so we can clear on unmount
    const closeTimeoutRef = useRef(null);
    const deleteTimeoutRef = useRef(null);

    // --- Simulated async operations (wireframe) ---
    /**
     * simulateEditSave
     * Simulates saving an edited company.
     *
     * @param {number} companyId
     * @param {object} payload
     * @returns {void}
     */
    const simulateEditSave = (companyId, payload) => {
        logger.info("simulateEditSave called", { companyId, payload });
        setEditStatus("saving");
        // Simulate latency
        closeTimeoutRef.current = setTimeout(() => {
            setEditStatus("saved");
            logger.info("simulateEditSave completed (saved)", { companyId });
        }, 600);
    };

    /**
     * simulateAddSave
     * Simulates creating a new company.
     *
     * @param {object} payload
     * @returns {void}
     */
    const simulateAddSave = (payload) => {
        logger.info("simulateAddSave called", payload);
        setAddStatus("saving");
        closeTimeoutRef.current = setTimeout(() => {
            setAddStatus("saved");
            logger.info("simulateAddSave completed (saved)");
        }, 600);
    };

    /**
     * simulateDelete
     * Simulates deleting a company.
     *
     * @param {number} companyId
     * @returns {void}
     */
    const simulateDelete = (companyId) => {
        logger.info("simulateDelete called", companyId);
        setDeleteStatus("deleting");
        deleteTimeoutRef.current = setTimeout(() => {
            setDeleteStatus("deleted");
            logger.info("simulateDelete completed (deleted)", companyId);
        }, 600);
    };

    // --- Modal / flow handlers (exposed) ---
    /**
     * openEditModal
     * Opens the edit modal for a given company.
     *
     * @param {object} company
     * @returns {void}
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
     * Opens the add-company modal.
     *
     * @returns {void}
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
     * Called from the UI to save an edited company.
     *
     * @param {number} companyId
     * @param {object} payload
     * @returns {void}
     */
    const handleModalSaveEdit = (companyId, payload) => {
        logger.info("handleModalSaveEdit", { companyId, payload });
        setModalError(null);
        setPendingClose(true);
        try {
            simulateEditSave(companyId, payload);
        } catch (err) {
            logger.error("handleModalSaveEdit failed", err);
            setModalError(err?.message || "Failed to save.");
            setPendingClose(false);
        }
    };

    /**
     * handleModalSaveAdd
     * Called from the UI to create a new company.
     *
     * @param {object} payload
     * @returns {void}
     */
    const handleModalSaveAdd = (payload) => {
        logger.info("handleModalSaveAdd", payload);
        setModalError(null);
        setPendingClose(true);
        try {
            simulateAddSave(payload);
        } catch (err) {
            logger.error("handleModalSaveAdd failed", err);
            setModalError(err?.message || "Failed to create.");
            setPendingClose(false);
        }
    };

    /**
     * closeModal
     * Closes the add/edit modal and resets modal state.
     *
     * @returns {void}
     */
    const closeModal = () => {
        logger.info("closeModal");
        setModalCompany(null);
        setModalMode(null);
        setModalError(null);
        setPendingClose(false);
        // reset transient statuses (keep persisted statuses for UI badges)
        setEditStatus((s) => (s === "saved" ? "idle" : s));
        setAddStatus((s) => (s === "saved" ? "idle" : s));
    };

    // --- Delete flow handlers (exposed) ---
    /**
     * handlePromptDelete
     * Triggers delete confirmation UX for a company.
     *
     * @param {number} companyId
     * @returns {void}
     */
    const handlePromptDelete = (companyId) => {
        logger.info("handlePromptDelete", companyId);
        setRemovingId(companyId);
        setDeleteStatus("idle");
    };

    /**
     * handleConfirmDelete
     * Confirms and performs delete (simulated).
     *
     * @returns {void}
     */
    const handleConfirmDelete = () => {
        if (!removingId) {
            logger.error("handleConfirmDelete called but removingId is null");
            return;
        }
        logger.info("handleConfirmDelete", removingId);
        try {
            simulateDelete(removingId);
        } catch (err) {
            logger.error("handleConfirmDelete failed", err);
            setDeleteStatus("error");
        }
    };

    /**
     * handleCancelDelete
     * Cancels the delete confirmation.
     *
     * @returns {void}
     */
    const handleCancelDelete = () => {
        logger.info("handleCancelDelete");
        setRemovingId(null);
        setDeleteStatus("idle");
    };

    // --- Effects: watch for saved/deleted statuses and handle transitions ---
    useEffect(() => {
        // When saved, schedule clearing of pendingClose and close modal
        const status = modalMode === "add" ? addStatus : editStatus;
        if (pendingClose && status === "saved") {
            logger.info("Detected saved state; scheduling modal close");
            // reuse closeTimeoutRef (cleared on unmount)
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
        // When deleteStatus becomes 'deleted' or 'error' schedule resetting the confirmation
        if (deleteStatus === "deleted") {
            logger.info("Delete confirmed; scheduling UI reset");
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

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (closeTimeoutRef.current) {
                clearTimeout(closeTimeoutRef.current);
            }
            if (deleteTimeoutRef.current) {
                clearTimeout(deleteTimeoutRef.current);
            }
        };
    }, []);

    // --- Public API returned by the hook ---
    return {
        companies,
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
        // selection
        selectedId,
        setSelectedId,
    };
};

export default useCompanySettingsTab;