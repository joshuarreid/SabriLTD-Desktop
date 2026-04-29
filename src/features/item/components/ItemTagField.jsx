/**
 * ItemTagField.jsx
 *
 * Tag/category selector for item in modal—visually matching TagSettings tab.
 * Uses CategoryInfoPill and TagInfoPill to maintain full visual consistency.
 * Allows searching tag by substring and adding a new tag (via Enter) if none match.
 * Created tag are auto-selected and the search is cleared upon successful creation.
 * Fully presentational—no business logic. All handlers and state are injected.
 *
 * @component
 * @param {number|null} selectedCategoryId - The currently selected categoryId.
 * @param {number[]} selectedTagIds - Array of selected tag ids.
 * @param {(categoryId:number) => void} onCategoryChange - Handler for changing the tag category.
 * @param {(tagIds:number[]) => void} onTagChange - Handler for changing the selected tag array.
 * @param {object} itemTagFieldState - State/handlers from useItemTagField.
 * @param {boolean} [disabled=false] - UI disables all controls when true.
 * @returns {JSX.Element}
 */

import React, { useMemo } from "react";
import styles from "../styles/itemtagfield.module.css";
import CategoryInfoPill from "@/features/tag/tagsettings/components/CategoryInfoPill";
import TagInfoPill from "../../tag/components/TagInfoPill";

/**
 * logger for ItemTagField.
 * @constant
 */
const logger = {
    info: (...args) => console.log("[ItemTagField]", ...args),
    error: (...args) => console.error("[ItemTagField]", ...args),
};

/**
 * Extracts user-friendly error string from error object.
 * @param {*} err
 * @returns {string}
 */
const getErrorMessage = (err) => {
    if (!err) return "";
    if (typeof err === "string") return err;
    if (typeof err === "object") {
        if (err.message) return err.message;
        if (Array.isArray(err.errors) && err.errors[0]?.message)
            return err.errors[0].message;
        if (err.data && typeof err.data === "object" && err.data.message)
            return err.data.message;
        if (err.status) return String(err.status);
        return JSON.stringify(err);
    }
    return String(err);
};

/**
 * Returns true if search text does not exactly match any tag (case insensitive)
 * @param {string} search
 * @param {Array} tags
 */
const canAddTag = (search, tags) => {
    if (!search || !tags) return false;
    const trimmed = search.trim().toLowerCase();
    return (
        !!trimmed &&
        !tags.some((tag) => (tag.name || "").toLowerCase() === trimmed)
    );
};

