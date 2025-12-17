import React, { useState, useMemo } from "react";
import styles from "../styles/tagsettingstab.module.css";
import CategoryInfoPill from "./CategoryInfoPill";
import TagInfoPill from "./TagInfoPill";
import { FiSearch } from "react-icons/fi";

/**
 * Mock category data (with emoji if desired)
 */
const MOCK_CATEGORIES = [
    { categoryId: 1, name: "Brand Assets", emoji: "⭐" },
    { categoryId: 2, name: "Displays & Exhibits", emoji: "🖼️" },
    { categoryId: 3, name: "Furniture & Decor", emoji: "🪑" },
    { categoryId: 4, name: "Raw Materials", emoji: "🪵" },
    { categoryId: 5, name: "Build Components", emoji: "⚙️" },
    { categoryId: 6, name: "Fasteners & Mounting", emoji: "🔩" },
    { categoryId: 7, name: "Graphics & Finishes", emoji: "🖼️" },
    { categoryId: 8, name: "Tools & Equipment", emoji: "🛠️" },
    { categoryId: 9, name: "Packaging & Shipping", emoji: "📦" },
    { categoryId: 10, name: "Event & Field", emoji: "📅" },
    { categoryId: 11, name: "Maintenance & Spares", emoji: "🧰" },
    { categoryId: 12, name: "Archive & Retired", emoji: "🗂️" }
];

/**
 * Mock tags data for each category. (Normally would be fetched per category.)
 */
const MOCK_TAGS_BY_CATEGORY_ID = {
    1: [
        { tagId: 100, label: "Brand Guide" },
        { tagId: 101, label: "Logos" },
        { tagId: 102, label: "Brand Fonts" }
    ],
    2: [
        { tagId: 200, label: "Pop-up Booths" },
        { tagId: 201, label: "Banner Stands" },
        { tagId: 202, label: "Backdrops" }
    ],
    3: [
        { tagId: 300, label: "Conference Table" },
        { tagId: 301, label: "Display Case" }
    ],
    4: [
        { tagId: 400, label: "Aluminum Extrusions" },
        { tagId: 401, label: "Acrylic Panels" }
    ],
    5: [
        { tagId: 500, label: "Panel Connectors" }
    ],
};

const logger = {
    info: (...args) => console.log('[TagSettingsTab]', ...args),
    error: (...args) => console.error('[TagSettingsTab]', ...args),
};

/**
 * TagSettingsTab
 * - Tag settings UI with (category pills + top search bar), and inside the card:
 *   a top tag search bar + tag pills.
 * @component
 * @returns {JSX.Element}
 */
const TagSettingsTab = () => {
    logger.info("TagSettingsTab rendered");

    const [categoryId, setCategoryId] = useState(MOCK_CATEGORIES[0].categoryId);
    const [tagSearch, setTagSearch] = useState("");
    const [categorySearch, setCategorySearch] = useState("");

    const filteredCategories = useMemo(() => {
        const lower = categorySearch.trim().toLowerCase();
        if (!lower) return MOCK_CATEGORIES;
        return MOCK_CATEGORIES.filter((cat) =>
            cat.name.toLowerCase().includes(lower)
        );
    }, [categorySearch]);

    const tags = MOCK_TAGS_BY_CATEGORY_ID[categoryId] || [];
    const filteredTags = useMemo(() => {
        const lower = tagSearch.trim().toLowerCase();
        if (!lower) return tags;
        return tags.filter((tag) => tag.label.toLowerCase().includes(lower));
    }, [tags, tagSearch]);

    const handleCategoryClick = (cid) => {
        logger.info("Category pill clicked", cid);
        setCategoryId(cid);
        setTagSearch("");
    };

    const handleTagSearchChange = (e) => setTagSearch(e.target.value);
    const handleCategorySearchChange = (e) => setCategorySearch(e.target.value);

    return (
        <div className={styles.tabRoot}>
            <div className={styles.pillsContainer}>
                {filteredCategories.map((cat) => (
                    <CategoryInfoPill
                        key={cat.categoryId}
                        label={cat.name}
                        emoji={cat.emoji}
                        active={cat.categoryId === categoryId}
                        onClick={() => handleCategoryClick(cat.categoryId)}
                    />
                ))}
            </div>
            <div className={styles.placeholder}>
                {/* Full-width search bar at top of container */}
                <div className={styles.cardSearchTopBarWrap}>
                    <label className={styles.cardSearchBarContainer}>
                        <FiSearch size={25} className={styles.cardSearchIcon} />
                        <input
                            type="search"
                            className={styles.cardSearchBar}
                            placeholder="Search tags"
                            value={tagSearch}
                            onChange={handleTagSearchChange}
                            aria-label="Search tags"
                        />
                    </label>
                </div>
                <div className={styles.tagsPillsRow}>
                    {filteredTags.length > 0 ? (
                        filteredTags.map((tag) => (
                            <TagInfoPill key={tag.tagId} label={tag.label} />
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