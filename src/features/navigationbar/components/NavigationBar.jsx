import React from 'react';
import styles from '../styles/navigationbar.module.css';
import Logo from './Logo';
import UserDropdown from './UserDropdown';
import { useCurrentUser } from '../hooks/useCurrentUser';

/**
 * NavigationBar
 * - Top app bar showing logo (left) and UserDropdown with current user (right).
 *   Uses /me endpoint via useCurrentUser hook for user info.
 *
 * @component
 * @returns {JSX.Element}
 */
const logger = {
    info: (...args) => console.log('[NavigationBar]', ...args),
    error: (...args) => console.error('[NavigationBar]', ...args),
};

const NavigationBar = () => {
    logger.info('NavigationBar rendered');
    const { user, loading, error } = useCurrentUser();

    logger.info('NavigationBar: useCurrentUser output', { user, loading, error });

    return (
        <nav className={styles.navbar} role="navigation">
            <div className={styles.logoContainer}>
                <Logo />
            </div>
            <div className={styles.user}>
                {loading ? (
                    <span style={{ color: 'gray' }}>Loading user...</span>
                ) : error ? (
                    <span style={{ color: 'red' }}>User error</span>
                ) : user ? (
                    <UserDropdown user={user} />
                ) : (
                    <span style={{ color: 'red' }}>NO USER FOUND</span>
                )}
            </div>
        </nav>
    );
};

export default NavigationBar;