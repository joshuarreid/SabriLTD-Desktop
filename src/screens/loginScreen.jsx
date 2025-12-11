/**
 * LoginScreen
 * - User select grid paginates with minimal chevron arrows (no circle, light grey), always 4 tiles per row/page.
 * - Password form proportionate, responsive, all business logic isolated in useLoginScreen hook.
 * - Follows Bulletproof React conventions.
 *
 * @module LoginScreen
 */

import React, { useState } from 'react';
import styles from '../features/login/styles/LoginScreen.module.css';
import { useLoginScreen } from '../features/login/hooks/useLoginScreen';
import { LoginForm } from '../features/login/components/LoginForm';
import BrandLogo from '../assets/logos/sabriltd-logo.png';

/**
 * Standardized logger for debugging and traceability.
 * Never logs sensitive data.
 * @constant
 */
const logger = {
    info: (...args) => console.log('[LoginScreen]', ...args),
    error: (...args) => console.error('[LoginScreen]', ...args),
};

/**
 * Minimal chevron arrow for user grid paging (no circle, light grey).
 * Vertically centered, side of grid, no text.
 *
 * @function UserGridArrowButton
 * @param {Object} props
 * @param {boolean} props.left - If true, left arrow; else right.
 * @param {function} props.onClick - Pager callback handler.
 * @param {boolean} props.disabled - True disables button.
 * @returns {JSX.Element}
 */
const UserGridArrowButton = ({ left = false, onClick, disabled = false }) => (
    <button
        type="button"
        className={`${styles.userGridArrowButton} ${left ? styles.userGridArrowLeft : styles.userGridArrowRight}`}
        onClick={onClick}
        disabled={disabled}
        aria-label={left ? "Previous users" : "Next users"}
    >
        <svg width="32" height="32" viewBox="0 0 32 32" focusable="false" aria-hidden="true">
            <polyline
                className={styles.chevron}
                points={left ? "20,10 12,16 20,22" : "12,10 20,16 12,22"}
                fill="none"
                stroke="#9c9c9c"
                strokeWidth="3.2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    </button>
);

const USERS_PER_PAGE = 4;

/**
 * LoginScreen presentational component.
 * - Handles paginated user grid (4 per page, arrows).
 * - Shows password panel with proportionate form.
 * - All data, state flow in useLoginScreen.
 *
 * @returns {JSX.Element}
 */
