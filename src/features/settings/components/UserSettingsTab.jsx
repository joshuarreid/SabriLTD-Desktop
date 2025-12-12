import React, { useState } from "react";
import styles from "../styles/usersettingstab.module.css";
import { useUserSettingsTab } from "../hooks/useUserSettingsTab";

/**
 * logger for UserSettingsTab component
 * @type {{info: Function, error: Function}}
 */
const logger = {
    info: (...args) => console.log('[UserSettingsTab]', ...args),
    error: (...args) => console.error('[UserSettingsTab]', ...args),
};

/**
 * UserSettingsTab
 * - Renders users as cards in a responsive grid, each with a menu for edit/delete.
 * - Fetches and manages users automatically.
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

    /** Toggle card menu */
    const toggleMenu = (userId) => {
        setActiveMenu(activeMenu === userId ? null : userId);
    };

    /** Handle add/edit/delete actions */
    const handleEdit = (userId) => {
        handleEditUser(userId);
        setActiveMenu(null);
    };
    const handleDelete = (userId) => {
        handleRemoveUser(userId);
        setActiveMenu(null);
    };

    if (isPending) return <div>Loading users...</div>;
    if (isError) return <div>Error: {error?.message || "Failed to load users."}</div>;

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
                    <div
                        key={user.userId}
                        className={styles.userCard}
                    >
                        <div className={styles.cardHeader}>
                            <div className={styles.avatar}>
                                {user.avatar || user.name?.[0]?.toUpperCase() || "?"}
                            </div>
                            <div className={styles.menuWrapper}>
                                <button
                                    className={styles.menuBtn}
                                    onClick={() => toggleMenu(user.userId)}
                                    aria-label="Open actions"
                                >
                                    ⋮
                                </button>
                                {activeMenu === user.userId && (
                                    <div className={styles.dropdownMenu}>
                                        <button className={styles.dropdownItem} onClick={() => handleEdit(user.userId)}>Edit</button>
                                        <button className={styles.dropdownItem} onClick={() => handleDelete(user.userId)}>Delete</button>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className={styles.userInfo}>
                            <div className={styles.userName}>{user.name}</div>
                            <div className={styles.userRole}>{user.role || user.email || "User"}</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default UserSettingsTab;