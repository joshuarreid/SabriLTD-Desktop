/**
 * UserProfileScreen
 * - Displays a form for viewing and editing the current user's profile (name & email).
 * - Fetches current user using useCurrentUser hook.
 *
 * @module UserProfileScreen
 */

import React from 'react';

import styles from '../features/profile/styles/userprofilescreen.module.css';
import {useUserProfile} from "../features/profile/hooks/useUserProfile";

/**
 * Logger for UserProfileScreen component.
 * @constant
 */
const logger = {
    info: (...args) => console.log('[UserProfileScreen]', ...args),
    error: (...args) => console.error('[UserProfileScreen]', ...args),
};

/**
 * UserProfileScreen
 * - Presents a user profile form for current user with name/email.
 * - No mutation is wired up yet.
 *
 * @component
 * @returns {JSX.Element}
 */
export const UserProfileScreen = () => {
    logger.info('UserProfileScreen mounted');
    const {
        user,
        loading,
        error,
        profile,
        formError,
        handleChange,
        handleSubmit,
        handleReset,
    } = useUserProfile();

    if (loading) {
        return (
            <div className={styles.centered}>
                <span>Loading profile…</span>
            </div>
        );
    }
    if (error) {
        return (
            <div className={styles.centered}>
                <span className={styles.errorMsg}>Failed to load user profile.</span>
            </div>
        );
    }

    // Hide screen if user not resolved for some edge case
    if (!user) return null;

    return (
        <div className={styles.profileContainer}>
            <div className={styles.profileCard}>
                <h2 className={styles.profileTitle}>My Profile</h2>
                <form className={styles.profileForm} onSubmit={handleSubmit}>
                    <div className={styles.formGroup}>
                        <label htmlFor="name">Name</label>
                        <input
                            id="name"
                            name="name"
                            type="text"
                            value={profile.name}
                            onChange={handleChange}
                            autoComplete="off"
                            className={styles.input}
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label htmlFor="email">Email</label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            value={profile.email}
                            onChange={handleChange}
                            autoComplete="off"
                            className={styles.input}
                        />
                    </div>
                    {formError && <div className={styles.errorMsg}>{formError}</div>}
                    <div className={styles.formActions}>
                        <button type="submit" className={styles.saveButton}>
                            Save changes
                        </button>
                        <button
                            type="button"
                            className={styles.resetButton}
                            onClick={handleReset}
                        >
                            Reset
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UserProfileScreen;