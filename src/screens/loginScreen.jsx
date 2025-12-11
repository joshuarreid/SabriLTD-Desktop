import React from 'react';
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
 * LoginScreen (presentational)
 *
 * - Panels are always mounted to allow CSS animations.
 * - Keyboard & mouse interactions are purely presentational: they call handlers
 *   supplied by the hook.
 *
 * @component
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

    if (redirectElement) return redirectElement;

    const currentUser = (publicUsers || []).find(
        (u) => String(u.userId) === String(selectedUserId)
    );

    /**
     * Handle single click on a user tile: select the user and clear errors.
     * @param {string} userId
     */
    const handleTileClick = (userId) => {
        logger.info('tile clicked', { userId });
        selectUser(String(userId));
        resetError && resetError();
    };

    /**
     * Handle double click on a user tile: select then immediately continue.
     * @param {string} userId
     */
    const handleTileDoubleClick = (userId) => {
        logger.info('tile double-clicked', { userId });
        selectUser(String(userId));
        resetError && resetError();
        continueToPassword();
    };

    /**
     * Keyboard handler for tiles.
     * @param {React.KeyboardEvent} e
     * @param {string|number} userId
     */
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

    return (
        <div className={styles.loginScreen}>
            <div className={styles.loginCard}>
                <img src={BrandLogo} alt="SabriLTD" className={styles.brandLogo} />

                <div className={styles.loginTitle}>
                    {step === 'select' ? 'Select a user' : 'Enter password'}
                </div>

                {isLoadingUsers && (
                    <div className={styles.panelsWrap}>
                        <section className={`${styles.panel} ${styles.selectPanel} ${styles.panelActive}`}>
                            <div className={styles.panelInner}>
                                <span style={{ fontSize: '1.2em', color: '#b000b9' }}>
                                    Loading users…
                                </span>
                            </div>
                        </section>
                    </div>
                )}
                {usersError && (
                    <div className={styles.errorMsg}>{usersError}</div>
                )}
                {!isLoadingUsers && !usersError && (
                    <div
                        className={`${styles.panelsWrap} ${step === 'select' ? styles.panelsWrapWide : ''}`}
                        aria-live="polite"
                    >
                        <section
                            className={`${styles.panel} ${styles.selectPanel} ${
                                step === 'select' ? styles.panelActive : styles.panelInactive
                            }`}
                            aria-hidden={step !== 'select'}
                        >
                            <div className={styles.panelInner}>
                                <div className={styles.usersGrid} role="list">
                                    {(publicUsers || []).map((user) => (
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
                                    ))}
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
                        <section
                            className={`${styles.panel} ${styles.passwordPanel} ${
                                step === 'password' ? styles.panelActive : styles.panelInactive
                            }`}
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
                )}

                {error && <div className={styles.errorMsg}>{error}</div>}
            </div>
        </div>
    );
};

export default LoginScreen;