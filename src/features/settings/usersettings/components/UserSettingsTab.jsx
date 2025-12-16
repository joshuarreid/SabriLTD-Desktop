import React, { useState, useEffect, useRef } from "react";
import styles from "../styles/usersettingstab.module.css";
import { useUserSettingsTab } from "../hooks/useUserSettingsTab";
import { useCurrentUser } from "../../../../hooks/useCurrentUser";
import { BsTrash3 } from "react-icons/bs";

import ConfirmationModal from "../../../../components/confirmationmodal/ConfirmationModal";
import EditUserProfileModal from "../../../../components/editusermodal/EditUserProfileModal";

/**
 * logger for UserSettingsTab component.
 * Logs lifecycle events and user interactions for traceability.
 * @type {{info: Function, error: Function}}
 */
const logger = {
    info: (...args) => console.log("[UserSettingsTab]", ...args),
    error: (...args) => console.error("[UserSettingsTab]", ...args),
};

/**
 * UserSettingsTab
 * Renders users as vertically stacked, centered cards in a responsive grid.
 * Clicking a card opens the edit modal.
 * Fetches and manages users automatically via useUserSettingsTab hook.
 *
 * @component
 * @returns {JSX.Element}
 */
const UserSettingsTab = () => {
    logger.info("UserSettingsTab rendered");

    const {
        users,
        isPending,
        isError,
        error,
        handleEditUser,
        handleSaveEdit,
        handleAddUser,
        handleRemoveUser,
        confirmRemoveUser,
        cancelRemoveUser,
        editingId,
        editStatus,
        addingUser,
        addStatus,
        removingId,
        deleteUserMutation,
    } = useUserSettingsTab();

    // Get current user
    const { user: currentUser } = useCurrentUser();

    const [editModalError, setEditModalError] = useState(null);
    const [modalMode, setModalMode] = useState(null); // 'edit' | 'add'
    const [modalUser, setModalUser] = useState(null);
    const [pendingClose, setPendingClose] = useState(false);
    const closeTimeoutRef = useRef();

    // Find the user being confirmed for deletion
    const removingUser = removingId
        ? users.find((u) => u.userId === removingId)
        : null;

    // Local delete status for modal badge, driven by deleteUserMutation.state
    const [deleteStatus, setDeleteStatus] = useState("idle");

    /**
     * Syncs deleteStatus state with the user delete mutation.
     * Delays modal close for success/error so the badge is visible.
     */
    useEffect(() => {
        if (deleteUserMutation?.status === "pending") {
            setDeleteStatus("deleting");
        } else if (deleteUserMutation?.status === "success") {
            setDeleteStatus("deleted");
            const timer = setTimeout(() => {
                setDeleteStatus("idle");
                cancelRemoveUser();
            }, 1000);
            return () => clearTimeout(timer);
        } else if (deleteUserMutation?.status === "error") {
            setDeleteStatus("error");
            const timer = setTimeout(() => setDeleteStatus("idle"), 1400);
            return () => clearTimeout(timer);
        } else {
            setDeleteStatus("idle");
        }
    }, [deleteUserMutation?.status, cancelRemoveUser]);

    /**
     * Opens the edit modal for a user.
     * @param {object} user
     */
    const openEditModal = (user) => {
        setModalUser(user);
        setModalMode("edit");
        setEditModalError(null);
        setPendingClose(false);
    };

    /**
     * Opens the add modal for a new user.
     */
    const openAddModal = () => {
        setModalUser({ name: "", email: "" });
        setModalMode("add");
        setEditModalError(null);
        setPendingClose(false);
    };

    /**
     * Handles a save action from the modal (edit).
     * @param {number} userId
     * @param {{ name: string, email: string }} payload
     */
    const handleModalSave = (userId, payload) => {
        setEditModalError(null);
        setPendingClose(true);
        handleSaveEdit(
            userId,
            payload,
            (error) => {
                if (error) {
                    setEditModalError(error.message || "Failed to update.");
                    setPendingClose(false);
                }
            }
        );
    };

    /**
     * Handles save for add user modal.
     * @param {null} ignoredUserId (for parity; not used)
     * @param {{ name: string, email: string }} payload
     */
    const handleModalAdd = (_ignored, payload) => {
        setEditModalError(null);
        setPendingClose(true);
        handleAddUser(
            payload,
            (error) => {
                if (error) {
                    setEditModalError(error.message || "Failed to create user.");
                    setPendingClose(false);
                }
            }
        );
    };

    /**
     * Handles delete action for a user.
     * @param {number} userId
     */
    const handleDelete = (userId) => {
        handleRemoveUser(userId);
    };

    /**
     * Delayed close effect for modal; shows 'Saved' for ~1s before closing.
     * Distinguishes between add and edit flows.
     */
    useEffect(() => {
        const status = modalMode === "add" ? addStatus : editStatus;
        if (pendingClose && status === "saved") {
            closeTimeoutRef.current = setTimeout(() => {
                setModalUser(null);
                setModalMode(null);
                setPendingClose(false);
                logger.info("Edit/add modal closed after post-save delay");
            }, 1000);
        }
        return () => {
            if (closeTimeoutRef.current) {
                clearTimeout(closeTimeoutRef.current);
            }
        };
    }, [pendingClose, editStatus, addStatus, modalMode]);

    if (isPending) {
        return <div className={styles.loading}>Loading users...</div>;
    }

    if (isError) {
        return (
            <div className={styles.error}>
                Error: {error?.message || "Failed to load users."}
            </div>
        );
    }

    return (
        <div className={styles.profilePanel}>
            <div className={styles.headerSection}>
                <h2 className={styles.sectionTitle}>Manage Users</h2>
                <button className={styles.addUserBtn} onClick={openAddModal}>
                    + Add User
                </button>
            </div>
            <div className={styles.gridContainer}>
                {(users ?? []).map((user) => {
                    return (
                        <div
                            key={user.userId}
                            className={styles.userCard}
                            tabIndex={0}
                            onClick={() => openEditModal(user)}
                            onKeyPress={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault();
                                    openEditModal(user);
                                }
                            }}
                            role="button"
                            aria-label={`Edit user ${user.name}`}
                        >
                            <div className={styles.avatar}>
                                {user.avatar || user.name?.[0]?.toUpperCase() || "?"}
                            </div>
                            <div className={styles.userInfo}>
                                <div className={styles.userName}>{user.name}</div>
                                {user.email && (
                                    <div className={styles.userEmail}>{user.email}</div>
                                )}
                                <div className={styles.userRole}>{user.role || "User"}</div>
                            </div>
                        </div>
                    );
                })}
            </div>
            {/* Edit Modal */}
            {modalMode === "edit" && (
                <EditUserProfileModal
                    user={modalUser}
                    open={!!modalUser}
                    isSaving={editStatus === "saving"}
                    saveState={editStatus}
                    onSave={handleModalSave}
                    onClose={() => {
                        setModalUser(null);
                        setModalMode(null);
                        setEditModalError(null);
                        setPendingClose(false);
                    }}
                    error={editModalError}
                    onDelete={(userId) => handleDelete(userId)}
                />
            )}

            {/* Add Modal */}
            {modalMode === "add" && (
                <EditUserProfileModal
                    user={modalUser}
                    open={!!modalUser}
                    isSaving={addStatus === "saving"}
                    saveState={addStatus}
                    onSave={handleModalAdd}
                    onClose={() => {
                        setModalUser(null);
                        setModalMode(null);
                        setEditModalError(null);
                        setPendingClose(false);
                    }}
                    error={editModalError}
                />
            )}

            {/* Delete Confirmation Modal */}
            <ConfirmationModal
                open={!!removingUser}
                onCancel={cancelRemoveUser}
                onConfirm={() => confirmRemoveUser(removingUser.userId)}
                title="Are you sure?"
                description={
                    removingUser
                        ? `Are you sure you want to delete user '${removingUser.name}'? This action cannot be undone.`
                        : ""
                }
                confirmText="Delete"
                cancelText="Cancel"
                isConfirmLoading={deleteStatus === "deleting"}
                isCancelLoading={false}
                confirmClass={
                    removingUser && currentUser && removingUser.userId === currentUser.userId
                        ? styles.confirmDeleteButtonDisabled
                        : undefined
                }
                confirmDisabled={
                    !!(removingUser && currentUser && removingUser.userId === currentUser.userId)
                }
                deleteStatus={deleteStatus}
            />
        </div>
    );
};

export default UserSettingsTab;