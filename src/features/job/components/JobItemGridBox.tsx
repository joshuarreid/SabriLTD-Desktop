/**
 * JobItemGridBox.jsx
 *
 * UI component for the item section of JobDetailScreen.
 * Renders an "Add Items" button at the top that opens a modal
 * with ItemSearchBox in add mode for selecting item to add to the job.
 * Also renders the existing ItemCardGrid for item already on the job.
 *
 * @component
 * @param {object} props
 * @param {number|string} props.jobId - The current job's ID.
 * @param {Array<object>} props.item
 * @param {boolean} props.isPending
 * @param {boolean} props.isError
 * @param {any} props.error
 * @param {number} props.page
 * @param {(page: number) => void} props.setPage
 * @param {number} props.pageSize
 * @param {number} props.totalPages
 * @param {number} props.totalItems
 * @param {boolean} props.hasPrevious
 * @param {boolean} props.hasNext
 * @param {number} props.itemStart
 * @param {number} props.itemEnd
 * @param {() => void} props.handleNext
 * @param {() => void} props.handlePrevious
 * @param {() => void} props.refetch
 * @param {(item: object) => void} props.onItemClick
 * @returns {JSX.Element}
 */

import React from "react";
import ItemCardGrid from "../../item/components/ItemCardGrid";
import { useJobAddItemsModal } from "../hooks/useJobAddItemsModal";
import styles from "../styles/jobitemgridbox.module.css";
import JobAddItemsModal from "./JobAddItemsModal";

interface JobItemGridBoxProps {
    jobId: number | string;
    items: any[];
    isPending: boolean;
    isError: boolean;
    error: any;
    page: number;
    setPage: (page: number) => void;
    pageSize: number;
    totalPages: number;
    totalItems: number;
    hasPrevious: boolean;
    hasNext: boolean;
    itemStart: number;
    itemEnd: number;
    handleNext: () => void;
    handlePrevious: () => void;
    refetch: () => void;
    onItemClick: (item: object) => void;
}

/**
 * Logger for JobItemGridBox.
 *
 * @constant
 * @type {{info: Function, error: Function}}
 */
const logger = {
    info: (...args: any[]) => console.log("[JobItemGridBox]", ...args),
    error: (...args: any[]) => console.error("[JobItemGridBox]", ...args),
};

const JobItemGridBox: React.FC<JobItemGridBoxProps> = ({
    jobId,
    items,
    isPending,
    isError,
    error,
    page,
    setPage,
    pageSize,
    totalPages,
    totalItems,
    hasPrevious,
    hasNext,
    itemStart,
    itemEnd,
    handleNext,
    handlePrevious,
    refetch,
    onItemClick,
}) => {
    logger.info("JobItemGridBox rendered", {
        jobId,
        itemsCount: Array.isArray(items) ? items.length : 0,
        page,
        pageSize,
        totalItems,
    });

    const addItemsModal = useJobAddItemsModal();

    return (
        <div className={styles.container}>
            <div className={styles.headerRow}>
                <h3 className={styles.sectionTitle}>Items</h3>
                <button
                    className={styles.addItemsBtn}
                    type="button"
                    onClick={() => {
                        logger.info("Add Items button clicked", { jobId });
                        addItemsModal.openModal(jobId);
                    }}
                >
                    + Add Items
                </button>
            </div>

            <ItemCardGrid
                items={items}
                columns={5}
                rows={5}
                onItemClick={onItemClick}
                isPending={isPending}
                isError={isError}
                error={error}
                page={page}
                setPage={setPage}
                totalPages={totalPages}
                totalItems={totalItems}
                hasPrevious={hasPrevious}
                hasNext={hasNext}
                itemStart={itemStart}
                itemEnd={itemEnd}
                pageSize={pageSize}
                handleNext={handleNext}
                handlePrevious={handlePrevious}
                refetch={refetch}
            />

            <JobAddItemsModal
                open={addItemsModal.open}
                jobId={addItemsModal.jobId}
                onClose={addItemsModal.closeModal}
                onToggleItem={addItemsModal.toggleItem}
                isItemSelected={addItemsModal.isItemSelected}
                selectedCount={addItemsModal.selectedCount}
                onAddItems={addItemsModal.onAddItems}
                onOpenItemDetails={addItemsModal.onOpenItemDetails}
                isSaving={addItemsModal.isSaving}
                status={addItemsModal.status}
                error={addItemsModal.error}
            />
        </div>
    );
};

export default JobItemGridBox;