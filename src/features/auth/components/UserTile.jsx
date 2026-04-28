/**
 * UserTile
 * - Renders a single selectable user tile for auth with a modern minimalist avatar.
 * - Handles click, double click, keyDown for selection and continuation.
 *
 * @module UserTile
 * @param {object} props
 * @param {object} props.user - The user object { userId, name }.
 * @param {string} props.selectedUserId - Currently selected userId.
 * @param {function} props.onClick - Called on click (selects user).
 * @param {function} props.onDoubleClick - Called on double click (select+continue).
 * @param {function} props.onKeyDown - Called on keyDown (keyboard a11y).
 * @returns {JSX.Element}
 */
import React from 'react';
import styles from './UserTile.module.css';

/**
 * logger for UserTile component
 */
const logger = {
    info: (...args) => console.log('[UserTile]', ...args),
    error: (...args) => console.error('[UserTile]', ...args),
};

/**
 * Derives avatar initials from a user's name.
 * @param {object} user - User object containing name.
 * @returns {string} Initials string or '?' if not available.
 */
const getInitials = (user) => {
    if (user && user.name) {
        const parts = user.name.trim().split(' ').filter(Boolean);
        if (parts.length === 1) return parts[0][0].toUpperCase();
        if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return '?';
};

/**
 * Renders a round avatar: initials or fallback user SVG icon.
 * @param {object} props
 * @param {object} props.user - User object for initials.
 * @returns {JSX.Element}
 */
const Avatar = ({ user }) => {
    const initials = getInitials(user);
    if (initials === '?') {
        // Fallback: minimal user icon SVG
        return (
            <div className={`${styles.avatar} ${styles.avatarIcon}`} aria-label="user icon">
                <svg
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    width={22}
                    height={22}
                    aria-hidden="true"
                >
                    <circle cx="12" cy="8" r="4"/>
                    <path d="M4 20c0-3.2 2.3-5.5 8-5.5s8 2.3 8 5.5"/>
                </svg>
            </div>
        );
    }
    return (
        <span className={styles.avatar}>{initials}</span>
    );
};

/**
 * UserTile component.
 *
 * @function
 * @param {object} props - All props.
 * @returns {JSX.Element}
 */
export const UserTile = ({
                             user,
                             selectedUserId,
                             onClick,
                             onDoubleClick,
                             onKeyDown,
                         }) => {
    const isSelected = String(user.userId) === String(selectedUserId);
    logger.info('render', { userId: user.userId, isSelected });

    return (
        <div
            role="listitem"
            className={`${styles.userTile} ${isSelected ? styles.selected : ''}`}
            onClick={() => onClick(user.userId)}
            onDoubleClick={() => onDoubleClick(user.userId)}
            onKeyDown={e => onKeyDown(e, user.userId)}
            tabIndex={0}
            aria-pressed={isSelected}
            aria-label={`Select user ${user.name}`}
        >
            <Avatar user={user} />
            <div className={styles.userName}>{user.name}</div>
        </div>
    );
};