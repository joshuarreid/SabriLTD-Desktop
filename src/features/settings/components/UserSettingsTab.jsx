import React from "react";
import styles from "../styles/usersettingstab.module.css";
import { useUserSettingsTab } from "../hooks/useUserSettingsTab";

/**
 * logger for UserSettingsTab component.
 * @type {{info: Function, error: Function}}
 */
const logger = {
    info: (...args) => console.log('[UserSettingsTab]', ...args),
    error: (...args) => console.error('[UserSettingsTab]', ...args),
};

/**
 * UserRowEditor
 * Inline editable row for a user (edit name and email).
 *
 * @param {object} props
 * @param {{userId: number, name: string, email: string}} props.user
 * @param {function({name:string,email:string}):void} props.onSave
 * @param {function():void} props.onCancel
 * @returns {JSX.Element}
 */
function UserRowEditor({ user, onSave, onCancel }) {
    const [draft, setDraft] = React.useState({ name: user.name, email: user.email });

    /**
     * updateDraft
     * @param {string} field
     * @param {string} value
     */
    const updateDraft = (field, value) => setDraft((prev) => ({ ...prev, [field]: value }));

    return (
        <>
            <td>
                <input
                    className={styles.input}
                    type="text"
                    value={draft.name}
                    onChange={e => updateDraft("name", e.target.value)}
                />
            </td>
            <td>
                <input
                    className={styles.input}
                    type="email"
                    value={draft.email}
                    onChange={e => updateDraft("email", e.target.value)}
                />
            </td>
            <td className={styles.actionButtonsCell}>
                <button className={styles.saveBtn} onClick={() => onSave(draft)}>Save</button>
                <button className={styles.cancelBtn} onClick={onCancel}>Cancel</button>
            </td>
        </>
    );
}

/**
 * NewUserRow
 * Row for adding a new user.
 *
 * @param {object} props
 * @param {function():void} props.onCancel
 * @param {function({name:string,email:string}):void} props.onAdd
 * @returns {JSX.Element}
 */
function NewUserRow({ onCancel, onAdd }) {
    const [draft, setDraft] = React.useState({ name: "", email: "" });
    const updateDraft = (field, value) => setDraft((prev) => ({ ...prev, [field]: value }));

    return (
        <>
            <td>
                <input
                    className={styles.input}
                    type="text"
                    value={draft.name}
                    placeholder="Full name"
                    onChange={e => updateDraft("name", e.target.value)}
                />
            </td>
            <td>
                <input
                    className={styles.input}
                    type="email"
                    value={draft.email}
                    placeholder="user@email.com"
                    onChange={e => updateDraft("email", e.target.value)}
                />
            </td>
            <td className={styles.actionButtonsCell}>
                <button className={styles.saveBtn} disabled={!draft.name || !draft.email} onClick={() => onAdd(draft)}>
                    Add
                </button>
                <button className={styles.cancelBtn} onClick={onCancel}>Cancel</button>
            </td>
        </>
    );
}

/**
 * UserSettingsTab
 * Table UX for adding, editing, and removing users (edit name/email, delete with confirm, add user).
 * Grey out delete for current user.
 *
 * @component
 * @returns {JSX.Element}
 */
const UserSettingsTab = () => {
    logger.info("UserSettingsTab rendered");

    const {
        users,
        me,
        isPending,
        isError,
        error,
        editingId,
        removingId,
        addingUser,
        openAddUser,
        handleAddUser,
        handleEditUser,
        handleSaveEdit,
        handleRemoveUser,
        confirmRemoveUser,
        cancelRemoveUser,
        cancelEditOrAdd,
    } = useUserSettingsTab();

    if (isPending) {
        return <div className={styles.loadingRow}>Loading users…</div>;
    }
    if (isError) {
        logger.error('User load error', error);
        return <div className={styles.errorRow}>Failed to load users.</div>;
    }

    return (
        <div className={styles.profilePanel}>
            <h2 className={styles.sectionTitle}>Manage Users</h2>
            <p className={styles.sectionSubtitle}>
                Add, edit, or remove application users. Your own account cannot be deleted.
            </p>
            <div className={styles.userTableContainer}>
                <table className={styles.userTable}>
                    <thead>
                    <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th className={styles.actionCol}>Actions</th>
                    </tr>
                    </thead>
                    <tbody>
                    {users.map((u) =>
                        editingId === u.userId ? (
                            <tr key={u.userId}>
                                <UserRowEditor
                                    user={u}
                                    onSave={(payload) => handleSaveEdit(u.userId, payload)}
                                    onCancel={cancelEditOrAdd}
                                />
                            </tr>
                        ) : removingId === u.userId ? (
                            <tr key={u.userId} className={styles.confirmRemoveRow}>
                                <td colSpan={3}>
                                    <div className={styles.confirmBox}>
                      <span>
                        Are you sure you want to remove <b>{u.name}</b> ({u.email})?
                      </span>
                                        <button
                                            className={styles.dangerBtn}
                                            onClick={() => confirmRemoveUser(u.userId)}
                                            disabled={me?.userId === u.userId}
                                        >
                                            Confirm Remove
                                        </button>
                                        <button className={styles.cancelBtn} onClick={cancelRemoveUser}>
                                            Cancel
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            <tr key={u.userId}>
                                <td>{u.name}</td>
                                <td>{u.email}</td>
                                <td className={styles.actionButtonsCell}>
                                    <button
                                        className={styles.editBtn}
                                        onClick={() => handleEditUser(u.userId)}
                                    >
                                        Edit
                                    </button>
                                    <button
                                        className={styles.deleteBtn}
                                        onClick={() => handleRemoveUser(u.userId)}
                                        disabled={me?.userId === u.userId}
                                        title={me?.userId === u.userId ? "Cannot delete own account." : "Remove user"}
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        )
                    )}
                    {addingUser && (
                        <tr>
                            <NewUserRow
                                onCancel={cancelEditOrAdd}
                                onAdd={handleAddUser}
                            />
                        </tr>
                    )}
                    </tbody>
                </table>
            </div>
            <div className={styles.userTableActionsFooter}>
                <button
                    className={styles.addBtn}
                    onClick={openAddUser}
                    disabled={addingUser}
                >
                    + Add User
                </button>
            </div>
        </div>
    );
};

export default UserSettingsTab;