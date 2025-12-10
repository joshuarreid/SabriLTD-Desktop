import React, { useState } from 'react';
import styles from './LoginScreen.module.css';

const logger = {
    info: (...args) => console.log('[LoginForm]', ...args),
    error: (...args) => console.error('[LoginForm]', ...args),
};

/**
 * Modern minimalist password-only login form.
 */
export const LoginForm = ({ onSubmit, isLoading = false, error, resetError }) => {
    const [passcode, setPasscode] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        logger.info('handleSubmit called');
        if (!passcode) return;
        onSubmit({ passcode });
    };

    return (
        <form onSubmit={handleSubmit} className={styles.loginForm}>
            <input
                type="password"
                value={passcode}
                onChange={e => {
                    setPasscode(e.target.value);
                    if (resetError) resetError();
                }}
                disabled={isLoading}
                required
                autoFocus
                placeholder="Password"
                className={styles.passwordInput}
            />
            <button type="submit" disabled={isLoading || !passcode}>
                {isLoading ? 'Logging in...' : 'Login'}
            </button>
            {error && <div className={styles.errorMsg}>{error}</div>}
        </form>
    );
};