import { useState, useEffect, ChangeEvent, FormEvent, Dispatch, SetStateAction } from "react";
import { useCreateBuilding, useUpdateBuilding, useDeleteBuilding } from './useBuildings';

/**
 * Building draft type
 */
export interface BuildingDraft {
    name: string;
    address: string;
    manager: string;
}

/**
 * useEditBuildingModal
 * Manages draft state, input, and validation logic for Add/Edit Building modals.
 *
 * @param building - If editing: existing building object; if adding: {name: "", address: "", manager: ""}.
 * @param isSaving - Whether the save operation is in progress.
 * @returns Modal draft state, error, and helpers
 */
export interface UseEditBuildingModalReturn {
    draft: BuildingDraft;
    formError: string | null;
    setFormError: Dispatch<SetStateAction<string | null>>;
    handleChange: (e: ChangeEvent<HTMLInputElement>) => void;
    handleSubmit: (e: FormEvent) => void;
    resetDraft: () => void;
}

/**
 * Standardized logger for useEditBuildingModal.
 * @constant
 */
const logger = {
    info: (...args: unknown[]) => console.log("[useEditBuildingModal]", ...args),
    error: (...args: unknown[]) => console.error("[useEditBuildingModal]", ...args),
};

/**
 * Custom hook for managing the edit/add modal state and logic for buildings.
 *
 * @param building - The current building to edit or an empty draft for add.
 * @param isSaving - Whether a save operation is in progress.
 * @returns Modal draft state, error, and helpers
 */
export const useEditBuildingModal = (
    building: { buildingId?: number; name: string; address: string; manager: string } | null,
    isSaving: boolean
): UseEditBuildingModalReturn & { isLoading: boolean; mutationError: string | null } => {
    const [draft, setDraft] = useState<BuildingDraft>({ name: "", address: "", manager: "" });
    const [formError, setFormError] = useState<string | null>(null);

    // Integrate TanStack mutations
    const createMutation = useCreateBuilding();
    const updateMutation = useUpdateBuilding();
    const deleteMutation = useDeleteBuilding();

    useEffect(() => {
        if (building) setDraft({
            name: building.name || "",
            address: building.address || "",
            manager: building.manager || ""
        });
        setFormError(null);
        logger.info("Initialized modal draft for building", building);
    }, [building]);

    /**
     * Updates a field in the draft state and clears form error.
     * @param e - React.ChangeEvent<HTMLInputElement>
     */
    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        setDraft((prev) => ({ ...prev, [e.target.name]: e.target.value }));
        setFormError(null);
    };

    /**
     * Handles form submission and validation.
     * @param e - React.FormEvent
     */
    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (!draft.name.trim() || !draft.address.trim() || !draft.manager.trim()) {
            setFormError("All fields are required.");
            return;
        }
        if (building?.buildingId) {
            updateMutation.mutate({ buildingId: building.buildingId, building: draft });
        } else {
            createMutation.mutate(draft);
        }
    };

    /**
     * Resets the draft to the initial building state.
     */
    const resetDraft = () => {
        if (building) {
            setDraft({
                name: building.name || "",
                address: building.address || "",
                manager: building.manager || ""
            });
        } else {
            setDraft({ name: "", address: "", manager: "" });
        }
        setFormError(null);
    };

    return {
        draft,
        formError,
        setFormError,
        handleChange,
        handleSubmit,
        resetDraft,
        isLoading: createMutation.isPending || updateMutation.isPending || deleteMutation.isPending,
        mutationError: (createMutation.error as Error)?.message || (updateMutation.error as Error)?.message || (deleteMutation.error as Error)?.message || null,
        createBuilding: createMutation.mutate,
        updateBuilding: updateMutation.mutate,
        deleteBuilding: deleteMutation.mutate,
    };
};