const LoginScreen = () => {
    const {
        isLoadingUsers,
        usersError,
        error,
        publicUsers,
        selectedUserId,
        mutationIsPending,
        redirectElement,
        step,
        selectUser,
        continueToPassword,
        backToSelect,
        handleLoginSubmit,
        resetError,
    } = useLoginScreen();

    logger.info('render', { step, selectedUserId });

    const [userPage, setUserPage] = useState(0);

    // Pagination logic for user grid
    const totalUsers = publicUsers?.length || 0;
    const pageCount = Math.ceil(totalUsers / USERS_PER_PAGE);

    /**
     * Slices users for current page, pads with nulls to keep grid row layout.
     * @type {Array}
     */
    const pageUsers = (publicUsers || []).slice(
        userPage * USERS_PER_PAGE,
        userPage * USERS_PER_PAGE + USERS_PER_PAGE
    );
    const paddedUsers = [...pageUsers];
    while (paddedUsers.length < USERS_PER_PAGE) {
        paddedUsers.push(null);
    }

    const currentUser = (publicUsers || []).find(
        (u) => String(u.userId) === String(selectedUserId)
    );

    /**
     * Tile UI handlers.
     */
    const handleTileClick = (userId) => {
        logger.info('tile clicked', { userId });
        selectUser(String(userId));
        resetError && resetError();
    };
    const handleTileDoubleClick = (userId) => {
        logger.info('tile double-clicked', { userId });
        selectUser(String(userId));
        resetError && resetError();
        continueToPassword();
    };
    const handleTileKeyDown = (e, userId) => {
        const idStr = String(userId);
        if (e.key === 'Enter') {
            e.preventDefault();
            logger.info('tile keydown Enter', { userId, selected: selectedUserId === idStr });
            if (selectedUserId === idStr) {
                continueToPassword();
            } else {
                selectUser(idStr);
                resetError && resetError();
            }
        } else if (e.key === ' ') {
            e.preventDefault();
            logger.info('tile keydown Space (select)', { userId });
            selectUser(idStr);
            resetError && resetError();
        }
    };

    const handlePagePrev = () => setUserPage((p) => Math.max(p - 1, 0));
    const handlePageNext = () => setUserPage((p) => Math.min(p + 1, pageCount - 1));

    if (redirectElement) return redirectElement;

    return (
        <div className={styles.loginScreen}>
            <div className={styles.loginCard}>
                <img src={BrandLogo} alt="SabriLTD" className={styles.brandLogo} />
                <div className={styles.loginTitle}>
                    {step === 'select' ? 'Select a user' : 'Enter password'}
                </div>
                <div className={`${styles.panelsWrap} ${step === 'select' ? styles.panelsWrapWide : ''}`} aria-live="polite">
                    {/* User select panel */}
                    <section
                        className={`${styles.panel} ${styles.selectPanel} ${step === 'select' ? styles.panelActive : styles.panelInactive}`}
                        aria-hidden={step !== 'select'}
                    >
                        <div className={styles.panelInner}>
                            <div className={styles.userGridPagerWrapper}>
                                {/* Left arrow */}
                                {userPage > 0
                                    ? <UserGridArrowButton left onClick={handlePagePrev} />
                                    : <span className={styles.userGridArrowSpacer} />}
                                {/* User grid */}
                                <div className={styles.usersGrid} role="list">
                                    {paddedUsers.map((user, idx) =>
                                        user ? (
                                            <div
                                                key={user.userId}
                                                role="listitem"
                                                className={`${styles.userTile} ${selectedUserId === String(user.userId) ? styles.selected : ''}`}
                                                onClick={() => handleTileClick(String(user.userId))}
                                                onDoubleClick={() => handleTileDoubleClick(String(user.userId))}
                                                onKeyDown={(e) => handleTileKeyDown(e, String(user.userId))}
                                                tabIndex={0}
                                                aria-pressed={selectedUserId === String(user.userId)}
                                                aria-label={`Select user ${user.name}`}
                                            >
                                                <div className={styles.profilePicBlank} aria-hidden>
                                                    <span>👤</span>
                                                </div>
                                                <div className={styles.userName}>{user.name}</div>
                                            </div>
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
                                {/* Right arrow */}
                                {userPage < pageCount - 1
                                    ? <UserGridArrowButton onClick={handlePageNext} />
                                    : <span className={styles.userGridArrowSpacer} />}
                            </div>
                            <div className={styles.actionsRow}>
                                <button
                                    type="button"
                                    onClick={continueToPassword}
                                    disabled={!selectedUserId}
                                    className={styles.continueButton}
                                    aria-disabled={!selectedUserId}
                                >
                                    Continue
                                </button>
                            </div>
                        </div>
                    </section>
                    {/* Password panel */}
                    <section
                        className={`${styles.panel} ${styles.passwordPanel} ${step === 'password' ? styles.panelActive : styles.panelInactive}`}
                        aria-hidden={step !== 'password'}
                    >
                        <div className={styles.panelInner}>
                            <div className={styles.subTitle}>
                                {currentUser ? `Signing in as ${currentUser.name}` : 'Signing in'}
                            </div>
                            <div className={styles.loginFormContainer}>
                                <LoginForm
                                    onSubmit={handleLoginSubmit}
                                    isLoading={mutationIsPending}
                                    error={error}
                                    resetError={resetError}
                                />
                            </div>
                            <div className={styles.actionsRowActions}>
                                <button type="button" onClick={backToSelect} className={styles.backButton}>
                                    ← Back
                                </button>
                            </div>
                        </div>
                    </section>
                </div>
                {/* Loading and error states */}
                {isLoadingUsers && (
                    <div className={styles.panelInner}>
                        <span style={{ fontSize: '1.2em', color: '#b000b9' }}>Loading users…</span>
                    </div>
                )}
                {usersError && (
                    <div className={styles.errorMsg}>{usersError}</div>
                )}
                {error && <div className={styles.errorMsg}>{error}</div>}
            </div>
        </div>
    );
};

export default LoginScreen;