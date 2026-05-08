import React from 'react';
import styles from '../styles/userprofilescreen.module.css';
import { useUserProfile } from "../../features/user/hooks/useUserProfile.js";
import SaveStatus from "../../components/save/SaveStatus.jsx";

/**
 * UserProfileScreen
 * - Displays a form for viewing and editing the current user's profile (name & email).
 * - Renders Update/Reset buttons, validation, and a SaveStatus indicator.
 *
 * @component
 * @returns {JSX.Element}
 */
export const UserProfileScreen = () => {
    const {
        user,
        loading,
        error,
        profile,
        formError,
        handleChange,
        handleSubmit,
        handleReset,
        isSaving,
        hasChanges,
        saveState,
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
                        <button
                            type="submit"
                            className={styles.saveButton}
                            disabled={!hasChanges || isSaving}
                            aria-disabled={!hasChanges || isSaving}
                        >
                            Update
                        </button>
                        <button
                            type="button"
                            className={styles.resetButton}
                            onClick={handleReset}
                            disabled={isSaving}
                            aria-disabled={isSaving}
                        >
                            Reset
                        </button>
                    </div>
                    <div className={styles.saveFeedback}>
                        <SaveStatus status={saveState} />
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UserProfileScreen;