import React, { useMemo } from "react";
import { useTagSettingsTab } from "../hooks/useTagSettingsTab";
import TagSettingsLayout from "./TagSettingsLayout";

/**
 * logger for TagSettingsTab.
 *
 * @constant
 * @type {{info: Function, error: Function}}
 */
const logger = {
    info: (...args) => console.log("[TagSettingsTab]", ...args),
    error: (...args) => console.error("[TagSettingsTab]", ...args),
};

/**
 * TAG_SORT_OPTIONS
 * Dropdown sort options: only A to Z and Z to A.
 *
 * @constant
 * @type {Array<{key: string, label: string, field: string, order: "asc"|"desc"}>}
 */
const TAG_SORT_OPTIONS = [
    { key: "a-z", label: "A to Z", field: "name", order: "asc" },
    { key: "z-a", label: "Z to A", field: "name", order: "desc" },
];

/**
 * TagSettingsTab
 * Container component for Tag Settings.
 * - Owns state (search text, sort key).
 * - Uses useTagSettingsTab hook for data + mutations.
 * - Delegates pure rendering to TagSettingsLayout.
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
        tagDeleteId,
        tagDeleteStatus,
        triggerTagDelete,
        handleConfirmTagDelete,
        handleCancelTagDelete,
        createTagAsDraft,
        createTagStatus,
    } = useTagSettingsTab();

    const [tagSearch, setTagSearch] = React.useState("");
    const [sortKey, setSortKey] = React.useState("a-z");

    /**
     * Computes the current sort configuration from TAG_SORT_OPTIONS.
     *
     * @type {{key: string, label: string, field: string, order: "asc"|"desc"}}
     */
    const currentSort = useMemo(
        () => TAG_SORT_OPTIONS.find((opt) => opt.key === sortKey) || TAG_SORT_OPTIONS[0],
        [sortKey],
    );

    /**
     * Filters and sorts tags by search substring (case-insensitive) and sort order.
     *
     * @type {Array}
     */
    const filteredTags = useMemo(() => {
        if (isTagsPending || isTagsError) return [];
        const lower = tagSearch.trim().toLowerCase();

        let base = tags || [];
        if (lower) {
            base = base.filter((tag) => (tag.name || "").toLowerCase().includes(lower));
        }

        const sorted = [...base].sort((a, b) => {
            const aName = (a.name || "").toLocaleString().toLowerCase();
            const bName = (b.name || "").toLocaleString().toLowerCase();
            if (aName === bName) return 0;
            if (currentSort.order === "asc") {
                return aName.localeCompare(bName, undefined, {
                    numeric: true,
                    sensitivity: "base",
                });
            }
            return bName.localeCompare(aName, undefined, {
                numeric: true,
                sensitivity: "base",
            });
        });

        return sorted;
    }, [tags, tagSearch, isTagsPending, isTagsError, currentSort.order]);

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
     * Handles Enter key in the search bar.
     * Always creates a new tag with the current search string in the
     * selected category (if both are valid).
     *
     * @param {React.KeyboardEvent<HTMLInputElement>} event
     * @returns {void}
     */
    const handleTagSearchKeyDown = (event) => {
        if (event.key !== "Enter") return;

        const trimmed = tagSearch.trim();

        logger.info("Tag search Enter pressed", {
            rawValue: tagSearch,
            trimmed,
            selectedCategoryId,
        });

        if (!trimmed) {
            logger.info("Enter pressed with empty value; ignoring");
            return;
        }

        if (!selectedCategoryId) {
            logger.info("Enter pressed but no selectedCategoryId; ignoring create");
            return;
        }

        createTagAsDraft({
            categoryId: selectedCategoryId,
            name: trimmed,
        });
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

    /**
     * Handles click on the delete "x" for a tag pill.
     *
     * @param {number} tagId
     * @param {string} tagName
     * @returns {void}
     */
    const handleTagDeleteRequest = (tagId, tagName) => {
        logger.info("Delete icon clicked for tag", { tagId, tagName });
        triggerTagDelete(tagId);
    };

    /**
     * Handles sort value change from AlphabeticalSortFilter.
     *
     * @param {string} key
     * @returns {void}
     */
    const handleSortChange = (key) => {
        setSortKey(key);
    };

    return (
        <TagSettingsLayout
            categories={categories}
            selectedCategoryId={selectedCategoryId}
            onCategoryClick={handleCategoryClick}
            isCategoriesPending={isCategoriesPending}
            isCategoriesError={isCategoriesError}
            categoriesError={categoriesError}
            tags={tags}
            isTagsPending={isTagsPending}
            isTagsError={isTagsError}
            tagsError={tagsError}
            tagSearch={tagSearch}
            onTagSearchChange={handleTagSearchChange}
            onTagSearchKeyDown={handleTagSearchKeyDown}
            sortKey={sortKey}
            onSortChange={handleSortChange}
            filteredTags={filteredTags}
            createTagStatus={createTagStatus}
            tagDeleteId={tagDeleteId}
            tagDeleteStatus={tagDeleteStatus}
            onConfirmTagDelete={handleConfirmTagDelete}
            onCancelTagDelete={handleCancelTagDelete}
            onTagDeleteRequest={handleTagDeleteRequest}
        />
    );
};

export default TagSettingsTab;