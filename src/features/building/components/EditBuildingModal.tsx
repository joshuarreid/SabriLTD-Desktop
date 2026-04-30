import React, { useRef } from "react";
import EditModal from "../../../components/modal/components/EditModal";
import EditBuildingForm from "./EditBuildingForm";

interface EditBuildingModalProps {
    open: boolean;
    onClose: () => void;
    building: { buildingId?: number; name: string; address: string; manager: string };
    isSaving: boolean;
    onSave: (buildingId: number | undefined, data: { name: string; address: string; manager: string }) => void;
    onDelete?: (buildingId: number | undefined) => void;
    error?: string | null;
    saveState?: 'saving' | 'saved' | 'idle' | 'error';
    [key: string]: any;
}

/**
 * EditBuildingModal
 * Modal wrapper for editing a building. Renders EditBuildingForm inside BuildingModal.
 *
 * @component
 * @param {object} props
 * @param {object} props.building - Building object to edit.
 * @param {boolean} props.open - Modal open state.
 * @param {boolean} props.isSaving - If the save action is pending.
 * @param {function} props.onSave - Receives (buildingId, {name, address, manager}) on submit.
 * @param {function} props.onClose - Called on modal backdrop or cancel.
 * @param {function} [props.onDelete] - Called when user confirms building deletion. Receives buildingId.
 * @param {string|null} props.error - Error message string (optional).
 * @param {'saving'|'saved'|'idle'|'error'} [props.saveState] - Current save state for SaveStatus indicator.
 * @returns {JSX.Element|null}
 */
const logger = {
    info: (...args: unknown[]) => console.log("[EditBuildingModal]", ...args),
    error: (...args: unknown[]) => console.error("[EditBuildingModal]", ...args),
};

const EditBuildingModal: React.FC<EditBuildingModalProps> = (props) => {
    logger.info("Rendering EditBuildingModal with props", props);
    const { open, onClose, building, onSave, onDelete, isSaving, saveState = 'idle', error, ...rest } = props;
    const formRef = useRef<any>(null);
    const handleSave = () => {
        if (formRef.current && typeof formRef.current.submit === 'function') {
            formRef.current.submit();
        }
    };
    return (
        <EditModal
            open={open}
            onClose={() => {
                logger.info("Modal closed");
                onClose();
            }}
            onSave={handleSave}
            onCancel={onClose}
            onDelete={onDelete ? () => onDelete(building.buildingId) : undefined}
            isSaving={isSaving}
            saveState={saveState}
            title={<h2>Edit Building</h2>}
        >
            <EditBuildingForm
                ref={formRef}
                building={building}
                error={error}
                isSaving={isSaving}
                onSave={onSave}
                onCancel={onClose}
                {...rest}
            />
        </EditModal>
    );
};

export default EditBuildingModal;
