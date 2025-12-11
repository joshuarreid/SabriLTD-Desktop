import React from 'react';
import styles from '../styles/logo.module.css';
import logoImg from '../../../assets/logos/sabriltd-logo.png';

/**
 * Logo
 * - Displays the SabriLTD logo.
 *
 * @component
 * @returns {JSX.Element}
 */
const logger = {
    info: (...args) => console.log('[Logo]', ...args),
    error: (...args) => console.error('[Logo]', ...args),
};

const Logo = () => {
    logger.info('Logo rendered');
    return (
        <img
            src={logoImg}
            alt="SabriLTD Logo"
            className={styles.logo}
            height={40}
        />
    );
};

export default Logo;