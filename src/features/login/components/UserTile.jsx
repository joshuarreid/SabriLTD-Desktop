/**
 * UserTile
 * - Renders a single selectable user tile for login.
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
import styles from '../styles/UserTile.module.css';

const logger = {
    info: (...args) => console.log('[UserTile]', ...args),
    error: (...args) => console.error('[UserTile]', ...args),
};

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
            <div className={styles.profilePicBlank} aria-hidden>
                <span>👤</span>
            </div>
            <div className={styles.userName}>{user.name}</div>
        </div>
    );
};