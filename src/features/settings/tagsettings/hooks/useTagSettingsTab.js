import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    createCategory,
    updateCategory,
    deleteCategory,
    getAllCategories,
} from "../../../../api/category/category";
import { categoryKeys } from "../../../../api/category/categoryQueryKeys";

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
 * Manages business logic, side effects, TanStack Query, and state for tag category management.
 * Decouples category queries/mutations (Bulletproof React conventions).
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
     * React Query's QueryClient for cache and invalidation.
     */
    const queryClient = useQueryClient();

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

    // ---- UI handlers ----

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
    };
};