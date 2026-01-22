/**
 * ItemTagField.jsx
 *
 * Tag/category selector for items in modal—visually matching TagSettings tab.
 * Uses CategoryInfoPill and TagInfoPill to maintain full visual consistency.
 * Compact, fully presentational—no business logic. All handlers and state come from useItemTagField.
 *
 * @component
 * @param {number|null} selectedCategoryId - The currently selected categoryId.
 * @param {number[]} selectedTagIds - Array of selected tag ids.
 * @param {(categoryId:number) => void} onCategoryChange - Handler for changing the tag category.
 * @param {(tagIds:number[]) => void} onTagChange - Handler for changing the selected tags array.
 * @param {object} itemTagFieldState - State/handlers from useItemTagField.
 * @param {boolean} [disabled=false] - UI disables all controls when true.
 * @returns {JSX.Element}
 */

import React, { useRef, useMemo } from "react";

import styles from "../styles/itemtagfield.module.css";
import CategoryInfoPill from "../../settings/tagsettings/components/CategoryInfoPill";
import TagInfoPill from "../../settings/tagsettings/components/TagInfoPill";

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

    // Selected tags rendered as pills with X (removable)
    const selectedTags = (selectedTagIds || [])
        .map(id => (tags || []).find(tag => tag.tagId === id))
        .filter(Boolean);

    // Unselected tags
    const unselectedTags = (tags || []).filter(tag => !selectedTagIds.includes(tag.tagId));

    /**
     * Handles Enter for tag creation.
     * @param {React.KeyboardEvent<HTMLInputElement>} e
     */
    const handleTagSearchKeyDown = e => {
        if (e.key === "Enter") {
            const val = (tagSearch || "").trim();
            if (val && handleCreateTag && selectedCategoryId) {
                handleCreateTag({ categoryId: selectedCategoryId, name: val });
            }
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
                        disabled={isTagsPending || isTagsError || createTagStatus === "saving"}
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