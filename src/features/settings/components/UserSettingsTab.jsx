import React, { useState, useEffect, useRef } from "react";
import styles from "../styles/usersettingstab.module.css";
import { useUserSettingsTab } from "../hooks/useUserSettingsTab";
import { CiEdit } from "react-icons/ci";
import { BsTrash3 } from "react-icons/bs";
import UserEditProfileModal from "../../../components/UserEditProfileModal";

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
 * Renders users as vertically stacked, centered cards in a responsive grid,
 * each with a three-dots menu for edit/delete.
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
        openAddUser,
        editingId,
        editStatus,
        addingUser,
        addStatus,
    } = useUserSettingsTab();

    const [activeMenu, setActiveMenu] = useState(null);
    const [editModalError, setEditModalError] = useState(null);
    const [modalMode, setModalMode] = useState(null); // 'edit' | 'add'
    const [modalUser, setModalUser] = useState(null);
    const [pendingClose, setPendingClose] = useState(false);
    const closeTimeoutRef = useRef();

    /**
     * Toggles the action dropdown menu for a user card.
     * @param {number} userId
     */
    const toggleMenu = (userId) => {
        setActiveMenu(activeMenu === userId ? null : userId);
    };

    /**
     * Opens the edit modal for a user.
     * @param {object} user
     */
    const openEditModal = (user) => {
        setModalUser(user);
        setModalMode("edit");
        setEditModalError(null);
        setPendingClose(false);
        setActiveMenu(null);
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
     * Handles edit action for a user and closes the action menu.
     * (Now replaced with modal open)
     * @param {number} userId
     */
    const handleEdit = (userId) => {
        const toEdit = users.find((u) => u.userId === userId);
        openEditModal(toEdit);
    };

    /**
     * Handles delete action for a user and closes the action menu.
     * @param {number} userId
     */
    const handleDelete = (userId) => {
        handleRemoveUser(userId);
        setActiveMenu(null);
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
                {(users ?? []).map((user) => (
                    <div key={user.userId} className={styles.userCard}>
                        {/* Actions menu in top right */}
                        <div className={styles.cardMenu}>
                            <div className={styles.menuWrapper}>
                                <button
                                    className={styles.menuBtn}
                                    onClick={() => toggleMenu(user.userId)}
                                    aria-label="Open actions"
                                    tabIndex={0}
                                    type="button"
                                >
                                    ⋮
                                </button>
                                {activeMenu === user.userId && (
                                    <div className={styles.dropdownMenu}>
                                        <button
                                            className={styles.dropdownItem}
                                            onClick={() => handleEdit(user.userId)}
                                            type="button"
                                        >
                      <span className={styles.dropdownIcon}>
                        <CiEdit size={18} />
                      </span>
                                            <span>Edit</span>
                                        </button>
                                        <button
                                            className={styles.dropdownItem}
                                            onClick={() => handleDelete(user.userId)}
                                            type="button"
                                        >
                      <span className={styles.dropdownIcon}>
                        <BsTrash3 size={17} />
                      </span>
                                            <span>Delete</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                        {/* Centered avatar, then stacked info */}
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
                ))}
            </div>

            {/* Edit Modal */}
            {modalMode === "edit" && (
                <UserEditProfileModal
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
                />
            )}

            {/* Add Modal */}
            {modalMode === "add" && (
                <UserEditProfileModal
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
        </div>
    );
};

export default UserSettingsTab;