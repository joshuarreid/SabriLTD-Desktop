/**
 * UserGridArrowButton
 * - Minimal chevron arrow for paging the user grid.
 * - Forwards all click/state logic.
 *
 * @module UserGridArrowButton
 * @param {object} props
 * @param {boolean} [props.left=false] - If true, left arrow; otherwise right.
 * @param {function} props.onClick - Pager action handler.
 * @param {boolean} [props.disabled=false] - Disabled state.
 * @returns {JSX.Element}
 */
import React from 'react';
import styles from '../styles/UserGridArrowButton.module.css';

const logger = {
    info: (...args) => console.log('[UserGridArrowButton]', ...args),
    error: (...args) => console.error('[UserGridArrowButton]', ...args),
};

export const UserGridArrowButton = ({ left = false, onClick, disabled = false }) => {
    logger.info('render', { left, disabled });
    return (
        <button
            type="button"
            className={`${styles.userGridArrowButton} ${left ? styles.left : styles.right}`}
            onClick={onClick}
            disabled={disabled}
            aria-label={left ? 'Previous users' : 'Next users'}
        >
            <svg width="32" height="32" viewBox="0 0 32 32" focusable="false" aria-hidden="true">
                <polyline
                    className={styles.chevron}
                    points={left ? "20,10 12,16 20,22" : "12,10 20,16 12,22"}
                    fill="none"
                    strokeWidth="3.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg>
        </button>
    );
};