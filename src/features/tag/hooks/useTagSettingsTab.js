import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    createCategory,
    updateCategory,
    deleteCategory,
    getAllCategories,
} from "../../../api/category/category.js";
import {
    getAllTags,
    createTag,
    updateTag,
    deleteTag,
} from "../../../api/tag/tag.js";
import { categoryKeys } from "../../../api/category/categoryQueryKeys.js";
import { tagKeys } from "../../../api/tag/tagQueryKeys.js";

/**
 * logger for useTagSettingsTab hook (Bulletproof React: business logic, robust logging).
 * @type {{info: Function, error: Function}}
 */
const logger = {
    info: (...args) => console.log("[useTagSettingsTab]", ...args),
    error: (...args) => console.error("[useTagSettingsTab]", ...args),
};

/**
 * useTagSettingsTab
 *
 * Manages business logic, side effects, TanStack Query, and state for tag category and tag management.
 * Mirrors the building → storage pattern used in useStorageSettingsTab:
 * - Loads all categories.
 * - Tracks a single selectedCategoryId in local state.
 * - Fetches tag for the selected category only, using a filtered list query key:
 *     tagKeys.list({ categoryId })
 * - Clicking different CategoryInfoPills swaps selectedCategoryId, which updates the tag
 *   query key and pulls the correct tag list from cache or network.
 *
 * Additional behavior:
 * - Manages a delete-confirmation flow for tag.
 * - Exposes a createTagAsDraft helper so the UI can create a new tag when the
 *   user hits Enter in the search box with no matches.
 *
 * @returns {object} Hook state, query status, and action handlers for the Tag Settings tab.
 */
