import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAllCategories } from "../../../api/category/category.js";
import { getAllTags, createTag } from "../../tag/api/tag.ts";
import { categoryKeys } from "../../../api/category/categoryQueryKeys.js";
import { tagKeys } from "../../tag/api/tagQueryKeys.ts";

/**
 * logger for useItemTagField.
 * @type {{info: Function, error: Function}}
 */
const logger = {
    info: (...args) => console.log("[useItemTagField]", ...args),
    error: (...args) => console.error("[useItemTagField]", ...args),
};

/**
 * Extracts data array from the Sabri API's ApiListResponse or array fallback.
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
 * Safely extracts a human-friendly error message from API/network error.
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
 * - Handles category fetch, tag fetch, and tag creation for item forms.
 * - All state is controlled by the parent (selectedCategoryId, tagSearch).
 * - Follows Bulletproof React architecture, API conventions, and logging requirements.
 *
 * @function
 * @param {object} params
 * @param {number|null} params.selectedCategoryId - The current active category, controlled by parent.
 * @param {string} params.tagSearch - The current tag search string, controlled by parent.
 * @returns {{
 *   categories: Array,
 *   isCategoriesPending: boolean,
 *   isCategoriesError: boolean,
 *   categoriesError: string,
 *   tag: Array,
 *   isTagsPending: boolean,
 *   isTagsError: boolean,
 *   tagsError: string,
 *   createTagStatus: 'idle'|'saving'|'saved'|'error',
 *   handleCreateTag: function, // signature: (payload, onSuccessCb?) => void
 *   invalidateTags: function
 * }}
 */
export function useItemTagField({ selectedCategoryId, tagSearch }) {
    logger.info("useItemTagField called", { selectedCategoryId, tagSearch });

    const queryClient = useQueryClient();

    /**
     * Query for all tag categories (Sabri API DTO).
     */
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

    const categories = getDataArray(categoriesResp).sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    const categoriesError = isCategoriesError
        ? getErrorMessage(categoriesResp?.errors?.[0] || categoriesFetchError)
        : "";

    /**
     * Query for all tag in a category, filtered by search string (Sabri API DTO).
     */
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

    // Filter tag list by the search string (client-side).
    const tags = (() => {
        const tagsArr = getDataArray(tagsResp);
        const lower = (tagSearch || "").trim().toLowerCase();
        if (!lower) return tagsArr;
        return tagsArr.filter((tag) => (tag.name || "").toLowerCase().includes(lower));
    })();

    const tagsError = isTagsError
        ? getErrorMessage(tagsResp?.errors?.[0] || tagsFetchError)
        : "";

    /**
     * Tag creation mutation (Sabri API DTO), status local to this hook.
     */
    const [createTagStatus, setCreateTagStatus] = React.useState("idle");
    const createTagMutation = useMutation({
        mutationFn: createTag,
        onMutate: () => setCreateTagStatus("saving"),
        // Use mutate callback to accept optimistic callback in invoking scope.
        // See https://tanstack.com/query/latest/docs/framework/react/guides/mutations#side-effects
        // and the context of this Space.
    });

    /**
     * Creates a new tag for the selected category. Optionally runs a callback (onSuccessCb) with the created tag on success.
     * @function
     * @param {{categoryId: number, name: string}} payload
     * @param {Function} [onSuccessCb] - Optional callback for successful creation with the new tag object.
     * @returns {void}
     */
    const handleCreateTag = ({ categoryId, name }, onSuccessCb) => {
        const trimmed = String(name || "").trim();
        if (!trimmed || !categoryId) {
            logger.info("handleCreateTag: empty name or category, aborting");
            return;
        }
        logger.info("Creating tag", { categoryId, name: trimmed });
        createTagMutation.mutate(
            { categoryId, name: trimmed },
            {
                onSuccess: async (resp) => {
                    logger.info("Tag created (Sabri API)", resp);
                    const createdTag = resp?.data || resp;
                    await queryClient.invalidateQueries({
                        queryKey: tagKeys.list({ categoryId: createdTag.categoryId }),
                    });
                    setCreateTagStatus("saved");
                    setTimeout(() => setCreateTagStatus("idle"), 1100);

                    // Call parent-provided success callback for selection/search management.
                    if (onSuccessCb && typeof onSuccessCb === "function") {
                        onSuccessCb(createdTag);
                    }
                },
                onError: (err) => {
                    logger.error("createTag failed", err);
                    setCreateTagStatus("error");
                    setTimeout(() => setCreateTagStatus("idle"), 1700);
                },
            }
        );
    };

    /**
     * Invalidates tag query for the current category.
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
        createTagStatus,
        handleCreateTag, // signature now allows optional onSuccessCb
        invalidateTags,
    };
}

export default useItemTagField;