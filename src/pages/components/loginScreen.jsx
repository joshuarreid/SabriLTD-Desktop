/**
 * LoginScreen
 * - Handles paginated user select and password step.
 * - Uses UserGrid (pagination, selection), LoginForm (password), BrandLogo, and style colocation.
 * - Step logic, API/data-handling, and state delegated to useLoginScreen.
 *
 * @module LoginScreen
 */

import React, { useState } from 'react';
import styles from '../styles/LoginScreen.module.css';
import {useLoginScreen} from "../hooks/useLoginScreen.js";
import { UserGrid } from '../../features/auth/components/UserGrid.jsx';
import { LoginForm } from '../../features/auth/components/LoginForm.jsx';

import BrandLogo from '../../assets/logos/Sabri-headerlogo1.png';


/**
 * Standardized logger for debugging and traceability.
 * @constant
 */
const logger = {
    info: (...args) => console.log('[LoginScreen]', ...args),
    error: (...args) => console.error('[LoginScreen]', ...args),
};

/**
 * LoginScreen presentational component.
 * - Handles step logic, loading/error feedback, delegates to modular UI components.
 *
 * @function LoginScreen
 * @returns {JSX.Element}
 */
export const LoginScreen = () => {
    logger.info('LoginScreen mounted');

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

    const [userPage, setUserPage] = useState(0);

    // Pagination logic for user grid
    const USERS_PER_PAGE = 4;
    const totalUsers = publicUsers?.length || 0;
    const pageCount = Math.ceil(totalUsers / USERS_PER_PAGE);

    // Get the user object for the selected userId, if available
    const currentUser = (publicUsers || []).find(
        (u) => String(u.userId) === String(selectedUserId)
    );

    if (redirectElement) return redirectElement;

    return (
        <div className={styles.loginScreen}>
            <div className={styles.loginCard}>
                <img src={BrandLogo} alt="SabriLTD" className={styles.brandLogo} />
                <div className={styles.loginTitle}>
                    {step === 'select' ? 'Select a user' : 'Enter password'}
                </div>
                <div
                    className={`${styles.panelsWrap} ${step === 'select' ? styles.panelsWrapWide : ''}`}
                    aria-live="polite"
                >
                    {/* user select panel */}
                    <section
                        className={`${styles.panel} ${styles.selectPanel} ${
                            step === 'select' ? styles.panelActive : styles.panelInactive
                        }`}
                        aria-hidden={step !== 'select'}
                    >
                        <div className={styles.panelInner}>
                            <UserGrid
                                users={publicUsers || []}
                                selectedUserId={selectedUserId}
                                onSelectUser={selectUser}
                                onContinue={continueToPassword}
                                page={userPage}
                                pageCount={pageCount}
                                setPage={setUserPage}
                            />
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
                {usersError && <div className={styles.errorMsg}>{usersError}</div>}
                {error && <div className={styles.errorMsg}>{error}</div>}
            </div>
        </div>
    );
};

export default LoginScreen;