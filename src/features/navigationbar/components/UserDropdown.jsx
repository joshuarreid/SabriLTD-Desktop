import React, { useState } from 'react';
import styles from '../styles/userdropdown.module.css';
import { useAuth } from '../../login/hooks/useAuth';

/**
 * UserDropdown
 * - Renders current user name/email and a dropdown menu with Profile and Logout.
 *
 * @component
 * @param {object} props
 * @param {object} props.user - The currently authenticated user from /me endpoint.
 * @returns {JSX.Element}
 */
const logger = {
    info: (...args) => console.log('[UserDropdown]', ...args),
    error: (...args) => console.error('[UserDropdown]', ...args),
};

const UserDropdown = ({ user }) => {
    const [open, setOpen] = useState(false);
    const { logout } = useAuth();

    /**
     * Toggles dropdown menu.
     */
    const toggleDropdown = () => {
        logger.info('Dropdown toggled', !open);
        setOpen((prev) => !prev);
    };

    /**
     * Handles 'Profile' menu click.
     * @param {React.MouseEvent} e
     */
    const handleProfile = (e) => {
        e.preventDefault();
        logger.info('Profile selected');
        // Add navigation to profile page/modal if applicable
    };

    /**
     * Handles 'Logout' menu click.
     * @param {React.MouseEvent} e
     */
    const handleLogout = async (e) => {
        e.preventDefault();
        logger.info('Logout selected');
        try {
            await logout();
        } catch (err) {
            logger.error('Logout failed', err);
        }
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
                    <button onClick={handleProfile}>Profile</button>
                    <button onClick={handleLogout}>Logout</button>
                </div>
            )}
        </div>
    );
};

export default UserDropdown;