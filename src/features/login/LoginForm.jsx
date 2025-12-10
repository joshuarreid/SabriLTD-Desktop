/**
 * LoginForm
 * - Stateless controlled form component for login.
 * - Bulletproof React: pure UI only, no side effects.
 *
 * @param {Object} props
 * @param {(values:{userId:number, passcode:string}) => void} props.onSubmit - Submit handler for login.
 * @param {boolean} [props.isLoading] - Loading state for button/UI.
 * @returns {JSX.Element}
 */
import React, { useState } from 'react';

const logger = {
    info: (...args) => console.log('[LoginForm]', ...args),
    error: (...args) => console.error('[LoginForm]', ...args),
};

export const LoginForm = ({ onSubmit, isLoading = false }) => {
    const [userId, setUserId] = useState('');
    const [passcode, setPasscode] = useState('');

    /**
     * Handles form submit, calls parent handler with form values.
     * @param {React.FormEvent} e
     */
    const handleSubmit = (e) => {
        e.preventDefault();
        logger.info('handleSubmit called');
        if (!userId || !passcode) return;
        onSubmit({ userId: Number(userId), passcode });
    };

    return (
        <form onSubmit={handleSubmit} className="login-form">
            <label>
                User ID
                <input
                    type="number"
                    value={userId}
                    onChange={e => setUserId(e.target.value)}
                    disabled={isLoading}
                    autoFocus
                    required
                />
            </label>
            <label>
                Passcode
                <input
                    type="password"
                    value={passcode}
                    onChange={e => setPasscode(e.target.value)}
                    disabled={isLoading}
                    required
                />
            </label>
            <button type="submit" disabled={isLoading || !userId || !passcode}>
                {isLoading ? 'Logging in...' : 'Login'}
            </button>
        </form>
    );
};