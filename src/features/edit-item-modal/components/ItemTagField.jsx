/**
 * ItemTagField.jsx
 *
 * UI component for selecting a tag category and tags for an item.
 * Provides category selection, tag search, tag selection (multi), and tag creation.
 * Selected tags are always visible as removable pills at the top (JobField UX).
 * All business logic must come from useItemTagField.
 *
 * @component
 * @param {number|null} selectedCategoryId - The currently selected categoryId.
 * @param {number[]} selectedTagIds - Array of selected tag ids.
 * @param {(categoryId:number) => void} onCategoryChange - Handler for changing the tag category.
 * @param {(tagIds:number[]) => void} onTagChange - Handler for changing the selected tags array.
 * @param {object} itemTagFieldState - State and handlers returned by useItemTagField.
 * @param {boolean} [disabled=false] - Whether controls should be disabled.
 * @returns {JSX.Element}
 */

import React, { useRef, useMemo } from "react";
import styles from "../styles/itemtagfield.module.css";

/**
 * logger for ItemTagField.
 * @constant
 */
const logger = {
    info: (...args) => console.log("[ItemTagField]", ...args),
    error: (...args) => console.error("[ItemTagField]", ...args),
};

/**
 * Extracts a user-friendly string from an error object for display.
 * @param {*} err
 * @returns {string}
 */
const getErrorMessage = (err) => {
    if (!err) return "";
    if (typeof err === "string") return err;
    if (typeof err === "object") {
        if (err.message) return err.message;
        if (err.data && typeof err.data === "object" && err.data.message)
            return err.data.message;
        if (err.status) return String(err.status);
        return JSON.stringify(err);
    }
    return String(err);
};

/**
 * ItemTagField
 * - Tag category & tag selector for items, compact, with pill UX (JobField style).
 * - UI only; all logic and state must be provided via the parent and useItemTagField.
 */
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

    // Cache for showing selected pills even if search filtered away
    const tagCache = useRef(new Map());
    useMemo(() => {
        (tags || []).forEach(tag => {
            if (tag && !tagCache.current.has(tag.tagId)) tagCache.current.set(tag.tagId, tag);
        });
    }, [tags]);

    const selectedTags = useMemo(() => {
        return (selectedTagIds || []).map(id =>
            tagCache.current.get(id) || { tagId: id, name: `Tag #${id}` }
        );
    }, [selectedTagIds]);

    const unselectedTags = useMemo(
        () => (tags || []).filter(tag => !selectedTagIds.includes(tag.tagId)),
        [tags, selectedTagIds]
    );

    /**
     * Handles tag search input Enter keydown to create a new tag.
     * @param {React.KeyboardEvent<HTMLInputElement>} e
     */
    const handleTagSearchKeyDown = e => {
        if (e.key === "Enter") {
            const val = (tagSearch || "").trim();
            if (val && handleCreateTag && selectedCategoryId) {
                logger.info("Creating tag from modal field search input", val);
                handleCreateTag({ categoryId: selectedCategoryId, name: val });
            }
        }
    };

    /**
     * Toggle tag selection/removal.
     * @param {number} tagId
     */
    const handleTagToggle = tagId => {
        logger.info("Tag pill toggled", tagId);
        if (selectedTagIds.includes(tagId)) {
            onTagChange(selectedTagIds.filter(id => id !== tagId));
        } else {
            onTagChange([...selectedTagIds, tagId]);
        }
    };

    /**
     * Mini pill renderer.
     */
    const Pill = ({ label, active, removable, onClick }) => (
        <span
            className={[
                styles.pill,
                active ? styles.pillActive : "",
                removable ? styles.pillRemovable : "",
            ].join(" ")}
            tabIndex={0}
            onClick={onClick}
            onKeyDown={e => {
                if (e.key === "Enter" || e.key === " ") onClick();
            }}
            role="button"
            aria-pressed={!!active}
        >
            {label}
            {removable && <span className={styles.pillRemove}>&times;</span>}
        </span>
    );

    return (
        <div className={styles.root}>
            {/* Category pill row */}
            <label className={styles.label}>Category</label>
            <div className={styles.categoriesRow} role="list">
                {isCategoriesPending ? (
                    <div className={styles.status}>Loading categories…</div>
                ) : isCategoriesError ? (
                    <div className={styles.status} style={{ color: "#c00" }}>
                        {getErrorMessage(categoriesError)}
                    </div>
                ) : (
                    (categories || []).map(cat =>
                        <Pill
                            key={cat.categoryId}
                            label={cat.name}
                            active={cat.categoryId === selectedCategoryId}
                            onClick={() => {
                                logger.info("Category selected (ItemTagField)", cat.categoryId);
                                onCategoryChange(cat.categoryId);
                            }}
                        />
                    )
                )}
            </div>
            {/* Selected tag pills */}
            <label className={styles.label}>Tags</label>
            <div className={styles.selectedTagsRow}>
                {selectedTags.map(tag =>
                    <Pill
                        key={tag.tagId}
                        label={tag.name}
                        removable
                        active
                        onClick={() => handleTagToggle(tag.tagId)}
                    />
                )}
            </div>
            {/* Search and create-new */}
            <div className={styles.tagSearchRow}>
                <input
                    type="text"
                    placeholder="Search or create tag…"
                    className={styles.tagSearchInput}
                    value={tagSearch}
                    onChange={e => setTagSearch(e.target.value)}
                    onKeyDown={handleTagSearchKeyDown}
                    disabled={!!isTagsPending || !!isTagsError || !!disabled}
                    aria-label="Search or create tag"
                    autoComplete="off"
                />
                <div className={styles.tagCreateStatus}>
                    {createTagStatus === "saving" && <span className={styles.status}>Creating…</span>}
                    {createTagStatus === "error" && <span className={styles.statusError}>Error</span>}
                    {createTagStatus === "saved" && <span className={styles.statusSaved}>✓</span>}
                </div>
            </div>
            <div className={styles.tagsGrid}>
                {isTagsPending ? (
                    <div className={styles.status}>Loading tags…</div>
                ) : isTagsError ? (
                    <div className={styles.status} style={{ color: "#c00" }}>
                        {getErrorMessage(tagsError)}
                    </div>
                ) : unselectedTags.length > 0 ? (
                    unselectedTags.map(tag =>
                        <Pill
                            key={tag.tagId}
                            label={tag.name}
                            active={false}
                            onClick={() => handleTagToggle(tag.tagId)}
                        />
                    )
                ) : (
                    <div className={styles.status}>No tags in this category.</div>
                )}
            </div>
        </div>
    );
};

export default ItemTagField;