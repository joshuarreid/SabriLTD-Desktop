import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../styles/logo.module.css';
import logoImg from '../../../assets/logos/sabriltd-logo.png';

/**
 * logger for Logo component.
 * @type {{info: Function, error: Function}}
 */
const logger = {
    info: (...args) => console.log('[Logo]', ...args),
    error: (...args) => console.error('[Logo]', ...args),
};

/**
 * Logo
 * - Displays the SabriLTD logo and navigates to the home page when clicked.
 *
 * @component
 * @returns {JSX.Element}
 */
const Logo = () => {
    logger.info('Logo rendered');
    const navigate = useNavigate();

    /**
     * Handles logo click for navigation.
     * @function
     * @returns {void}
     */
    const handleLogoClick = () => {
        logger.info('Logo clicked, navigating to home');
        navigate('/');
    };

    return (
        <img
            src={logoImg}
            alt="SabriLTD Logo"
            className={styles.logo}
            height={40}
            onClick={handleLogoClick}
            style={{ cursor: 'pointer' }}
            tabIndex={0}
            role="button"
            aria-label="Navigate to home"
            onKeyPress={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                    handleLogoClick();
                }
            }}
        />
    );
};

export default Logo;