import { useState, useEffect, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createItem } from "../api/item.ts";
import { itemKeys } from "../api/ItemQueryKeys.ts";
import { useCurrentUser } from "../../user/hooks/useCurrentUser.js";
import { photoKeys } from "../../photo/api/photoQueryKeys";

interface Photo {
    photoId: number;
    url: string;
}

interface UseEditItemModalParams {
    photos?: Photo[];
    open: boolean;
    onClose: () => void;
}

interface UseEditItemModalReturn {
    photo: Photo | null;
    current: number;
    photos: Photo[];
    handlePrev: () => void;
    handleNext: () => void;
    handleSelect: (idx: number) => void;
    handleCancel: () => void;
    isFirst: boolean;
    isLast: boolean;
    itemName: string;
    setItemName: (name: string) => void;
    itemDescription: string;
    setItemDescription: (desc: string) => void;
    conditionId: number | null;
    setConditionId: (id: number | null) => void;
    jobIds: number[];
    setJobIds: (ids: number[]) => void;
    storageId: number | null;
    setStorageId: (id: number | null) => void;
    storageDesc: string;
    setStorageDesc: (desc: string) => void;
    comments: string;
    setComments: (comments: string) => void;
    selectedCategoryId: number | null;
    setSelectedCategoryId: (id: number | null) => void;
    selectedTagIds: number[];
    setSelectedTagIds: (ids: number[]) => void;
    tagSearch: string;
    setTagSearch: (search: string) => void;
    handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
    isSaving: boolean;
    isSaved: boolean;
    isSaveError: boolean;
    saveStatus: string;
    apiError: string;
}

const logger = {
    info: (...args: any[]) => console.log("[useEditItemModal]", ...args),
    error: (...args: any[]) => console.error("[useEditItemModal]", ...args),
};

export const useEditItemModal = ({ photos = [], open, onClose }: UseEditItemModalParams): UseEditItemModalReturn => {
    // --- Photo navigation state ---
    const [current, setCurrent] = useState(0);

    // --- Form fields (colocated in hook for Bulletproof React "only UI in .jsx") ---
    const [itemName, setItemName] = useState("");
    const [itemDescription, setItemDescription] = useState("");
    const [conditionId, setConditionId] = useState<number | null>(null);
    const [jobIds, setJobIds] = useState<number[]>([]);
    const [storageId, setStorageId] = useState<number | null>(null);
    const [storageDesc, setStorageDesc] = useState("");
    const [comments, setComments] = useState("");
    const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
    const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
    const [tagSearch, setTagSearch] = useState("");
    const [saveStatus, setSaveStatus] = useState("idle");
    const [apiError, setApiError] = useState("");

    // --- Get Current user ---
    const { user, loading: userLoading, error: userError } = useCurrentUser();

    // --- React Query/Create-Item mutation logic ---
    const queryClient = useQueryClient();

    const {
        mutate: mutateCreateItem,
        isPending: isSaving,
        isSuccess: isSaved,
        isError: isSaveError,
        reset: resetMutation,
        error: mutationError,
    } = useMutation({
        mutationKey: itemKeys.create(),
        mutationFn: createItem,
        onSuccess: (data, variables) => {
            const createdItemId =
                data?.data?.itemId ??
                data?.itemId ??
                null;

            logger.info("Item created successfully", {
                createdItemId,
                photoCount: Array.isArray(variables?.photoIds) ? variables.photoIds.length : 0,
            });

            queryClient.invalidateQueries({ queryKey: itemKeys.all });
            queryClient.invalidateQueries({ queryKey: itemKeys.lists() });
            queryClient.invalidateQueries({ queryKey: itemKeys.list() });
            queryClient.invalidateQueries({ queryKey: itemKeys.search() });
            queryClient.invalidateQueries({ queryKey: photoKeys.pendingList() });
            queryClient.invalidateQueries({ queryKey: photoKeys.lists() });

            setSaveStatus("saved");
            handleCancel();
        },
        onError: (error: any) => {
            logger.error("Item creation failed:", error);
            setSaveStatus("error");
            setApiError(error?.message || "Failed to create item.");
        },
    });

    useEffect(() => {
        if (open && photos.length > 0) setCurrent(0);
    }, [open, photos.length]);

    const handleCancel = useCallback(() => {
        logger.info("EditItemModal cancelled");
        setItemName("");
        setItemDescription("");
        setConditionId(null);
        setJobIds([]);
        setStorageId(null);
        setStorageDesc("");
        setComments("");
        setSelectedCategoryId(null);
        setSelectedTagIds([]);
        setTagSearch("");
        setSaveStatus("idle");
        setApiError("");
        resetMutation();
        if (onClose) onClose();
    }, [onClose, resetMutation]);

    const handlePrev = () => setCurrent((prev) => Math.max(prev - 1, 0));
    const handleNext = () => setCurrent((prev) => Math.min(prev + 1, photos.length - 1));
    const handleSelect = (idx: number) => setCurrent(idx);

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        if (e && typeof e.preventDefault === "function") e.preventDefault();
        logger.info("Submitting item create form.");

        if (!itemName.trim() || !conditionId || !storageId) {
            setApiError("Item name, condition, and storage are required.");
            setSaveStatus("error");
            return;
        }
        if (userLoading) {
            setApiError("user info is still loading.");
            setSaveStatus("error");
            return;
        }
        if (!user || !user.userId) {
            setApiError("Current user information is missing or invalid.");
            setSaveStatus("error");
            logger.error("createItem: Missing or invalid user for updatedBy", {
                hasUser: !!user,
                hasUserId: !!user?.userId,
            });
            return;
        }
        if (userError) {
            logger.error("createItem: Current user errored", userError);
        }

        setApiError("");
        setSaveStatus("saving");

        const photoIds = (photos || []).map((p) => p.photoId).filter(Boolean);
        const commentsArr = comments ? [comments] : undefined;

        mutateCreateItem({
            name: itemName.trim(),
            description: itemDescription,
            conditionId,
            jobIds: jobIds.length ? jobIds : undefined,
            storageId,
            storageDesc,
            tagIds: selectedTagIds,
            photoIds,
            comments: commentsArr,
            updatedBy: user.userId,
        });
    };

    return {
        photo: photos[current] || null,
        current,
        photos,
        handlePrev,
        handleNext,
        handleSelect,
        handleCancel,
        isFirst: current === 0,
        isLast: current === photos.length - 1,
        itemName,
        setItemName,
        itemDescription,
        setItemDescription,
        conditionId,
        setConditionId,
        jobIds,
        setJobIds,
        storageId,
        setStorageId,
        storageDesc,
        setStorageDesc,
        comments,
        setComments,
        selectedCategoryId,
        setSelectedCategoryId,
        selectedTagIds,
        setSelectedTagIds,
        tagSearch,
        setTagSearch,
        handleSubmit,
        isSaving,
        isSaved,
        isSaveError,
        saveStatus,
        apiError,
    };
};

export default useEditItemModal;