const ItemTagField = ({
                          selectedCategoryId,
                          selectedTagIds,
                          onCategoryChange,
                          onTagChange,
                          itemTagFieldState,
                          disabled = false,
                      }) => {
    const {
        categories,
        isCategoriesPending,
        isCategoriesError,
        categoriesError,
        tags,
        isTagsPending,
        isTagsError,
        tagsError,
        tagSearch,
        setTagSearch,
        createTagStatus,
        handleCreateTag,
    } = itemTagFieldState;

    logger.info("ItemTagField rendered", { selectedCategoryId, selectedTagIds, tagSearch });

    // Selected tag rendered as pills with X (removable)
    const selectedTags = (selectedTagIds || [])
        .map(id => (tags || []).find(tag => tag.tagId === id))
        .filter(Boolean);

    // Unselected tag
    const unselectedTags = useMemo(
        () => (tags || []).filter(tag => !selectedTagIds.includes(tag.tagId)),
        [tags, selectedTagIds]
    );

    const trimmedSearch = (tagSearch || "").trim();

    /**
     * Handles tag creation; selects the tag and clears the search bar on success.
     * @param {object} newTag
     */
    const handleCreated = (newTag) => {
        if (newTag && newTag.tagId) {
            onTagChange([...selectedTagIds, newTag.tagId]);
        }
        setTagSearch("");
    };

    /**
     * Handles Enter for tag creation.
     * Adds new tag if search text is not empty and no existing tag matches (case-insensitive).
     * @param {React.KeyboardEvent<HTMLInputElement>} e
     */
    const handleTagSearchKeyDown = e => {
        if (
            e.key === "Enter" &&
            canAddTag(trimmedSearch, tags) &&
            handleCreateTag &&
            selectedCategoryId
        ) {
            logger.info("Creating tag from modal field search input", trimmedSearch);
            handleCreateTag(
                { categoryId: selectedCategoryId, name: trimmedSearch },
                handleCreated // onSuccess: auto-select & clear search
            );
        }
    };

    /**
     * Handles click on Add New Tag (when visible).
     */
    const handleAddTagClick = () => {
        if (
            canAddTag(trimmedSearch, tags) &&
            handleCreateTag &&
            selectedCategoryId
        ) {
            handleCreateTag(
                { categoryId: selectedCategoryId, name: trimmedSearch },
                handleCreated
            );
        }
    };

    return (
        <div className={styles.tabRoot}>
            {/* Categories row */}
            <div className={styles.pillsContainer}>
                {isCategoriesPending ? (
                    <div className={styles.status}>Loading categories…</div>
                ) : isCategoriesError ? (
                    <div className={styles.status} style={{ color: "#cd384a" }}>
                        {getErrorMessage(categoriesError)}
                    </div>
                ) : (categories || []).map(cat => (
                    <CategoryInfoPill
                        key={cat.categoryId}
                        label={cat.name}
                        emoji={cat.emoji}
                        active={cat.categoryId === selectedCategoryId}
                        onClick={() => {
                            logger.info("Category selected (ItemTagField)", cat.categoryId);
                            onCategoryChange(cat.categoryId);
                        }}
                    />
                ))}
            </div>
            {/* Tag input and tag pills in "card" container */}
            <div className={styles.placeholder}>
                <div className={styles.tagsHeaderRow}>
                    <input
                        className={styles.wideSearchBar}
                        value={tagSearch}
                        onChange={e => setTagSearch(e.target.value)}
                        onKeyDown={handleTagSearchKeyDown}
                        placeholder="Search or add tags"
                        aria-label="Search or add tags"
                        disabled={isTagsPending || isTagsError || createTagStatus === "saving" || disabled}
                        autoComplete="off"
                    />
                    <div className={styles.tagsHeaderActions}>
                        {createTagStatus === "saving" && (
                            <span className={styles.status}>Creating…</span>
                        )}
                        {createTagStatus === "error" && (
                            <span className={styles.statusError}>Error</span>
                        )}
                        {createTagStatus === "saved" && (
                            <span className={styles.statusSaved}>✓</span>
                        )}
                    </div>
                </div>
                {canAddTag(trimmedSearch, tags) && !!selectedCategoryId && (
                    <div className={styles.addTagRow}>
                        <button
                            type="button"
                            className={styles.addTagBtn}
                            onClick={handleAddTagClick}
                            disabled={createTagStatus === "saving" || disabled}
                        >
                            + Add “{trimmedSearch}” as new tag
                        </button>
                    </div>
                )}
                <div className={styles.tagsPillsRow}>
                    {selectedTags.map(tag =>
                        <TagInfoPill
                            key={tag.tagId}
                            label={tag.name}
                            onDelete={() => onTagChange(selectedTagIds.filter(id => id !== tag.tagId))}
                            active
                        />
                    )}
                    {isTagsPending ? (
                        <span>Loading tags…</span>
                    ) : isTagsError ? (
                        <span className={styles.noTagsMsg} style={{ color: "#cd384a" }}>
                            {getErrorMessage(tagsError)}
                        </span>
                    ) : unselectedTags.length > 0 ? (
                        unselectedTags.map(tag =>
                            <TagInfoPill
                                key={tag.tagId}
                                label={tag.name}
                                onClick={() => onTagChange([...selectedTagIds, tag.tagId])}
                            />
                        )
                    ) : (
                        <span className={styles.noTagsMsg}>No tags found.</span>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ItemTagField;