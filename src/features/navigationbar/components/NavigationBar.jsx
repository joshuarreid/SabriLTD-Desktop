import React from 'react';
import {FiSettings } from 'react-icons/fi';
import { IoIosSearch } from "react-icons/io";
import { IoFolderOpenOutline } from "react-icons/io5";
import styles from '../styles/navigationbar.module.css';
import Logo from './Logo';
import UserDropdown from './UserDropdown';
import { useCurrentUser } from '../hooks/useCurrentUser';

/**
 * logger for NavigationBar component.
 * @type {{info: Function, error: Function}}
 */
const logger = {
    info: (...args) => console.log('[NavigationBar]', ...args),
    error: (...args) => console.error('[NavigationBar]', ...args),
};

/**
 * NavIconButton
 * - Icon button for nav bar actions, accessible and styled.
 *
 * @param {object} props
 * @param {JSX.Element} props.icon
 * @param {string} props.label - Accessible label for the icon
 * @param {function} [props.onClick]
 * @returns {JSX.Element}
 */
const NavIconButton = ({ icon, label, onClick }) => (
    <button
        className={styles.iconButton}
        aria-label={label}
        title={label}
        type="button"
        tabIndex={0}
        onClick={onClick}
    >
        {icon}
    </button>
);

/**
 * NavigationBarIcons
 * - Renders action icons: search, jobs, gear/settings.
 * - Uses react-icons Feather icons for consistency and modern look.
 */
const NavigationBarIcons = () => (
    <div className={styles.iconGroup}>
        <NavIconButton
            icon={<IoIosSearch size={24} className={styles.iconSvg} />}
            label="Search"
        />
        <NavIconButton
            icon={<IoFolderOpenOutline size={24} className={styles.iconSvg} />}
            label="Jobs"
        />
        <NavIconButton
            icon={<FiSettings size={24} className={styles.iconSvg} />}
            label="Settings"
        />
    </div>
);

const NavigationBar = () => {
    logger.info('NavigationBar rendered');
    const { user, loading, error } = useCurrentUser();

    logger.info('NavigationBar: useCurrentUser output', { user, loading, error });

    return (
        <nav className={styles.navbar} role="navigation">
            <div className={styles.logoContainer}>
                <Logo />
            </div>
            <div className={styles.rightSection}>
                <NavigationBarIcons />
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
            </div>
        </nav>
    );
};

export default NavigationBar;