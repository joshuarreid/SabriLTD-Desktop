import { useState, useCallback, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCurrentUser } from "../../user/hooks/useCurrentUser";
import ItemApiClient from "../api/itemApiClient";

export interface EditItemValues {
    name: string;
    description: string;
    conditionId: number | null;
    jobIds: number[];
    storageId: number | null;
    storageDesc: string;
    comments: string;
    categoryId: number | null;
    tagIds: number[];
}

const logger = {
    info: (...args: any[]) => console.log("[useEditItemForm]", ...args),
    error: (...args: any[]) => console.error("[useEditItemForm]", ...args),
};

const getInitialEditValuesFromItem = (item: any): EditItemValues => ({
    name: item?.name || "",
    description: item?.description || "",
    conditionId: item?.conditionId ?? null,
    jobIds: Array.isArray(item?.jobIds) ? item.jobIds : [],
    storageId: item?.storageId ?? null,
    storageDesc: item?.storageDesc || "",
    comments: item?.comments || "",
    categoryId: item?.categoryId ?? null,
    tagIds: Array.isArray(item?.tagIds) ? item.tagIds : [],
});

interface UseEditItemFormParams {
    item: any;
}

const useEditItemForm = ({ item }: UseEditItemFormParams) => {
    logger.info("useEditItemForm initialized", { itemId: item?.itemId });
    const queryClient = useQueryClient();
    const { user: currentUser, loading: currentUserLoading, error: currentUserError } = useCurrentUser();
    const [isEditMode, setIsEditMode] = useState(false);
    const [editValues, setEditValues] = useState<EditItemValues>(() => getInitialEditValuesFromItem(item));
    const itemApiClient = new ItemApiClient();

    // Sync edit values if item changes and in edit mode
    // (optional, depending on your UI flow)
    // useEffect(() => {
    //     if (!item || !isEditMode) return;
    //     setEditValues(getInitialEditValuesFromItem(item));
    // }, [item, isEditMode]);

    const toggleEditMode = useCallback(() => {
        setIsEditMode((prev) => {
            const next = !prev;
            logger.info("toggleEditMode called", { itemId: item?.itemId, from: prev, to: next });
            setEditValues(getInitialEditValuesFromItem(item));
            return next;
        });
    }, [item]);

    const updateEditField = useCallback((field: keyof EditItemValues, nextValue: any) => {
        setEditValues((prev) => ({ ...prev, [field]: nextValue }));
    }, []);

    // --- Save mutation logic ---
    const saveItemMutation = useMutation({
        mutationFn: async (payload: EditItemValues & { updatedBy: any }) => {
            if (!item?.itemId) throw new Error("No itemId provided");
            return itemApiClient.updateItem(item.itemId, payload);
        },
        onSuccess: (savedItem) => {
            logger.info("Item saved successfully", { itemId: item?.itemId });
            // Invalidate queries for this item and the item list
            queryClient.invalidateQueries(); // Invalidate all queries (no itemKeys available)
        },
        onError: (err) => {
            logger.error("Failed to save item", err);
        },
    });

    const saveItem = useCallback(() => {
        if (!item?.itemId) {
            logger.error("Cannot save item without a valid itemId");
            return;
        }
        if (!currentUser?.userId) {
            logger.error("Cannot save item: missing current user id");
            return;
        }
        const payload = {
            ...editValues,
            updatedBy: currentUser.userId,
        };
        logger.info("Saving item", payload);
        saveItemMutation.mutate(payload);
    }, [item, editValues, saveItemMutation, currentUser]);

    const hasChanges = useMemo(() => {
        if (!item) return false;
        const original = getInitialEditValuesFromItem(item);
        return Object.keys(original).some(
            (key) => (editValues as any)[key] !== (original as any)[key]
        );
    }, [item, editValues]);

    return {
        isEditMode,
        editValues,
        toggleEditMode,
        updateEditField,
        saveItem,
        hasChanges,
        saveItemState: {
            isPending: saveItemMutation.isPending,
            isError: saveItemMutation.isError,
            error: saveItemMutation.error,
            isSuccess: saveItemMutation.isSuccess,
        },
        currentUserState: {
            loading: currentUserLoading,
            error: currentUserError,
        },
    };
};

export default useEditItemForm;