export const useTagSettingsTab = () => {
    logger.info("useTagSettingsTab initialized");

    /**
     * Locally selected category. Set to a valid categoryId to drive the UI.
     * @type {[number|null, Function]}
     */
    const [selectedCategoryId, setSelectedCategoryId] = useState(null);

    /**
     * React Query's QueryClient for cache and invalidation.
     */
    const queryClient = useQueryClient();

    /**
     * Query for all categories (paginated, filtered).
     */
    const {
        data: categories = [],
        isPending: isCategoriesPending,
        isError: isCategoriesError,
        error: categoriesError,
    } = useQuery({
        queryKey: categoryKeys.lists(),
        queryFn: () => getAllCategories(),
    });

    /**
     * Side-effect: when categories are successfully loaded and no category
     * is selected yet, default to the first category to drive the tag query.
     */
    useEffect(() => {
        if (
            !isCategoriesPending &&
            !isCategoriesError &&
            categories.length > 0 &&
            selectedCategoryId == null
        ) {
            const firstId = categories[0].categoryId;
            logger.info("Auto-selecting first category", firstId);
            setSelectedCategoryId(firstId);
        }
    }, [categories, isCategoriesPending, isCategoriesError, selectedCategoryId]);

    /**
     * Query for all tag in the currently selected category.
     *
     * Pattern is intentionally the same as building → storage:
     *  - use a filtered list key: tagKeys.list({ categoryId: selectedCategoryId })
     *  - queryFn closes over selectedCategoryId
     *  - enabled flag ensures we only fetch when a category is chosen
     */
    const {
        data: tags = [],
        isPending: isTagsPending,
        isError: isTagsError,
        error: tagsError,
    } = useQuery({
        queryKey: tagKeys.list({ categoryId: selectedCategoryId }),
        queryFn: () =>
            selectedCategoryId != null
                ? getAllTags({ categoryId: selectedCategoryId })
                : [],
        enabled: selectedCategoryId != null,
    });

    // --- UI state for category edit/add ---
    const [editStatus, setEditStatus] = useState("idle");
    const [addStatus, setAddStatus] = useState("idle");
    const [editingId, setEditingId] = useState(null);
    const [addingCategory, setAddingCategory] = useState(false);
    const [removingId, setRemovingId] = useState(null);

    // --- Tag delete confirmation modal state ---
    /**
     * The tagId currently targeted for deletion (for confirmation modal).
     * @type {[number|null, Function]}
     */
    const [tagDeleteId, setTagDeleteId] = useState(null);

    /**
     * Visual delete status for the tag confirmation modal.
     * @type {[('idle'|'deleting'|'deleted'|'error'), Function]}
     */
    const [tagDeleteStatus, setTagDeleteStatus] = useState("idle");

    /**
     * Create-tag status for lightweight UX around "search-to-create".
     * @type {[('idle'|'saving'|'saved'|'error'), Function]}
     */
    const [createTagStatus, setCreateTagStatus] = useState("idle");

    /**
     * Invalidates all relevant category queries after a mutation.
     *
     * @async
     * @function invalidateAllCategoryKeys
     * @param {object} category - The affected category (may be partial).
     * @returns {Promise<void>}
     */
    const invalidateAllCategoryKeys = async (category) => {
        logger.info("Invalidating all relevant category query keys");
        await queryClient.invalidateQueries({ queryKey: categoryKeys.all });
        await queryClient.invalidateQueries({ queryKey: categoryKeys.lists() });
        await queryClient.invalidateQueries({ queryKey: categoryKeys.list() });

        if (category?.categoryId) {
            await queryClient.invalidateQueries({
                queryKey: categoryKeys.detail(category.categoryId),
            });
            await queryClient.invalidateQueries({
                queryKey: categoryKeys.update(category.categoryId),
            });
            await queryClient.invalidateQueries({
                queryKey: categoryKeys.remove(category.categoryId),
            });
        }
    };

    /**
     * Invalidates all relevant tag queries after a mutation.
     * - Always invalidates root/list keys.
     * - Additionally invalidates the filtered list for the tag's categoryId when known.
     *
     * @async
     * @function invalidateAllTagKeys
     * @param {object} tag - The affected tag (may be partial).
     * @returns {Promise<void>}
     */
    const invalidateAllTagKeys = async (tag) => {
        logger.info("Invalidating all relevant tag query keys");
        await queryClient.invalidateQueries({ queryKey: tagKeys.all });
        await queryClient.invalidateQueries({ queryKey: tagKeys.lists() });
        await queryClient.invalidateQueries({ queryKey: tagKeys.list() });

        if (tag?.tagId) {
            await queryClient.invalidateQueries({ queryKey: tagKeys.detail(tag.tagId) });
            await queryClient.invalidateQueries({ queryKey: tagKeys.update(tag.tagId) });
            await queryClient.invalidateQueries({ queryKey: tagKeys.remove(tag.tagId) });
        }

        if (tag?.categoryId) {
            await queryClient.invalidateQueries({
                queryKey: tagKeys.list({ categoryId: tag.categoryId }),
            });
        }
    };

    /**
     * Updates a category by ID and payload with responsive status management and logging.
     */
    const updateCategoryMutation = useMutation({
        mutationFn: ({ categoryId, category }) => updateCategory(categoryId, category),
        onMutate: () => setEditStatus("saving"),
        onSuccess: async (_updated, { categoryId, category }) => {
            logger.info("Category updated, invalidating category keys");
            await invalidateAllCategoryKeys({ ...category, categoryId });
            setEditStatus("saved");
            setTimeout(() => setEditStatus("idle"), 1400);
        },
        onError: (err) => {
            logger.error("updateCategory failed", err);
            setEditStatus("error");
            setTimeout(() => setEditStatus("idle"), 1800);
        },
    });

    /**
     * Deletes a category by ID, manages dialog badge/UX status.
     */
    const deleteCategoryMutation = useMutation({
        mutationFn: deleteCategory,
        onMutate: () => setEditStatus("deleting"),
        onSuccess: async (_data, categoryId) => {
            logger.info("Category deleted, invalidating category keys");
            setEditStatus("deleted");
            await invalidateAllCategoryKeys({ categoryId });
            setTimeout(() => {
                setEditStatus("idle");
                setRemovingId(null);
            }, 1000);

            // If we just deleted the selected category, clear selection
            if (selectedCategoryId === categoryId) {
                logger.info("Deleted selected category; clearing selectedCategoryId");
                setSelectedCategoryId(null);
            }
        },
        onError: (err) => {
            logger.error("deleteCategory failed", err);
            setEditStatus("error");
            setTimeout(() => setEditStatus("idle"), 1400);
            setRemovingId(null);
        },
    });

    /**
     * Creates a category. Invalidates keys and closes modal.
     */
    const createCategoryMutation = useMutation({
        mutationFn: createCategory,
        onMutate: () => setAddStatus("saving"),
        onSuccess: async (createdCategory) => {
            logger.info("Category created, invalidating category keys");
            await invalidateAllCategoryKeys(createdCategory);
            setAddStatus("saved");
            setTimeout(() => setAddStatus("idle"), 1400);
        },
        onError: (err) => {
            logger.error("createCategory failed", err);
            setAddStatus("error");
            setTimeout(() => setAddStatus("idle"), 1800);
        },
    });

    // ---- Tag CRUD logic ----

    /**
     * Updates a tag by ID and payload with caching and logging.
     */
    const updateTagMutation = useMutation({
        mutationFn: ({ tagId, tag }) => updateTag(tagId, tag),
        onSuccess: async (_updated, { tagId, tag }) => {
            logger.info("Tag updated, invalidating tag keys");
            await invalidateAllTagKeys({ ...tag, tagId });
        },
        onError: (err) => {
            logger.error("updateTag failed", err);
        },
    });

    /**
     * Deletes a tag by ID.
     * Note: we pass the active selectedCategoryId so the filtered list gets invalidated.
     */
    const deleteTagMutation = useMutation({
        mutationFn: deleteTag,
        onMutate: () => {
            logger.info("deleteTagMutation onMutate");
            setTagDeleteStatus("deleting");
        },
        onSuccess: async (_data, tagId) => {
            logger.info("Tag deleted, invalidating tag keys", { tagId, selectedCategoryId });
            await invalidateAllTagKeys({ tagId, categoryId: selectedCategoryId });
            setTagDeleteStatus("deleted");
            setTimeout(() => {
                setTagDeleteStatus("idle");
                setTagDeleteId(null);
            }, 1000);
        },
        onError: (err) => {
            logger.error("deleteTag failed", err);
            setTagDeleteStatus("error");
            setTimeout(() => setTagDeleteStatus("idle"), 1600);
        },
    });

    /**
     * Creates a tag. Invalidates keys.
     */
    const createTagMutation = useMutation({
        mutationFn: createTag,
        onMutate: () => {
            logger.info("createTagMutation onMutate");
            setCreateTagStatus("saving");
        },
        onSuccess: async (createdTag) => {
            logger.info("Tag created, invalidating tag keys");
            await invalidateAllTagKeys(createdTag);
            setCreateTagStatus("saved");
            setTimeout(() => setCreateTagStatus("idle"), 1200);
        },
        onError: (err) => {
            logger.error("createTag failed", err);
            setCreateTagStatus("error");
            setTimeout(() => setCreateTagStatus("idle"), 1600);
        },
    });

    /**
     * createTagAsDraft
     * - Helper used by the UI when the user presses Enter in the search bar
     *   and there are no matching tag.
     *
     * @function createTagAsDraft
     * @param {{categoryId: number, name: string}} payload - New tag payload.
     * @returns {void}
     */
    const createTagAsDraft = ({ categoryId, name }) => {
        const trimmed = String(name || "").trim();
        if (!trimmed) {
            logger.info("createTagAsDraft called with empty name; aborting");
            return;
        }
        if (!categoryId) {
            logger.info("createTagAsDraft called with no categoryId; aborting");
            return;
        }
        logger.info("createTagAsDraft creating tag", { categoryId, name: trimmed });
        createTagMutation.mutate({
            categoryId,
            name: trimmed,
        });
    };

    // ---- UI handlers for categories ----

    /**
     * Opens add-category modal.
     * @function openAddCategory
     * @returns {void}
     */
    const openAddCategory = () => setAddingCategory(true);

    /**
     * Handles creation of a new category, updating addStatus and modal as needed.
     *
     * @function handleAddCategory
     * @param {object} category - New category payload.
     * @param {Function} [callback] - Optional callback invoked with (error|null).
     * @returns {void}
     */
    const handleAddCategory = (category, callback) => {
        logger.info("Creating category:", category.name);
        createCategoryMutation.mutate(category, {
            onSuccess: () => {
                setAddingCategory(false);
                if (callback) callback(null);
            },
            onError: (error) => {
                if (callback) callback(error);
            },
        });
    };

    /**
     * Opens edit mode for a category by ID.
     *
     * @function handleEditCategory
     * @param {number} categoryId
     * @returns {void}
     */
    const handleEditCategory = (categoryId) => setEditingId(categoryId);

    /**
     * Saves edits for a given category, closing edit modal as needed.
     *
     * @function handleSaveEdit
     * @param {number} categoryId
     * @param {object} category
     * @param {Function} [callback]
     * @returns {void}
     */
    const handleSaveEdit = (categoryId, category, callback) => {
        logger.info("Saving edit for category", categoryId, category.name);
        updateCategoryMutation.mutate(
            { categoryId, category },
            {
                onSuccess: () => {
                    setEditingId(null);
                    if (callback) callback(null);
                },
                onError: (err) => {
                    setEditingId(null);
                    if (callback) callback(err);
                },
            },
        );
    };

    /**
     * Opens removal prompt for a category.
     *
     * @function handleRemoveCategory
     * @param {number} categoryId
     * @returns {void}
     */
    const handleRemoveCategory = (categoryId) => setRemovingId(categoryId);

    /**
     * Confirms removal and performs mutation.
     *
     * @function confirmRemoveCategory
     * @param {number} categoryId
     * @returns {void}
     */
    const confirmRemoveCategory = (categoryId) => {
        logger.info("Confirm delete for category", categoryId);
        deleteCategoryMutation.mutate(categoryId, {
            onSuccess: () => setRemovingId(null),
        });
    };

    /**
     * Cancels removal prompt for a category.
     *
     * @function cancelRemoveCategory
     * @returns {void}
     */
    const cancelRemoveCategory = () => setRemovingId(null);

    /**
     * Cancels editing or adding states for categories.
     *
     * @function cancelEditOrAdd
     * @returns {void}
     */
    const cancelEditOrAdd = () => {
        setEditingId(null);
        setAddingCategory(false);
        setEditStatus("idle");
        setAddStatus("idle");
    };

    // ---- UI handlers for tag delete confirmation ----

    /**
     * Triggers the tag delete confirmation modal for a specific tagId.
     *
     * @function triggerTagDelete
     * @param {number} tagId
     * @returns {void}
     */
    const triggerTagDelete = (tagId) => {
        logger.info("triggerTagDelete called", { tagId });
        setTagDeleteId(tagId);
        setTagDeleteStatus("idle");
    };

    /**
     * Confirms deletion of the currently selected tag in the modal.
     *
     * @function handleConfirmTagDelete
     * @returns {void}
     */
    const handleConfirmTagDelete = () => {
        if (!tagDeleteId) {
            logger.error("handleConfirmTagDelete called but tagDeleteId is null");
            return;
        }
        logger.info("handleConfirmTagDelete for tagId", tagDeleteId);
        deleteTagMutation.mutate(tagDeleteId);
    };

    /**
     * Cancels the tag delete confirmation modal and resets status.
     *
     * @function handleCancelTagDelete
     * @returns {void}
     */
    const handleCancelTagDelete = () => {
        logger.info("handleCancelTagDelete");
        setTagDeleteId(null);
        setTagDeleteStatus("idle");
    };

    return {
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
        editingId,
        removingId,
        addingCategory,
        openAddCategory,
        handleAddCategory,
        handleEditCategory,
        handleSaveEdit,
        handleRemoveCategory,
        confirmRemoveCategory,
        cancelRemoveCategory,
        cancelEditOrAdd,
        editStatus,
        addStatus,
        // Tag CRUD mutations for future dialogs
        createTagMutation,
        updateTagMutation,
        deleteTagMutation,
        // Tag delete confirmation state/handlers
        tagDeleteId,
        tagDeleteStatus,
        triggerTagDelete,
        handleConfirmTagDelete,
        handleCancelTagDelete,
        // Search-to-create helper and status
        createTagAsDraft,
        createTagStatus,
    };
};