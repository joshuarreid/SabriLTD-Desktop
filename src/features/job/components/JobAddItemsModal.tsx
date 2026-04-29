/**
 * JobAddItemsModal.jsx
 *
 * Modal that shows an ItemSearchBox in "add" mode.
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

import React, { useMemo } from "react";
import ItemSearchBox from "../../item/components/ItemSearchBox";
import Modal from "../../../components/modal/Modal";
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
}

const JobAddItemsModal: React.FC<JobAddItemsModalProps> = ({
    open,
    jobId,
    onClose,
    onToggleItem,
    isItemSelected,
    selectedCount,
    onAddItems,
    onOpenItemDetails,
    isSaving,
    status,
    error,
}) => {
    const resolvedJobId = useMemo(() => {
        if (jobId === null || jobId === undefined) return "";
        return String(jobId);
    }, [jobId]);

    if (!open) return null;

    const footer = (
        <div className={styles.footerBar}>
            <span className={styles.selectionCount}>
                {selectedCount === 0
                    ? "No item selected"
                    : `${selectedCount} item${selectedCount !== 1 ? "s" : ""} selected`}
            </span>
            <div className={styles.footerActions}>
                <button
                    type="button"
                    className={styles.cancelButton}
                    onClick={onClose}
                    disabled={isSaving}
                    aria-disabled={isSaving}
                >
                    Cancel
                </button>
                <button
                    type="button"
                    className={styles.addButton}
                    onClick={onAddItems}
                    disabled={selectedCount === 0 || isSaving || !jobId}
                    aria-disabled={selectedCount === 0 || isSaving || !jobId}
                >
                    {isSaving
                        ? "Adding…"
                        : `Add Item${selectedCount !== 1 ? "s" : ""} (${selectedCount})`}
                </button>
            </div>
        </div>
    );

    return (
        <Modal
            open={open}
            onClose={onClose}
            title={<h2 className={styles.modalTitle}>Add Items to Job</h2>}
            footer={footer}
            size="xl"
        >
            {!jobId ? (
                <div className={styles.errorMsg}>
                    No job specified. Please close this modal and reopen from a valid job.
                </div>
            ) : null}
            <div className={styles.searchBoxContainer}>
                <ItemSearchBox
                    mode="add"
                    onItemClick={onToggleItem}
                    onItemOpenDetails={onOpenItemDetails}
                    isItemSelected={isItemSelected}
                    columns={4}
                    rows={4}
                    pageSize={20}
                    sortField="name"
                    sortOrder="asc"
                    placeholder="Search items to add…"
                />
            </div>
            {error ? <div className={styles.errorMsg}>{error}</div> : null}
            {status === "saved" ? (
                <div className={styles.savedMsg}>
                    Items added successfully{resolvedJobId ? ` to job ${resolvedJobId}` : ""}
                </div>
            ) : null}
        </Modal>
    );
};

export default JobAddItemsModal;
