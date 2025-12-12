import React from "react";
import styles from "../features/settings/styles/settingsscreen.module.css";
import UserSettingsTab from "../features/settings/components/UserSettingsTab";

/**
 * SettingsScreen
 * - Top-level settings page with settings tab group.
 *
 * @component
 * @returns {JSX.Element}
 */
const logger = {
    info: (...args) => console.log('[SettingsScreen]', ...args),
    error: (...args) => console.error('[SettingsScreen]', ...args),
};

const SettingsScreen = () => {
    logger.info("SettingsScreen rendered");
    // For the wireframe, only render UserSettingsTab
    return (
        <main className={styles.settingsRoot}>
            <div className={styles.settingsTabsContainer}>
                {/* TODO: Add real tab navigation; only "Profile" shown for now */}
                <div className={styles.tabGroup}>
                    <div className={`${styles.tab} ${styles.tabActive}`}>Users</div>
                    <div className={styles.tab}>Storage Locations</div>
                    <div className={styles.tab}>Tags</div>

                </div>
                <section className={styles.settingsTabContent}>
                    <UserSettingsTab />
                </section>
            </div>
        </main>
    );
};

export default SettingsScreen;