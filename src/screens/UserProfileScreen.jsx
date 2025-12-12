import React from 'react';
import styles from '../features/profile/styles/userprofilescreen.module.css';
import {useUserProfile} from "../features/profile/hooks/useUserProfile";

/**
 * Icon for "Saving changes" (orange spinner).
 */
const SavingSpinner = () => (
    <svg className={styles.iconSpin} width="22" height="22" viewBox="0 0 22 22">
        <circle
            cx="11" cy="11" r="9"
            stroke="#e2762c"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
            strokeDasharray="12 20"
        />
    </svg>
);

/**
 * Icon for "Saved" (green check).
 */
const SavedCheck = () => (
    <svg width="22" height="22" viewBox="0 0 22 22">
        <circle cx="11" cy="11" r="10" fill="#4bbe4b" />
        <polyline points="6,12 10,16 16,7" fill="none" stroke="#fff" strokeWidth="2" />
    </svg>
);

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
                        {/* Saving feedback */}
                        {saveState === "saving" && (
                            <span className={styles.saveState}>
                                <SavingSpinner /> Saving changes
                            </span>
                        )}
                        {/* Saved feedback, only if nothing left to save and last op was success */}
                        {saveState === "saved" && !hasChanges && (
                            <span className={styles.saveState}>
                                <SavedCheck /> Saved
                            </span>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UserProfileScreen;