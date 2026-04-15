/**
 * JobItemGridBox.jsx
 *
 * UI component for the items section of JobDetailScreen.
 * Renders an "Add Items" button at the top that opens a modal
 * with ItemSearchBox in add mode for selecting items to add to the job.
 * Also renders the existing ItemCardGrid for items already on the job.
 *
 * @component
 * @param {object} props
 * @param {number|string} props.jobId - The current job's ID.
 * @param {Array<object>} props.items
 * @param {boolean} props.isPending
 * @param {boolean} props.isError
 * @param {any} props.error
 * @param {number} props.page
 * @param {(page: number) => void} props.setPage
 * @param {number} props.pageSize
 * @param {(pageSize: number) => void} props.setPageSize
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
import ItemCardGrid from "../../itemsearchbox/components/ItemCardGrid";

import { useAddItemsToJobModal } from "../hooks/useAddItemsToJobModal";
import styles from "../styles/jobitemgridbox.module.css";
import AddItemsToJobModal from "./AddItemToJobModal";

/**
 * Logger for JobItemGridBox.
 *
 * @constant
 * @type {{info: Function, error: Function}}
 */
const logger = {
    info: (...args) => console.log("[JobItemGridBox]", ...args),
    error: (...args) => console.error("[JobItemGridBox]", ...args),
};

const JobItemGridBox = ({
                            jobId,
                            items,
                            isPending,
                            isError,
                            error,
                            page,
                            setPage,
                            pageSize,
                            setPageSize,
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

    const addItemsModal = useAddItemsToJobModal({ jobId });

    return (
        <div className={styles.container}>
            <div className={styles.headerRow}>
                <h3 className={styles.sectionTitle}>Items</h3>
                <button
                    className={styles.addItemsBtn}
                    type="button"
                    onClick={() => {
                        logger.info("Add Items button clicked", { jobId });
                        addItemsModal.openModal();
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
                setPageSize={setPageSize}
                handleNext={handleNext}
                handlePrevious={handlePrevious}
                refetch={refetch}
            />

            <AddItemsToJobModal
                open={addItemsModal.open}
                jobId={jobId}
                onClose={addItemsModal.closeModal}
                onToggleItem={addItemsModal.toggleItem}
                isItemSelected={addItemsModal.isItemSelected}
                selectedCount={addItemsModal.selectedCount}
                onAddItems={addItemsModal.handleAddItems}
                onOpenItemDetails={onItemClick}
                isSaving={addItemsModal.isSaving}
                status={addItemsModal.status}
                error={addItemsModal.error}
            />
        </div>
    );
};

export default JobItemGridBox;