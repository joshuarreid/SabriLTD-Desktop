/**
 * JobAddItemsModal.jsx
 *
 * Modal that shows an ItemBrowser in "add" mode.
 * Single-click selects item; double-click opens item details.
 * A footer bar shows selected count and an "Add Items" button.
 *
 * @component
 * @param {object} props
 * @param {boolean} props.open
 * @param {number|string|null} props.jobId - Required to add item; used for error display/logging.
 * @param {() => void} props.onClose
 * @param {(item: object) => void} props.onToggleItem - Called on single-click to toggle selection.
 * @param {(itemId: number|string) => boolean} props.isItemSelected - Returns true if the item is selected.
 * @param {number} props.selectedCount
 * @param {() => void} props.onAddItems - Called when user clicks "Add Items".
 * @param {(item: object) => void} props.onOpenItemDetails - Called on double click to open details.
 * @param {boolean} props.isSaving
 * @param {"idle"|"saving"|"saved"|"error"} props.status
 * @param {string|null} props.error
 * @returns {JSX.Element|null}
 */

import React from "react";
import JobModal from "./JobModal";
import JobAddItemsForm from "./JobAddItemsForm";
import styles from "../styles/additemstojobmodal.module.css";

export interface JobAddItemsModalProps {
    open: boolean;
    jobId: number | string | null;
    onClose: () => void;
    onToggleItem: (item: any) => void;
    isItemSelected: (itemId: number | string) => boolean;
    selectedCount: number;
    onAddItems: () => void;
    onOpenItemDetails: (item: any) => void;
    isSaving: boolean;
    status: "idle" | "saving" | "saved" | "error";
    error: string | null;
    trigger?: React.ReactNode;
}

const logger = {
    info: (...args: any[]) => console.log("[JobAddItemsModal]", ...args),
    error: (...args: any[]) => console.error("[JobAddItemsModal]", ...args),
};

const JobAddItemsModal: React.FC<JobAddItemsModalProps> = (props) => {
    logger.info("Rendering JobAddItemsModal with props", props);
    const { open, onClose, trigger = null, ...rest } = props;
    return (
        <JobModal
            open={open}
            onClose={() => {
                logger.info("Modal closed");
                onClose();
            }}
            title={<h2 className={styles.modalTitle}>Add Items to Job</h2>}
            size="xl"
            trigger={trigger}
        >
            <JobAddItemsForm {...rest} onClose={onClose} />
        </JobModal>
    );
};

export default JobAddItemsModal;
