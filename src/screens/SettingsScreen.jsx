import React, { useState } from "react";
import styles from "../features/settings/styles/settingsscreen.module.css";
import UserSettingsTab from "../features/settings/components/UserSettingsTab";
import StorageSettingsTab from "../features/settings/components/StorageSettingsTab";

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

const TABS = [
    { label: "Users", key: "users" },
    { label: "Storage Locations", key: "storage" },
    { label: "Tags", key: "tags" },
];

/**
 * SettingsScreen - Renders settings navigation tabs and content.
 * @returns {JSX.Element}
 */
const SettingsScreen = () => {
    logger.info("SettingsScreen rendered");

    /**
     * Currently selected tab key.
     * @type {[string, Function]}
     */
    const [activeTab, setActiveTab] = useState(TABS[0].key);

    /**
     * Handles navigation between settings tabs.
     * @param {string} tabKey
     * @returns {void}
     */
    const handleTabClick = (tabKey) => {
        logger.info('Tab changed:', tabKey);
        setActiveTab(tabKey);
    };

    /**
     * Renders main settings content based on active tab.
     * @returns {JSX.Element}
     */
    const renderTabContent = () => {
        switch (activeTab) {
            case "users":
                return <UserSettingsTab />;
            case "storage":
                return <StorageSettingsTab />;
            case "tags":
                return (
                    <div className={styles.placeholder}>
                        <h3>Tags Settings</h3>
                        <div style={{ color: "#9a95b4", marginTop: 8, fontSize: "1.1rem" }}>
                            Tag management coming soon.
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <main className={styles.settingsRoot}>
            <div className={styles.settingsTabsContainer}>
                <div className={styles.tabGroup}>
                    {TABS.map((tab) => (
                        <div
                            key={tab.key}
                            className={`${styles.tab} ${
                                activeTab === tab.key ? styles.tabActive : ""
                            }`}
                            onClick={() => handleTabClick(tab.key)}
                            tabIndex={0}
                            role="button"
                        >
                            {tab.label}
                        </div>
                    ))}
                </div>
                <section className={styles.settingsTabContent}>
                    {renderTabContent()}
                </section>
            </div>
        </main>
    );
};

export default SettingsScreen;