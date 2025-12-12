import React, { useState } from "react";
import styles from "../styles/usersettingstab.module.css";
import { useUserSettingsTab } from "../hooks/useUserSettingsTab";
import { CiEdit } from "react-icons/ci";
import { BsTrash3 } from "react-icons/bs";

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
        handleRemoveUser,
        openAddUser,
    } = useUserSettingsTab();

    const [activeMenu, setActiveMenu] = useState(null);

    /**
     * Toggles the action dropdown menu for a user card.
     * @param {number} userId
     */
    const toggleMenu = (userId) => {
        setActiveMenu(activeMenu === userId ? null : userId);
    };

    /**
     * Handles edit action for a user and closes the action menu.
     * @param {number} userId
     */
    const handleEdit = (userId) => {
        handleEditUser(userId);
        setActiveMenu(null);
    };

    /**
     * Handles delete action for a user and closes the action menu.
     * @param {number} userId
     */
    const handleDelete = (userId) => {
        handleRemoveUser(userId);
        setActiveMenu(null);
    };

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
                <button className={styles.addUserBtn} onClick={openAddUser}>
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
        </div>
    );
};

export default UserSettingsTab;