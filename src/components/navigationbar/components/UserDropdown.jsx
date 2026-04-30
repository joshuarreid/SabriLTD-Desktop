/**
 * UserDropdown
 * - Modern minimalist dropdown with avatar/profile icon and menu.
 * - Handles navigation to profile screen and logout.
 *
 * @module UserDropdown
 */

import React, { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './userdropdown.module.css';
import { useAuth } from '../../../features/auth/hooks/useAuth';

/**
 * logger for UserDropdown component.
 * @type {{info: Function, error: Function}}
 */
const logger = {
    info: (...args) => console.log('[UserDropdown]', ...args),
    error: (...args) => console.error('[UserDropdown]', ...args),
};

/**
 * Gets avatar initials from name or email.
 * @function getInitials
 * @param {object} user - user object from /me endpoint.
 * @returns {string} Initials string, or '?' if not available.
 */
const getInitials = (user) => {
    if (!user) return '';
    if (user.name) {
        const parts = user.name.trim().split(' ').filter(Boolean);
        if (parts.length === 1) return parts[0][0].toUpperCase();
        if (parts.length >= 2)
            return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    if (user.email && typeof user.email === 'string') {
        return user.email[0].toUpperCase();
    }
    return '?';
};

/**
 * Renders the avatar icon with user's initials or fallback icon.
 * @function renderAvatar
 * @param {object} user - user object.
 * @returns {JSX.Element} Avatar element.
 */
const renderAvatar = (user) => {
    const initials = getInitials(user);
    if (initials === '?') {
        // Show a generic user SVG icon as fallback
        return (
            <div className={styles.avatar + ' ' + styles.avatarIcon} aria-label="user icon">
                <svg
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    width={20}
                    height={20}
                    aria-hidden="true"
                >
                    <circle cx="12" cy="8" r="4" />
                    <path d="M4 20c0-3.2 2.3-5.5 8-5.5s8 2.3 8 5.5" />
                </svg>
            </div>
        );
    }
    // Initials avatar
    return <span className={styles.avatar}>{initials}</span>;
};

/**
 * UserDropdown component
 *
 * @component
 * @param {object} props
 * @param {object} props.user - The currently authenticated user from /me endpoint.
 * @returns {JSX.Element}
 */
const UserDropdown = ({ user }) => {
    const [open, setOpen] = useState(false);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();
    const { logout } = useAuth();

    /**
     * Handles click events outside the dropdown to close it.
     * @function
     * @param {Event} event - The DOM event.
     */
    const handleClickOutside = (event) => {
        if (
            dropdownRef.current &&
            !dropdownRef.current.contains(event.target)
        ) {
            setOpen(false);
        }
    };

    /**
     * Sets up and cleans up document listener for click outside when dropdown is open.
     */
    useEffect(() => {
        if (!open) return;
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [open]);

    /**
     * Toggles dropdown menu.
     * @function
     */
    const toggleDropdown = () => {
        logger.info('Dropdown toggled', !open);
        setOpen((prev) => !prev);
    };

    /**
     * Handles 'Profile' menu click and closes dropdown after action.
     * Navigates to /profile.
     * @function
     * @param {React.MouseEvent} e
     */
    const handleProfile = (e) => {
        e.preventDefault();
        logger.info('Profile selected');
        setOpen(false);
        navigate('/profile');
    };

    /**
     * Handles 'Logout' menu click and closes dropdown after action.
     * @async
     * @function
     * @param {React.MouseEvent} e
     */
    const handleLogout = async (e) => {
        e.preventDefault();
        logger.info('Logout selected');
        setOpen(false);
        try {
            await logout();
        } catch (err) {
            logger.error('Logout failed', err);
        }
    };

    if (!user) return null;

    return (
        <div className={styles.dropdown} ref={dropdownRef}>
            <button
                className={styles.userButton}
                onClick={toggleDropdown}
                aria-haspopup="true"
                aria-expanded={open}
                tabIndex={0}
                type="button"
            >
                {renderAvatar(user)}
                <span className={styles.userName}>
                    {user.name || user.email || 'Current user'}
                </span>
            </button>
            {open && (
                <div className={styles.dropdownMenu} tabIndex={-1}>
                    <button
                        className={styles.menuButton}
                        onClick={handleProfile}
                        type="button"
                        tabIndex={0}
                    >
                        Profile
                    </button>
                    <button
                        className={styles.menuButton}
                        onClick={handleLogout}
                        type="button"
                        tabIndex={0}
                    >
                        Logout
                    </button>
                </div>
            )}
        </div>
    );
};

export default UserDropdown;