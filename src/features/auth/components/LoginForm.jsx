/**
 * LoginForm
 * - Minimalist password form.
 * - Uses responsive sizing defined by LoginScreen.module.css variables.
 *
 * @module LoginForm
 */

import React, { useState } from 'react';
import styles from '../../../pages/styles/LoginScreen.module.css';

/**
 * Standardized logger for debugging and traceability.
 * Never logs sensitive data.
 * @constant
 */
const logger = {
    info: (...args) => console.log('[LoginForm]', ...args),
    error: (...args) => console.error('[LoginForm]', ...args),
};

/**
 * Modern minimalist password-only auth form.
 *
 * @param {Object} props
 * @param {(values:{passcode:string}) => void} props.onSubmit - Called when the form is submitted.
 * @param {boolean} [props.isLoading=false] - Disables inputs when true.
 * @param {string|null} [props.error] - Error message to show.
 * @param {() => void} [props.resetError] - Called to clear external error state on user input.
 * @returns {JSX.Element}
 */
export const LoginForm = ({ onSubmit, isLoading = false, error, resetError }) => {
    const [passcode, setPasscode] = useState('');

    /**
     * Form submit handler.
     * @param {Event} e
     */
    const handleSubmit = (e) => {
        e.preventDefault();
        logger.info('handleSubmit called');
        if (!passcode) return;
        // Do not log passcode
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
                aria-label="Password"
            />
            <button type="submit" disabled={isLoading || !passcode} className={styles.submitButton}>
                {isLoading ? 'Logging in...' : 'Login'}
            </button>
            {error && <div className={styles.errorMsg}>{error}</div>}
        </form>
    );
};