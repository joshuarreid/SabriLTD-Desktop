/**
 * useItemTagField.js
 *
 * Manages fetches, state, and mutation for tag category and tag selection in item create/edit forms.
 * Follows the same API pattern, error handling, and DTO shape as useTagSettingsTab.
 *
 * @module useItemTagField
 * @param {object} params
 * @param {number|null} [params.selectedCategoryId] - The currently selected tag category ID.
 * @returns {object} State, status, errors, and handlers for ItemTagField.
 */

import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAllCategories } from "../../../api/category/category";
import { getAllTags, createTag } from "../../../api/tag/tag";
import { categoryKeys } from "../../../api/category/categoryQueryKeys";
import { tagKeys } from "../../../api/tag/tagQueryKeys";

/**
 * logger for useItemTagField.
 * @type {{info: Function, error: Function}}
 */
const logger = {
    info: (...args) => console.log("[useItemTagField]", ...args),
    error: (...args) => console.error("[useItemTagField]", ...args),
};

/**
 * Extracts data array from API response (Sabri API DTO).
 * @param {object} resp
 * @returns {Array}
 */
function getDataArray(resp) {
    if (!resp) return [];
    if (Array.isArray(resp.data)) return resp.data;
    if (Array.isArray(resp)) return resp;
    return [];
}

/**
 * Safely extract a user-facing error message from API/network error.
 * @param {*} err
 * @returns {string}
 */
function getErrorMessage(err) {
    if (!err) return "";
    if (typeof err === "string") return err;
    if (typeof err === "object") {
        if (err.message) return err.message;
        if (Array.isArray(err.errors) && err.errors.length > 0 && err.errors[0]?.message)
            return err.errors[0].message;
        if (err.data && typeof err.data === "object" && err.data.message) return err.data.message;
        if (err.status) return String(err.status);
        return JSON.stringify(err);
    }
    return String(err);
}

/**
 * useItemTagField
 * - Handles category fetch, tag fetch, tag creation, and local search.
 * - Follows Bulletproof React conventions and Sabri API DTO shapes.
 *
 * @function
 * @param {object} params
 * @param {number|null} [params.selectedCategoryId]
 * @returns {object} Hook state for ItemTagField
 */
export function useItemTagField({ selectedCategoryId: initialCategoryId = null } = {}) {
    logger.info("useItemTagField init", { initialCategoryId });

    const queryClient = useQueryClient();
    const [tagSearch, setTagSearch] = useState("");
    const [selectedCategoryId, setSelectedCategoryId] = useState(initialCategoryId);

    // --- Category Query (Sabri DTO, matches useTagSettingsTab) ---
    const {
        data: categoriesResp,
        isPending: isCategoriesPending,
        isError: isCategoriesError,
        error: categoriesFetchError,
    } = useQuery({
        queryKey: categoryKeys.lists(),
        queryFn: () => getAllCategories(),
        staleTime: 10 * 60 * 1000,
        cacheTime: 60 * 60 * 1000,
    });

    const categories = useMemo(() => {
        return getDataArray(categoriesResp).sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    }, [categoriesResp]);

    const categoriesError = isCategoriesError
        ? getErrorMessage(categoriesResp?.errors?.[0] || categoriesFetchError)
        : "";

    // Auto-select first loaded category (once) if not set.
    useEffect(() => {
        if (categories.length > 0 && !selectedCategoryId) {
            const firstId = categories[0].categoryId;
            logger.info("Auto-selecting first category", firstId);
            setSelectedCategoryId(firstId);
        }
    }, [categories, selectedCategoryId]);

    // --- Tag Query (Sabri DTO, matches useTagSettingsTab) ---
    const {
        data: tagsResp,
        isPending: isTagsPending,
        isError: isTagsError,
        error: tagsFetchError,
    } = useQuery({
        queryKey: tagKeys.list({ categoryId: selectedCategoryId }),
        queryFn: () =>
            selectedCategoryId != null
                ? getAllTags({ categoryId: selectedCategoryId })
                : { data: [] },
        enabled: selectedCategoryId != null,
        staleTime: 5 * 60 * 1000,
        cacheTime: 30 * 60 * 1000,
    });

    // Filter tag list by search string (client-side).
    const tags = useMemo(() => {
        const tagsArr = getDataArray(tagsResp);
        const lower = tagSearch.trim().toLowerCase();
        if (!lower) return tagsArr;
        return tagsArr.filter((tag) => (tag.name || "").toLowerCase().includes(lower));
    }, [tagsResp, tagSearch]);

    const tagsError = isTagsError
        ? getErrorMessage(tagsResp?.errors?.[0] || tagsFetchError)
        : "";

    // --- Tag creation mutation (Sabri DTO, matches useTagSettingsTab) ---
    const [createTagStatus, setCreateTagStatus] = useState("idle");
    const createTagMutation = useMutation({
        mutationFn: createTag,
        onMutate: () => setCreateTagStatus("saving"),
        onSuccess: async (resp) => {
            logger.info("Tag created (Sabri API)", resp);
            const createdTag = resp?.data || resp;
            await queryClient.invalidateQueries({
                queryKey: tagKeys.list({ categoryId: createdTag.categoryId }),
            });
            setCreateTagStatus("saved");
            setTagSearch(""); // Clear after creation
            setTimeout(() => setCreateTagStatus("idle"), 1100);
        },
        onError: (err) => {
            logger.error("createTag failed", err);
            setCreateTagStatus("error");
            setTimeout(() => setCreateTagStatus("idle"), 1700);
        },
    });

    /**
     * Creates a new tag for the selected category.
     * @param {{categoryId: number, name: string}} payload
     * @returns {void}
     */
    const handleCreateTag = ({ categoryId, name }) => {
        const trimmed = String(name || "").trim();
        if (!trimmed || !categoryId) {
            logger.info("handleCreateTag: empty name or category, aborting");
            return;
        }
        logger.info("Creating tag", { categoryId, name: trimmed });
        createTagMutation.mutate({ categoryId, name: trimmed });
    };

    /**
     * Invalidates the tags query for the current categoryId.
     * @returns {Promise<void>}
     */
    const invalidateTags = async () => {
        if (!selectedCategoryId) return;
        await queryClient.invalidateQueries({
            queryKey: tagKeys.list({ categoryId: selectedCategoryId }),
        });
    };

    return {
        categories,
        isCategoriesPending,
        isCategoriesError,
        categoriesError,
        tags,
        isTagsPending,
        isTagsError,
        tagsError,
        selectedCategoryId,
        setSelectedCategoryId,
        tagSearch,
        setTagSearch,
        createTagStatus,
        handleCreateTag,
        invalidateTags,
    };
}

export default useItemTagField;