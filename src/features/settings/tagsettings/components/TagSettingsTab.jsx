import React, { useState, useEffect } from "react";
import styles from "../styles/tagsettingstab.module.css";
import CategoryInfoPill from "./CategoryInfoPill";
import { useTagSettingsTab } from "../hooks/useTagSettingsTab";

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
 * - Renders tag category pill filtering section and management placeholder UI.
 * - Fetches categories using useTagSettingsTab (business/data logic).
 * @component
 * @returns {JSX.Element}
 */
const TagSettingsTab = () => {
    logger.info("TagSettingsTab rendered");

    // Hook manages fetching categories, loading/error state, selection
    const {
        categories,
        isCategoriesPending,
        isCategoriesError,
        categoriesError,
        selectedCategoryId,
        setSelectedCategoryId,
    } = useTagSettingsTab();

    /**
     * Handles category pill selection.
     * @param {number} id
     */
    const handleCategoryClick = (id) => {
        logger.info("Category pill clicked", id);
        setSelectedCategoryId(id);
    };

    // Loading or fetch error
    if (isCategoriesPending) {
        return (
            <div className={styles.placeholder}>
                <h3>Tags Settings</h3>
                <div style={{ color: "#9a95b4", marginTop: 8, fontSize: "1.1rem" }}>
                    Loading categories...
                </div>
            </div>
        );
    }

    if (isCategoriesError) {
        return (
            <div className={styles.placeholder}>
                <h3>Tags Settings</h3>
                <div style={{ color: "#cd384a", marginTop: 8, fontSize: "1.08rem" }}>
                    Failed to load categories. {categoriesError?.message || "Please try again."}
                </div>
            </div>
        );
    }

    return (
        <div className={styles.tabRoot}>
            <div className={styles.pillsContainer}>
                {categories && categories.length > 0 ? (
                    categories.map((cat) => (
                        <CategoryInfoPill
                            key={cat.categoryId}
                            label={cat.name}
                            emoji={cat.emoji} // If emoji is not from server, omit or enhance later
                            active={cat.categoryId === selectedCategoryId}
                            onClick={() => handleCategoryClick(cat.categoryId)}
                        />
                    ))
                ) : (
                    <span style={{ color: "#b6b3be", fontSize: "1.07em", padding: ".7em 2em" }}>
                        No categories yet.
                    </span>
                )}
            </div>
            <div className={styles.placeholder}>
                <h3>Tags Settings</h3>
                <div style={{ color: "#9a95b4", marginTop: 8, fontSize: "1.1rem" }}>
                    Tag management coming soon.
                </div>
            </div>
        </div>
    );
};

export default TagSettingsTab;