import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import styles from "../features/settings/settingsscreen.module.css";
import UserSettingsTab from "../features/settings/usersettings/components/UserSettingsTab";
import StorageSettingsTab from "../features/settings/storagesettings/components/StorageSettingsTab";

/**
 * logger for SettingsScreen
 * @type {{info: Function, error: Function}}
 */
const logger = {
    info: (...args) => console.log('[SettingsScreen]', ...args),
    error: (...args) => console.error('[SettingsScreen]', ...args),
};

/** @constant {Array<{label: string, key: string}>} */
const TABS = [
    { label: "Users", key: "users" },
    { label: "Storage Locations", key: "storage" },
    { label: "Tags", key: "tags" },
];

/**
 * Reads the tab key from the search params or falls back to the first tab.
 * @param {string} search
 */
function getTabFromSearch(search) {
    const params = new URLSearchParams(search);
    const key = params.get("tab");
    if (TABS.some(tab => tab.key === key)) return key;
    return TABS[0].key;
}

/**
 * SettingsScreen - Renders settings navigation tabs and content.
 * Syncs selected tab with URL query string (?tab=).
 * @component
 * @returns {JSX.Element}
 */
const SettingsScreen = () => {
    logger.info("SettingsScreen rendered");
    const location = useLocation();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState(() => getTabFromSearch(location.search));

    // Keep activeTab in sync with the URL (if changed externally via nav or manual URL input)
    useEffect(() => {
        const current = getTabFromSearch(location.search);
        setActiveTab(current);
        logger.info("Tab set via URL/querystring:", current);
    }, [location.search]);

    /**
     * Handles navigation between settings tabs (click).
     * Updates both internal state and query param for consistency.
     * @param {string} tabKey
     */
    const handleTabClick = (tabKey) => {
        logger.info('Tab changed:', tabKey);
        // Only update if not already selected (prevents duplicate push)
        if (tabKey !== activeTab) {
            navigate(`?tab=${tabKey}`, { replace: false });
        }
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