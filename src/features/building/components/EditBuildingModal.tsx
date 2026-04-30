import React from "react";
import BuildingModal from "./BuildingModal";
import EditBuildingForm from "./EditBuildingForm";

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
    info: (...args) => console.log("[EditBuildingModal]", ...args),
    error: (...args) => console.error("[EditBuildingModal]", ...args),
};

const EditBuildingModal = (props) => {
    logger.info("Rendering EditBuildingModal with props", props);
    const { open, onClose, trigger = null, ...rest } = props;
    if (!open) return null;
    return (
        <BuildingModal
            open={open}
            onClose={() => {
                logger.info("Modal closed");
                onClose();
            }}
            title={<h2>Edit Building</h2>}
            size="sm"
            trigger={trigger}
        >
            <EditBuildingForm {...rest} />
        </BuildingModal>
    );
};

export default EditBuildingModal;
