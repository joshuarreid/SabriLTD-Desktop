import React from 'react';
import styles from '../styles/navigationbar.module.css';
import Logo from './Logo';
import UserDropdown from './UserDropdown';
import { useCurrentUser } from '../hooks/useCurrentUser';

/**
 * NavigationBar
 * - Top app bar displaying logo and current user dropdown.
 *
 * @component
 * @returns {JSX.Element}
 */
const logger = {
    info: (...args) => console.log('[NavigationBar]', ...args),
    error: (...args) => console.error('[NavigationBar]', ...args),
};

/**
 * NavigationBar component for SabriLTD Inventory.
 * - Logs output of useCurrentUser for debugging visibility issues.
 * - Renders Logo, and UserDropdown if user is found.
 *
 * @returns {JSX.Element}
 */
const NavigationBar = () => {
    logger.info('NavigationBar rendered');
    const { user, loading } = useCurrentUser();

    logger.info('NavigationBar: useCurrentUser output', { user, loading });

    return (
        <nav className={styles.navbar} role="navigation">
            <div className={styles.logoContainer}>
                <Logo />
            </div>
            <div className={styles.user}>
                {!loading && user ? <UserDropdown user={user} /> : (
                    <span style={{ color: 'red' }}>
                        {loading ? 'Loading user...' : 'NO USER FOUND'}
                    </span>
                )}
            </div>
        </nav>
    );
};

export default NavigationBar;