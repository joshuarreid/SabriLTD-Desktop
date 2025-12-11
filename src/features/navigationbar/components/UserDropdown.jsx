import React, { useState } from 'react';
import styles from '../styles/userdropdown.module.css';

/**
 * UserDropdown
 * - Shows current user and dropdown for user actions.
 *
 * @component
 * @param {object} props
 * @param {object} props.user - The currently authenticated user.
 * @returns {JSX.Element}
 */
const logger = {
    info: (...args) => console.log('[UserDropdown]', ...args),
    error: (...args) => console.error('[UserDropdown]', ...args),
};

const UserDropdown = ({ user }) => {
    const [open, setOpen] = useState(false);

    /**
     * Toggles the dropdown open/closed.
     */
    const toggleDropdown = () => {
        logger.info('Dropdown toggled', !open);
        setOpen((prev) => !prev);
    };

    /**
     * Placeholder for switching users.
     * @param {Event} e
     */
    const handleSwitchUser = (e) => {
        logger.info('Switch user clicked');
        // Implement switch user logic here
    };

    if (!user) return null;

    return (
        <div className={styles.dropdown}>
            <button
                className={styles.userButton}
                onClick={toggleDropdown}
                aria-haspopup="true"
                aria-expanded={open}
            >
                {user.name || user.email || 'Current User'}
            </button>
            {open && (
                <div className={styles.dropdownMenu}>
                    <button onClick={handleSwitchUser}>Switch User</button>
                    {/* Add more menu items here */}
                </div>
            )}
        </div>
    );
};

export default UserDropdown;