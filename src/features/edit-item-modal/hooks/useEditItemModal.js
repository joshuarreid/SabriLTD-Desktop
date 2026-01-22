/**
 * useEditItemModal
 *
 * Handles state and navigation logic for item creation/editing (with multi-photo support) in EditItemModal.
 * Manages form state, navigation, and create-item mutation.
 * All business logic, mutations, API interaction, validation, and lifecycles, no UI rendering.
 *
 * @function
 * @param {object} params
 * @param {Array<{photoId:number, url:string}>} params.photos - The photo objects for the item.
 * @param {boolean} params.open - Modal open state.
 * @param {function} params.onClose - Close handler for modal.
 * @returns {object}
 *   Business/state for EditItemModal, including submit logic and mutation status.
 */

import { useState, useEffect, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createItem } from "../../../api/item/item";
import { itemKeys } from "../../../api/item/ItemQueryKeys";
import { useCurrentUser } from "../../../hooks/useCurrentUser";

/**
 * logger for useEditItemModal
 * @constant
 */
const logger = {
    info: (...args) => console.log("[useEditItemModal]", ...args),
    error: (...args) => console.error("[useEditItemModal]", ...args),
};

/**
 * useEditItemModal business logic hook for EditItemModal.
 * Handles navigation, form state, and item creation.
 * @param {object} params - See above.
 * @returns {object}
 */
export const useEditItemModal = ({ photos = [], open, onClose }) => {
    // --- Photo navigation state ---
    const [current, setCurrent] = useState(0);

    // --- Form fields (colocated in hook for Bulletproof React "only UI in .jsx") ---
    const [itemName, setItemName] = useState("");
    const [itemDescription, setItemDescription] = useState("");
    const [conditionId, setConditionId] = useState(null);
    const [jobIds, setJobIds] = useState([]); // For completeness, omit if not desired
    const [storageId, setStorageId] = useState(null);
    const [storageDesc, setStorageDesc] = useState("");
    const [comments, setComments] = useState("");
    const [selectedCategoryId, setSelectedCategoryId] = useState(null);
    const [selectedTagIds, setSelectedTagIds] = useState([]);
    const [tagSearch, setTagSearch] = useState("");
    const [saveStatus, setSaveStatus] = useState("idle");
    const [apiError, setApiError] = useState("");

    // --- Get Current User ---
    /**
     * Holds the authenticated user (includes userId for updatedBy).
     */
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
            logger.info("Item created successfully", data);
            // Invalidate all relevant caches for item lists/detail/search
            queryClient.invalidateQueries({ queryKey: itemKeys.all });
            queryClient.invalidateQueries({ queryKey: itemKeys.lists() });
            queryClient.invalidateQueries({ queryKey: itemKeys.list() });
            queryClient.invalidateQueries({ queryKey: itemKeys.search() });
            setSaveStatus("saved");
            handleCancel();
        },
        onError: (error) => {
            logger.error("Item creation failed:", error);
            setSaveStatus("error");
            setApiError(error?.message || "Failed to create item.");
        },
    });

    // Reset to first photo when modal opens or when photos change
    useEffect(() => {
        if (open && photos.length > 0) setCurrent(0);
    }, [open, photos.length]);

    /** Handles modal cancel/close and resets state fields */
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

    /** Photo navigation helpers */
    const handlePrev = () => setCurrent((prev) => Math.max(prev - 1, 0));
    const handleNext = () => setCurrent((prev) => Math.min(prev + 1, photos.length - 1));
    const handleSelect = (idx) => setCurrent(idx);

    /**
     * Handles form submit, including updatedBy from useCurrentUser.
     *
     * @function
     * @param {Event} e - The form event.
     */
    const handleSubmit = (e) => {
        if (e && typeof e.preventDefault === "function") e.preventDefault();
        logger.info("Submitting item create form.");

        // Minimal validation (expand as needed):
        if (!itemName.trim() || !conditionId || !storageId) {
            setApiError("Item name, condition, and storage are required.");
            setSaveStatus("error");
            return;
        }
        if (userLoading) {
            setApiError("User info is still loading.");
            setSaveStatus("error");
            return;
        }
        if (!user || !user.userId) {
            setApiError("Current user information is missing or invalid.");
            setSaveStatus("error");
            logger.error("createItem: Missing or invalid user for updatedBy", user);
            return;
        }
        setApiError("");
        setSaveStatus("saving");
        // Photos: pass as array of photoIds (per API)
        const photoIds = (photos || []).map((p) => p.photoId).filter(Boolean);

        // Comments as array, omit if empty string
        const commentsArr = comments
            ? [comments]
            : undefined;

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

    // --- API-visible fields and handlers ---
    return {
        photo: photos[current],
        current,
        photos,
        handlePrev,
        handleNext,
        handleSelect,
        handleCancel,
        isFirst: current === 0,
        isLast: current === photos.length - 1,
        // All form state to be controlled by EditItemModal.jsx UI (full bulletproof control)
        itemName, setItemName,
        itemDescription, setItemDescription,
        conditionId, setConditionId,
        jobIds, setJobIds,
        storageId, setStorageId,
        storageDesc, setStorageDesc,
        comments, setComments,
        selectedCategoryId, setSelectedCategoryId,
        selectedTagIds, setSelectedTagIds,
        tagSearch, setTagSearch,
        // Submission logic
        handleSubmit,
        isSaving,
        isSaved,
        isSaveError,
        saveStatus,
        apiError,
    };
};

export default useEditItemModal;