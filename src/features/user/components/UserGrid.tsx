/**
 * UserGrid
 * - Paginated, accessible grid for user auth selection.
 * - Handles paging, tile rendering, a11y, and selection state.
 *
 * @module UserGrid
 * @param {object} props
 * @param {Array} props.users - List of user objects ({ userId, name }).
 * @param {string} props.selectedUserId - The currently selected userId.
 * @param {function} props.onSelectUser - Handler for selecting a user.
 * @param {function} props.onContinue - Handler to continue (on double click or Enter).
 * @param {number} props.page - Current page index (0-based).
 * @param {number} props.pageCount - Total pages.
 * @param {function} props.setPage - Set the current page (pager).
 * @returns {JSX.Element}
 */
import React from 'react';
import styles from '../styles/UserGrid.module.css';
import { UserTile } from './UserTile';
import { UserGridArrowButton } from './UserGridArrowButton';

const logger = {
    info: (...args: unknown[]) => console.log('[UserGrid]', ...args),
    error: (...args: unknown[]) => console.error('[UserGrid]', ...args),
};

const USERS_PER_PAGE = 4;

export interface UserGridUser {
    userId: string | number;
    name: string;
    [key: string]: any;
}

export interface UserGridProps {
    users: UserGridUser[];
    selectedUserId: string;
    onSelectUser: (userId: string) => void;
    onContinue: () => void;
    page: number;
    pageCount: number;
    setPage: (page: number) => void;
}

export const UserGrid: React.FC<UserGridProps> = ({
    users,
    selectedUserId,
    onSelectUser,
    onContinue,
    page,
    pageCount,
    setPage,
}) => {
    const handleTileClick = (userId: string | number) => {
        logger.info('tile clicked', { userId });
        onSelectUser(String(userId));
    };

    const handleTileDoubleClick = (userId: string | number) => {
        logger.info('tile double-clicked', { userId });
        onSelectUser(String(userId));
        onContinue();
    };

    const handleTileKeyDown = (e: React.KeyboardEvent, userId: string | number) => {
        const idStr = String(userId);
        if (e.key === 'Enter') {
            e.preventDefault();
            logger.info('tile keydown Enter', { userId, selected: selectedUserId === idStr });
            if (selectedUserId === idStr) {
                onContinue();
            } else {
                onSelectUser(idStr);
            }
        } else if (e.key === ' ') {
            e.preventDefault();
            logger.info('tile keydown Space (select)', { userId });
            onSelectUser(idStr);
        }
    };

    // Compute users on the current page, with padding (always 4 tiles)
    const pageUsers = users.slice(page * USERS_PER_PAGE, page * USERS_PER_PAGE + USERS_PER_PAGE);
    const paddedUsers: (UserGridUser | null)[] = [...pageUsers];
    while (paddedUsers.length < USERS_PER_PAGE) paddedUsers.push(null);

    return (
        <div className={styles.userGridPagerWrapper}>
            {page > 0
                ? <UserGridArrowButton left onClick={() => setPage(page - 1)} />
                : <span className={styles.userGridArrowSpacer} />}
            <div className={styles.usersGrid} role="list">
                {paddedUsers.map((user, idx) =>
                    user ? (
                        <UserTile
                            key={user.userId}
                            user={user}
                            selectedUserId={selectedUserId}
                            onClick={handleTileClick}
                            onDoubleClick={handleTileDoubleClick}
                            onKeyDown={handleTileKeyDown}
                        />
                    ) : (
                        <div
                            key={`empty-${idx}`}
                            className={styles.userTile}
                            aria-hidden="true"
                            tabIndex={-1}
                            style={{ visibility: 'hidden' }}
                        />
                    )
                )}
            </div>
            {page < pageCount - 1
                ? <UserGridArrowButton onClick={() => setPage(page + 1)} />
                : <span className={styles.userGridArrowSpacer} />}
        </div>
    );
};