/**
 * LoginScreen
 * - Modern Apple-like login screen.
 * - User tiles for selection, clean UX.
 */

import React from 'react';
import styles from '../features/login/LoginScreen.module.css';
import { useLoginScreen } from '../features/login/useLoginScreen';
import { LoginForm } from '../features/login/LoginForm';

const LoginScreen = () => {
    const {
        isLoadingUsers,
        usersError,
        error,
        selectedUserId,
        publicUsers,
        setSelectedUserId,
        handleLoginSubmit,
        mutationIsPending,
        resetError,
        redirectElement
    } = useLoginScreen();

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

    // Handler for tile click
    const handleTileClick = (userId) => {
        setSelectedUserId(userId);
        resetError && resetError();
    };

    return (
        <div className={styles.loginScreen}>
            <div className={styles.loginTitle}>Select a user</div>
            <div className={styles.usersGrid}>
                {(publicUsers || []).map(user => (
                    <div
                        key={user.userId}
                        className={`${styles.userTile} ${selectedUserId === String(user.userId) ? styles.selected : ''}`}
                        onClick={() => handleTileClick(String(user.userId))}
                        tabIndex={0}
                        role="button"
                        aria-pressed={selectedUserId === String(user.userId)}
                        aria-label={`Select user ${user.name}`}
                        style={{ outline: 'none' }}
                    >
                        <div className={styles.profilePicBlank}>
                            {/* Placeholder: can insert avatar SVG/icon here in future */}
                            <span>👤</span>
                        </div>
                        <div className={styles.userName}>{user.name}</div>
                    </div>
                ))}
            </div>
            {selectedUserId &&
                <div className={styles.loginFormContainer}>
                    <LoginForm
                        onSubmit={handleLoginSubmit}
                        isLoading={mutationIsPending}
                        error={error}
                        resetError={resetError}
                        className={styles.loginForm}
                    />
                </div>
            }
            {error && <div className={styles.errorMsg}>{error}</div>}
        </div>
    );
};

export default LoginScreen;