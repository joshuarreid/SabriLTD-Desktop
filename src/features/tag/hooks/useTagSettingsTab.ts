import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    createCategory,
    updateCategory,
    deleteCategory,
    getAllCategories,
} from "../../../api/category/category";
import { categoryKeys } from "../../../api/category/categoryQueryKeys";
import { useAllTags, useCreateTag, useUpdateTag, useDeleteTag } from "./useTag";
import type { Tag } from "../api/tag.types";

/**
 * logger for useTagSettingsTab hook (Bulletproof React: business logic, robust logging).
 * @type {{info: Function, error: Function}}
 */
const logger = {
    info: (...args: any[]) => console.log("[useTagSettingsTab]", ...args),
    error: (...args: any[]) => console.error("[useTagSettingsTab]", ...args),
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
    const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
    const queryClient = useQueryClient();

    // Categories
    const {
        data: categories = [],
        isPending: isCategoriesPending,
        isError: isCategoriesError,
        error: categoriesError,
    } = useQuery({
        queryKey: categoryKeys.lists(),
        queryFn: () => getAllCategories(),
    });

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

    // Tags for selected category
    const {
        data: tags = [],
        isPending: isTagsPending,
        isError: isTagsError,
        error: tagsError,
    } = useAllTags(selectedCategoryId ? { categoryId: selectedCategoryId } : {});

    // --- UI state for category edit/add ---
    const [editStatus, setEditStatus] = useState<string>("idle");
    const [addStatus, setAddStatus] = useState<string>("idle");
    const [editingId, setEditingId] = useState<number | null>(null);
    const [addingCategory, setAddingCategory] = useState<boolean>(false);
    const [removingId, setRemovingId] = useState<number | null>(null);

    // --- Tag delete confirmation modal state ---
    const [tagDeleteId, setTagDeleteId] = useState<number | null>(null);
    const [tagDeleteStatus, setTagDeleteStatus] = useState<'idle'|'deleting'|'deleted'|'error'>("idle");
    const [createTagStatus, setCreateTagStatus] = useState<'idle'|'saving'|'saved'|'error'>("idle");

    // Category mutations
    const updateCategoryMutation = useMutation({
        mutationFn: ({ categoryId, category }: { categoryId: number; category: any }) => updateCategory(categoryId, category),
        onMutate: () => setEditStatus("saving"),
        onSuccess: async (_updated, { categoryId, category }) => {
            await queryClient.invalidateQueries({ queryKey: categoryKeys.all });
            await queryClient.invalidateQueries({ queryKey: categoryKeys.lists() });
            await queryClient.invalidateQueries({ queryKey: categoryKeys.list() });
            await queryClient.invalidateQueries({ queryKey: categoryKeys.detail(categoryId) });
            await queryClient.invalidateQueries({ queryKey: categoryKeys.update(categoryId) });
            await queryClient.invalidateQueries({ queryKey: categoryKeys.remove(categoryId) });
            setEditStatus("saved");
            setTimeout(() => setEditStatus("idle"), 1400);
        },
        onError: (err) => {
            setEditStatus("error");
            setTimeout(() => setEditStatus("idle"), 1800);
        },
    });
    const deleteCategoryMutation = useMutation({
        mutationFn: deleteCategory,
        onMutate: () => setEditStatus("deleting"),
        onSuccess: async (_data, categoryId: number) => {
            setEditStatus("deleted");
            await queryClient.invalidateQueries({ queryKey: categoryKeys.all });
            await queryClient.invalidateQueries({ queryKey: categoryKeys.lists() });
            await queryClient.invalidateQueries({ queryKey: categoryKeys.list() });
            await queryClient.invalidateQueries({ queryKey: categoryKeys.detail(categoryId) });
            await queryClient.invalidateQueries({ queryKey: categoryKeys.update(categoryId) });
            await queryClient.invalidateQueries({ queryKey: categoryKeys.remove(categoryId) });
            setTimeout(() => {
                setEditStatus("idle");
                setRemovingId(null);
            }, 1000);
            if (selectedCategoryId === categoryId) {
                setSelectedCategoryId(null);
            }
        },
        onError: (err) => {
            setEditStatus("error");
            setTimeout(() => setEditStatus("idle"), 1400);
            setRemovingId(null);
        },
    });
    const createCategoryMutation = useMutation({
        mutationFn: createCategory,
        onMutate: () => setAddStatus("saving"),
        onSuccess: async (createdCategory) => {
            await queryClient.invalidateQueries({ queryKey: categoryKeys.all });
            await queryClient.invalidateQueries({ queryKey: categoryKeys.lists() });
            await queryClient.invalidateQueries({ queryKey: categoryKeys.list() });
            await queryClient.invalidateQueries({ queryKey: categoryKeys.detail(createdCategory?.categoryId) });
            setAddStatus("saved");
            setTimeout(() => setAddStatus("idle"), 1400);
        },
        onError: (err) => {
            setAddStatus("error");
            setTimeout(() => setAddStatus("idle"), 1800);
        },
    });

    // Tag CRUD logic via useTag
    const createTagMutation = useCreateTag();
    const updateTagMutation = useUpdateTag();
    const deleteTagMutation = useDeleteTag();

    const createTagAsDraft = ({ categoryId, name }: { categoryId: number; name: string }) => {
        const trimmed = String(name || "").trim();
        if (!trimmed || !categoryId) return;
        createTagMutation.mutate({ categoryId, name: trimmed });
    };

    // --- UI handlers for categories ---
    const openAddCategory = () => setAddingCategory(true);
    const handleAddCategory = (category: any, callback?: (err: any) => void) => {
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
    const handleEditCategory = (categoryId: number) => setEditingId(categoryId);
    const handleSaveEdit = (categoryId: number, category: any, callback?: (err: any) => void) => {
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
    const handleRemoveCategory = (categoryId: number) => setRemovingId(categoryId);
    const confirmRemoveCategory = (categoryId: number) => {
        deleteCategoryMutation.mutate(categoryId, {
            onSuccess: () => setRemovingId(null),
        });
    };
    const cancelRemoveCategory = () => setRemovingId(null);
    const cancelEditOrAdd = () => {
        setEditingId(null);
        setAddingCategory(false);
        setEditStatus("idle");
        setAddStatus("idle");
    };

    // --- UI handlers for tag delete confirmation ---
    const triggerTagDelete = (tagId: number) => {
        setTagDeleteId(tagId);
        setTagDeleteStatus("idle");
    };
    const handleConfirmTagDelete = () => {
        if (!tagDeleteId) return;
        deleteTagMutation.mutate(tagDeleteId);
    };
    const handleCancelTagDelete = () => {
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
        createTagMutation,
        updateTagMutation,
        deleteTagMutation,
        tagDeleteId,
        tagDeleteStatus,
        triggerTagDelete,
        handleConfirmTagDelete,
        handleCancelTagDelete,
        createTagAsDraft,
        createTagStatus,
    };
};