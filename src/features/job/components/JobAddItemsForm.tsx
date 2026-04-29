import React, { useMemo } from "react";
import ItemSearchBox from "../../item/components/ItemSearchBox";
import styles from "../styles/additemstojobmodal.module.css";

export interface JobAddItemsFormProps {
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

const JobAddItemsForm: React.FC<JobAddItemsFormProps> = ({
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

    return (
        <>
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
        </>
    );
};

export default JobAddItemsForm;

