import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    createCategory,
    updateCategory,
    deleteCategory,
    getAllCategories,
} from "../../../../api/category/category";
import {
    getAllTags,
    createTag,
    updateTag,
    deleteTag,
} from "../../../../api/tag/tag";
import { categoryKeys } from "../../../../api/category/categoryQueryKeys";
import { tagKeys } from "../../../../api/tag/tagQueryKeys";

/**
 * logger for useTagSettingsTab hook (Bulletproof React: business logic, robust logging).
 * @constant
 * @type {{info: Function, error: Function}}
 */
const logger = {
    info: (...args) => console.log("[useTagSettingsTab]", ...args),
    error: (...args) => console.error("[useTagSettingsTab]", ...args),
};

/**
 * useTagSettingsTab
 * Manages business logic, side effects, TanStack Query, and state for tag category and tag management.
 * - Loads all tag categories.
 * - Automatically selects a default category (first category) when categories load.
 * - Whenever the selected category changes, fetches all tags for that categoryId.
 * - Exposes CRUD mutations for categories and tags with proper cache invalidation.
 *
 * @returns {object} All hook state, query status, and action handlers for UI.
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
     * is selected yet, default to the first category to drive the tags query.
     */
    useEffect(() => {
        if (!isCategoriesPending && !isCategoriesError && categories.length > 0 && !selectedCategoryId) {
            const firstId = categories[0].categoryId;
            logger.info("Auto-selecting first category", firstId);
            setSelectedCategoryId(firstId);
        }
    }, [categories, isCategoriesPending, isCategoriesError, selectedCategoryId]);

    /**
     * Query for all tags in the currently selected category.
     * Follows Tag API spec: GET /api/tags?categoryId=...
     * Only enabled when a category is selected.
     */
    const {
        data: tags = [],
        isPending: isTagsPending,
        isError: isTagsError,
        error: tagsError,
    } = useQuery({
        queryKey: tagKeys.list({ categoryId: selectedCategoryId }),
        queryFn: () => {
            if (!selectedCategoryId) {
                logger.info("Tags queryFn skipped: no selectedCategoryId");
                return [];
            }
            logger.info("Fetching tags for categoryId", selectedCategoryId);
            return getAllTags({ categoryId: selectedCategoryId });
        },
        enabled: !!selectedCategoryId,
    });

    // --- UI state for category edit/add ---
    const [editStatus, setEditStatus] = useState("idle");
    const [addStatus, setAddStatus] = useState("idle");
    const [editingId, setEditingId] = useState(null);
    const [addingCategory, setAddingCategory] = useState(false);
    const [removingId, setRemovingId] = useState(null);

    /**
     * Invalidates all relevant category queries after a mutation.
     * @async
     * @function invalidateAllCategoryKeys
     * @param {object} category - The affected category (may be partial).
     */
    const invalidateAllCategoryKeys = async (category) => {
        logger.info("Invalidating all relevant category query keys");
        await queryClient.invalidateQueries({ queryKey: categoryKeys.all });
        await queryClient.invalidateQueries({ queryKey: categoryKeys.lists() });
        await queryClient.invalidateQueries({ queryKey: categoryKeys.list() });
        if (category?.categoryId) {
            await queryClient.invalidateQueries({ queryKey: categoryKeys.detail(category.categoryId) });
            await queryClient.invalidateQueries({ queryKey: categoryKeys.update(category.categoryId) });
            await queryClient.invalidateQueries({ queryKey: categoryKeys.remove(category.categoryId) });
        }
    };

    /**
     * Invalidates all relevant tag queries after a mutation.
     * Also invalidates the list for that categoryId (if available).
     *
     * @async
     * @function invalidateAllTagKeys
     * @param {object} tag - The affected tag (may be partial).
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
     */
    const deleteTagMutation = useMutation({
        mutationFn: deleteTag,
        onSuccess: async (_data, tagId) => {
            logger.info("Tag deleted, invalidating tag keys");
            await invalidateAllTagKeys({ tagId });
        },
        onError: (err) => {
            logger.error("deleteTag failed", err);
        },
    });

    /**
     * Creates a tag. Invalidates keys.
     */
    const createTagMutation = useMutation({
        mutationFn: createTag,
        onSuccess: async (createdTag) => {
            logger.info("Tag created, invalidating tag keys");
            await invalidateAllTagKeys(createdTag);
        },
        onError: (err) => {
            logger.error("createTag failed", err);
        },
    });

    // ---- UI handlers for categories ----

    /**
     * Opens add-category modal.
     * @function openAddCategory
     */
    const openAddCategory = () => setAddingCategory(true);

    /**
     * Handles creation of a new category, updating addStatus and modal as needed.
     * @function handleAddCategory
     * @param {object} category - New category payload.
     * @param {Function} [callback]
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
     * @function handleEditCategory
     * @param {number} categoryId
     */
    const handleEditCategory = (categoryId) => setEditingId(categoryId);

    /**
     * Saves edits for a given category, closing edit modal as needed.
     * @function handleSaveEdit
     * @param {number} categoryId
     * @param {object} category
     * @param {Function} [callback]
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
            }
        );
    };

    /**
     * Opens removal prompt for a category.
     * @function handleRemoveCategory
     * @param {number} categoryId
     */
    const handleRemoveCategory = (categoryId) => setRemovingId(categoryId);

    /**
     * Confirms removal and performs mutation.
     * @function confirmRemoveCategory
     * @param {number} categoryId
     */
    const confirmRemoveCategory = (categoryId) => {
        logger.info("Confirm delete for category", categoryId);
        deleteCategoryMutation.mutate(categoryId, {
            onSuccess: () => setRemovingId(null),
        });
    };

    /**
     * Cancels removal prompt for a category.
     * @function cancelRemoveCategory
     */
    const cancelRemoveCategory = () => setRemovingId(null);

    /**
     * Cancels editing or adding states for categories.
     * @function cancelEditOrAdd
     */
    const cancelEditOrAdd = () => {
        setEditingId(null);
        setAddingCategory(false);
        setEditStatus("idle");
        setAddStatus("idle");
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
        // Tag CRUD mutations exposed for future UI (e.g., Tag editing dialogs).
        createTagMutation,
        updateTagMutation,
        deleteTagMutation,
    };
};