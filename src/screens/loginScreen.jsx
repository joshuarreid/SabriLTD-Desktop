/**
 * LoginScreen
 * - Presentational component rendering two stacked panels (select / password).
 * - Adds a wide-panel class for the select step so the tile grid can stay on one row.
 *
 * @module LoginScreen
 */

import React from 'react';
import styles from '../features/login/LoginScreen.module.css';
import { useLoginScreen } from '../features/login/useLoginScreen';
import { LoginForm } from '../features/login/LoginForm';

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
 * Notes:
 * - Panels are always mounted to allow CSS transitions.
 * - We add a `panelsWrapWide` modifier class while on the select step so the
 *   usersGrid has enough horizontal space (prevents wrapping to two rows).
 *
 * @returns {JSX.Element}
 */
const LoginScreen = () => {
    const {
        // data & status
        isLoadingUsers,
        usersError,
        error,
        publicUsers,
        selectedUserId,
        mutationIsPending,
        redirectElement,

        // UI flow from the hook
        step,

        // handlers
        selectUser,
        continueToPassword,
        backToSelect,

        // login
        handleLoginSubmit,
        resetError,
    } = useLoginScreen();

    logger.info('render', { step, selectedUserId });

    if (redirectElement) return redirectElement;

    if (isLoadingUsers) {
        return (
            <div className={styles.loginScreen}>
                <div className={styles.loginTitle}>Login</div>
                <div>Loading users…</div>
            </div>
        );
    }

    if (usersError) {
        return (
            <div className={styles.loginScreen}>
                <div className={styles.loginTitle}>Login</div>
                <div className={styles.errorMsg}>{usersError}</div>
            </div>
        );
    }

    const currentUser = (publicUsers || []).find(
        (u) => String(u.userId) === String(selectedUserId)
    );

    return (
        <div className={styles.loginScreen}>
            <div className={styles.loginTitle}>
                {step === 'select' ? 'Select a user' : 'Enter password'}
            </div>

            {/* panelsWrap receives a wide modifier when on the "select" step so the grid can be wider */}
            <div
                className={`${styles.panelsWrap} ${
                    step === 'select' ? styles.panelsWrapWide : ''
                }`}
                aria-live="polite"
            >
                {/* Select panel */}
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
                                    className={`${styles.userTile} ${
                                        selectedUserId === String(user.userId) ? styles.selected : ''
                                    }`}
                                    onClick={() => {
                                        selectUser(String(user.userId));
                                        resetError && resetError();
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            e.preventDefault();
                                            selectUser(String(user.userId));
                                            resetError && resetError();
                                        }
                                    }}
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

                {/* Password panel */}
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
                            <button
                                type="button"
                                onClick={backToSelect}
                                className={styles.backButton}
                            >
                                ← Back
                            </button>
                        </div>
                    </div>
                </section>
            </div>

            {error && <div className={styles.errorMsg}>{error}</div>}
        </div>
    );
};

export default LoginScreen;