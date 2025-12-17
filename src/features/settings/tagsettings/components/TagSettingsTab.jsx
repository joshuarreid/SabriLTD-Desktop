// TagSettingsTab.jsx

import React from "react";
import styles from "../styles/tagsettingstab.module.css"

/**
 * logger for TagSettingsTab
 * @type {{info: Function, error: Function}}
 */
const logger = {
    info: (...args) => console.log('[TagSettingsTab]', ...args),
    error: (...args) => console.error('[TagSettingsTab]', ...args),
};

/**
 * TagSettingsTab
 * - Renders the Tag management placeholder UI in the Settings page.
 * @component
 * @returns {JSX.Element}
 */
const TagSettingsTab = () => {
    logger.info("TagSettingsTab rendered");
    return (
        <div className={styles.placeholder}>
            <h3>Tags Settings</h3>
            <div style={{ color: "#9a95b4", marginTop: 8, fontSize: "1.1rem" }}>
                Tag management coming soon.
            </div>
        </div>
    );
};

export default TagSettingsTab;