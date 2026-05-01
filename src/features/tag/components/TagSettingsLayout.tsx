import React from "react";
import styles from "../styles/tagsettingstab.module.css";
import CategoryInfoPill from "./CategoryInfoPill";
import TagInfoPill from "./TagInfoPill";
import WideSearchBar from "../../../components/searchbar/WideSearchBar.jsx";
import ConfirmationModal from "../../../components/confirmationmodal/ConfirmationModal.jsx";
import SaveStatus from "../../../components/save/SaveStatus.jsx";

interface Category {
    categoryId: number;
    name: string;
    emoji?: string;
}

interface Tag {
    tagId: number;
    name: string;
    categoryId: number;
    updatedBy?: string;
    dateAdded?: string;
    dateUpdated?: string;
}

type CreateTagStatus = 'idle' | 'saving' | 'saved' | 'error';
type TagDeleteStatus = 'idle' | 'deleting' | 'deleted' | 'error';

interface TagSettingsLayoutProps {
    categories: Category[];
    selectedCategoryId: number | null;
    onCategoryClick: (categoryId: number) => void;
    isCategoriesPending: boolean;
    isCategoriesError: boolean;
    categoriesError: Error | null;
    tags: Tag[];
    isTagsPending: boolean;
    isTagsError: boolean;
    tagsError: Error | null;
    tagSearch: string;
    onTagSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onTagSearchKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
    sortKey: string;
    onSortChange: (key: string) => void;
    filteredTags: Tag[];
    createTagStatus: CreateTagStatus;
    tagDeleteId: number | null;
    tagDeleteStatus: TagDeleteStatus;
    onConfirmTagDelete: () => void;
    onCancelTagDelete: () => void;
    onTagDeleteRequest: (tagId: number, tagName: string) => void;
}

/**
 * logger for TagSettingsLayout.
 *
 * @constant
 * @type {{info: Function, error: Function}}
 */
const logger = {
    info: (...args: unknown[]) => console.log("[TagSettingsLayout]", ...args),
    error: (...args: unknown[]) => console.error("[TagSettingsLayout]", ...args),
};

/**
 * TagSettingsLayout
 * Pure presentational component for the Tag Settings UI surface.
 * - Renders category pills, search bar, sort/status row, tag pills, and delete modal.
 * - Contains no business logic; all state and handlers are passed via props.
 *
 * @component
 * @param {Object} props
 * @param {Array} props.categories - Array of tag categories.
 * @param {number|null} props.selectedCategoryId - Currently selected categoryId.
 * @param {(categoryId:number) => void} props.onCategoryClick - Handler when a category pill is clicked.
 * @param {boolean} props.isCategoriesPending - Loading state for categories.
 * @param {boolean} props.isCategoriesError - Error state for categories.
 * @param {Error|null} props.categoriesError - Categories error object (if any).
 * @param {Array} props.tags - Array of tag objects for the selected category.
 * @param {boolean} props.isTagsPending - Loading state for tag.
 * @param {boolean} props.isTagsError - Error state for tag.
 * @param {Error|null} props.tagsError - Tags error object (if any).
 * @param {string} props.tagSearch - Current search string for tag.
 * @param {(e:React.ChangeEvent<HTMLInputElement>) => void} props.onTagSearchChange - Search input change handler.
 * @param {(e:React.KeyboardEvent<HTMLInputElement>) => void} props.onTagSearchKeyDown - Search input keydown handler (Enter to create).
 * @param {string} props.sortKey - Current sort key (e.g., "a-z" | "z-a").
 * @param {(key:string) => void} props.onSortChange - Handler for sort key changes.
 * @param {Array} props.filteredTags - Filtered (and sorted) tag list to render.
 * @param {('idle'|'saving'|'saved'|'error')} props.createTagStatus - Status for tag create mutation (drives SaveStatus).
 * @param {number|null} props.tagDeleteId - Tag id currently targeted for delete (for modal visibility).
 * @param {('idle'|'deleting'|'deleted'|'error')} props.tagDeleteStatus - Delete modal status.
 * @param {() => void} props.onConfirmTagDelete - Called when user confirms delete in modal.
 * @param {() => void} props.onCancelTagDelete - Called when user cancels delete modal.
 * @param {(tagId:number, tagName:string) => void} props.onTagDeleteRequest - Called when delete "x" is clicked on a TagInfoPill.
 * @returns {JSX.Element}
 */
const TagSettingsLayout: React.FC<TagSettingsLayoutProps> = ({
    categories = [],
    selectedCategoryId,
    onCategoryClick,
    isCategoriesPending,
    isCategoriesError,
    categoriesError,
    tags = [],
    isTagsPending,
    isTagsError,
    tagsError,
    tagSearch,
    onTagSearchChange,
    onTagSearchKeyDown,
    sortKey,
    onSortChange,
    filteredTags = [],
    createTagStatus,
    tagDeleteId,
    tagDeleteStatus,
    onConfirmTagDelete,
    onCancelTagDelete,
    onTagDeleteRequest,
}) => {
    logger.info("TagSettingsLayout rendered", {
        categoriesCount: categories?.length ?? 0,
        tagsCount: tags?.length ?? 0,
    });

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

    const tagBeingDeleted =
        tagDeleteId != null ? (tags || []).find((t) => t.tagId === tagDeleteId) : null;

    return (
        <div className={styles.tabRoot}>
            <div className={styles.sectionHeaderRow}>
                <h2 className={styles.sectionTitle}>Manage Tags</h2>
            </div>
            {/* Category pills row */}
            <div className={styles.pillsContainer}>
                {categories.length > 0 ? (
                    categories.map((cat) => (
                        <CategoryInfoPill
                            key={cat.categoryId}
                            label={cat.name}
                            emoji={cat.emoji}
                            active={cat.categoryId === selectedCategoryId}
                            onClick={() => onCategoryClick(cat.categoryId)}
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

            {/* Tags panel */}
            <div className={styles.placeholder}>
                <div className={styles.tagsHeaderRow}>
                    <WideSearchBar
                        value={tagSearch}
                        onChange={onTagSearchChange}
                        onKeyDown={onTagSearchKeyDown}
                        placeholder="Search or add tags"
                        ariaLabel="Search or add tags"
                        disabled={isTagsPending || isTagsError || createTagStatus === "saving"}
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
                    ) : (filteredTags.length > 0 ? (
                        filteredTags.map((tag) => (
                            <TagInfoPill
                                key={tag.tagId}
                                label={tag.name}
                                onDelete={() => onTagDeleteRequest(tag.tagId, tag.name)}
                            />
                        ))
                    ) : (
                        <span className={styles.noTagsMsg}>No tags found.</span>
                    ))}
                </div>
            </div>

            <ConfirmationModal
                open={tagDeleteId != null}
                onCancel={onCancelTagDelete}
                onConfirm={onConfirmTagDelete}
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
                confirmClass=""
                cancelClass=""
            />
        </div>
    );
};

export default TagSettingsLayout;

