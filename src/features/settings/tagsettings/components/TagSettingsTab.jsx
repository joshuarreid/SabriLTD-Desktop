import React, { useMemo } from "react";
import styles from "../styles/tagsettingstab.module.css";
import CategoryInfoPill from "./CategoryInfoPill";
import TagInfoPill from "./TagInfoPill";
import { useTagSettingsTab } from "../hooks/useTagSettingsTab";
import WideSearchBar from "../../../../components/searchbar/WideSearchBar";

/**
 * logger for TagSettingsTab.
 * @constant
 * @type {{info: Function, error: Function}}
 */
const logger = {
    info: (...args) => console.log("[TagSettingsTab]", ...args),
    error: (...args) => console.error("[TagSettingsTab]", ...args),
};

/**
 * TagSettingsTab
 * Tag settings UI using real API data via hook.
 * Renders category pills, wide tag search bar, and tag pills.
 *
 * @component
 * @returns {JSX.Element}
 */
const TagSettingsTab = () => {
    logger.info("TagSettingsTab rendered");

    const {
        categories,
        isCategoriesPending,
        isCategoriesError,
        categoriesError,
        selectedCategoryId,
        setSelectedCategoryId,
        tags,
        isTagsPending,
        isTagsError,
        tagsError,
    } = useTagSettingsTab();

    // Local UI-only state for tag search text
    const [tagSearch, setTagSearch] = React.useState("");

    /**
     * Filters tags by search substring (case-insensitive).
     *
     * @type {Array}
     */
    const filteredTags = useMemo(() => {
        if (isTagsPending || isTagsError) return [];
        const lower = tagSearch.trim().toLowerCase();
        if (!lower) return tags;
        return tags.filter((tag) => (tag.name || "").toLowerCase().includes(lower));
    }, [tags, tagSearch, isTagsPending, isTagsError]);

    /**
     * Handles tag search bar input.
     *
     * @param {React.ChangeEvent<HTMLInputElement>} event
     * @returns {void}
     */
    const handleTagSearchChange = (event) => {
        setTagSearch(event.target.value);
    };

    /**
     * Handles click on a category pill.
     *
     * @param {number} categoryId
     * @returns {void}
     */
    const handleCategoryClick = (categoryId) => {
        logger.info("Category pill clicked", categoryId);
        setSelectedCategoryId(categoryId);
        setTagSearch("");
    };

    if (isCategoriesPending) {
        return (
            <div className={styles.tabRoot}>
                <div className={styles.placeholder}>Loading categories...</div>
            </div>
        );
    }

    if (isCategoriesError) {
        return (
            <div className={styles.tabRoot}>
                <div className={styles.placeholder}>
                    <span style={{ color: "#cd384a" }}>
                        Failed to load categories. {categoriesError?.message || "Please try again."}
                    </span>
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
                            emoji={cat.emoji}
                            active={cat.categoryId === selectedCategoryId}
                            onClick={() => handleCategoryClick(cat.categoryId)}
                        />
                    ))
                ) : (
                    <span
                        style={{
                            color: "#b6b3be",
                            fontSize: "1.07em",
                            padding: ".7em 2em",
                        }}
                    >
                        No categories yet.
                    </span>
                )}
            </div>
            <div className={styles.placeholder}>
                <WideSearchBar
                    value={tagSearch}
                    onChange={handleTagSearchChange}
                    placeholder="Search tags"
                    ariaLabel="Search tags"
                    disabled={isTagsPending || isTagsError}
                />
                <div className={styles.tagsPillsRow}>
                    {isTagsPending ? (
                        <span>Loading tags...</span>
                    ) : isTagsError ? (
                        <span className={styles.noTagsMsg} style={{ color: "#cd384a" }}>
                            Failed to load tags. {tagsError?.message || "Please try again."}
                        </span>
                    ) : filteredTags.length > 0 ? (
                        filteredTags.map((tag) => (
                            <TagInfoPill key={tag.tagId} label={tag.name} />
                        ))
                    ) : (
                        <span className={styles.noTagsMsg}>No tags found.</span>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TagSettingsTab;