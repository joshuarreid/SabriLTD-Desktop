import React, { useMemo } from "react";
import styles from "../styles/tagsettingstab.module.css";
import CategoryInfoPill from "./CategoryInfoPill";
import TagInfoPill from "./TagInfoPill";
import { useTagSettingsTab } from "../hooks/useTagSettingsTab";
import WideSearchBar from "../../../../components/searchbar/WideSearchBar";
import AlphabeticalSortFilter from "../../../../components/alphabeticalsortfilter/AlphabeticalSortFilter";
import ConfirmationModal from "../../../../components/confirmationmodal/ConfirmationModal";
import SaveStatus from "../../../../components/save/SaveStatus";

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
 * TAG_SORT_OPTIONS
 * Dropdown sort options: only A to Z and Z to A, mirrors STORAGE_SORT_OPTIONS.
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
 * Tag settings UI using real API data via hook.
 * - Category pills drive the selectedCategoryId.
 * - Search filters tags client-side.
 * - Pressing Enter in the search bar creates a new tag with the typed value
 *   in the selected category, and shows SaveStatus to the right of the bar.
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
        // tag delete modal state from hook
        tagDeleteId,
        tagDeleteStatus,
        triggerTagDelete,
        handleConfirmTagDelete,
        handleCancelTagDelete,
        // tag create helper + status
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
     * - If there is a non-empty search string and a category is selected,
     *   always create a new tag with that name in the selected category.
     *
     * @param {React.KeyboardEvent<HTMLInputElement>} event
     * @returns {void}
     */
    const handleTagSearchKeyDown = (event) => {
        if (event.key !== "Enter") return;

        const trimmed = tagSearch.trim();

        logger.info("Tag search Enter pressed (unconditional create)", {
            rawValue: tagSearch,
            trimmed,
            selectedCategoryId,
        });

        if (!trimmed) {
            logger.info("Enter pressed in tag search with empty value; ignoring");
            return;
        }

        if (!selectedCategoryId) {
            logger.info(
                "Enter pressed in tag search but no selectedCategoryId; ignoring create",
            );
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
                        Failed to load categories.{" "}
                        {categoriesError?.message || "Please try again."}
                    </span>
                </div>
            </div>
        );
    }

    const tagBeingDeleted =
        tagDeleteId != null ? tags.find((t) => t.tagId === tagDeleteId) : null;

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
                {/* Header row above tags: search bar on left, sort + status on right */}
                <div className={styles.tagsHeaderRow}>
                    <WideSearchBar
                        value={tagSearch}
                        onChange={handleTagSearchChange}
                        onKeyDown={handleTagSearchKeyDown}
                        placeholder="Search or add tags"
                        ariaLabel="Search or add tags"
                        disabled={
                            isTagsPending || isTagsError || createTagStatus === "saving"
                        }
                    />
                    <div className={styles.tagsHeaderActions}>
                        <SaveStatus
                            status={createTagStatus === "error" ? "idle" : createTagStatus}
                            savingText="Creating tag…"
                            savedText="Tag added"
                        />
                    </div>
                </div>

                <div className={styles.tagsPillsRow}>
                    {isTagsPending ? (
                        <span>Loading tags...</span>
                    ) : isTagsError ? (
                        <span className={styles.noTagsMsg} style={{ color: "#cd384a" }}>
                            Failed to load tags. {tagsError?.message || "Please try again."}
                        </span>
                    ) : filteredTags.length > 0 ? (
                        filteredTags.map((tag) => (
                            <TagInfoPill
                                key={tag.tagId}
                                label={tag.name}
                                onDelete={() => handleTagDeleteRequest(tag.tagId, tag.name)}
                            />
                        ))
                    ) : (
                        <span className={styles.noTagsMsg}>No tags found.</span>
                    )}
                </div>
            </div>

            <ConfirmationModal
                open={tagDeleteId != null}
                onCancel={handleCancelTagDelete}
                onConfirm={handleConfirmTagDelete}
                title="Delete tag?"
                description={
                    tagBeingDeleted
                        ? `Are you sure you want to delete the tag "${tagBeingDeleted.name}"? This cannot be undone.`
                        : "Are you sure you want to delete this tag? This cannot be undone."
                }
                confirmText="Delete tag"
                cancelText="Cancel"
                confirmDisabled={false}
                deleteStatus={tagDeleteStatus}
                deletingText="Deleting tag..."
                deletedText="Tag deleted"
            />
        </div>
    );
};

export default TagSettingsTab;