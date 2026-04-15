/**
 * AddItemsToJobModal.jsx
 *
 * Modal that shows an ItemSearchBox in "add" mode.
 * Single-click selects items; double-click opens item details.
 * A footer bar shows selected count and an "Add Items" button.
 *
 * @component
 * @param {object} props
 * @param {boolean} props.open
 * @param {() => void} props.onClose
 * @param {(item: object) => void} props.onToggleItem - Called on single-click to toggle selection.
 * @param {(itemId: number|string) => boolean} props.isItemSelected - Returns true if the item is selected.
 * @param {number} props.selectedCount
 * @param {() => void} props.onAddItems - Called when user clicks "Add Items".
 * @param {boolean} props.isSaving
 * @param {"idle"|"saving"|"saved"|"error"} props.status
 * @param {string|null} props.error
 * @returns {JSX.Element|null}
 */

import React from "react";
import ItemSearchBox from "../../itemsearchbox/components/ItemSearchBox";
import styles from "../styles/additemstojobmodal.module.css";

/**
 * Logger for AddItemsToJobModal.
 *
 * @constant
 * @type {{info: Function, error: Function}}
 */
const logger = {
    info: (...args) => console.log("[AddItemsToJobModal]", ...args),
    error: (...args) => console.error("[AddItemsToJobModal]", ...args),
};

const AddItemsToJobModal = ({
                                open,
                                onClose,
                                onToggleItem,
                                isItemSelected,
                                selectedCount,
                                onAddItems,
                                isSaving,
                                status,
                                error,
                            }) => {
    logger.info("AddItemsToJobModal rendered", { open, selectedCount, status });

    /**
     * handleOverlayClick
     * Closes modal when clicking outside the card.
     *
     * @function handleOverlayClick
     * @param {React.MouseEvent<HTMLDivElement>} event
     * @returns {void}
     */
    const handleOverlayClick = (event) => {
        if (event.target === event.currentTarget) {
            logger.info("Overlay clicked (closing modal)");
            onClose();
        }
    };

    /**
     * handleKeyDown
     * Escape closes the modal.
     *
     * @function handleKeyDown
     * @param {React.KeyboardEvent<HTMLDivElement>} event
     * @returns {void}
     */
    const handleKeyDown = (event) => {
        if (event.key === "Escape") {
            logger.info("Escape pressed (closing modal)");
            event.preventDefault();
            onClose();
        }
    };

    if (!open) return null;

    return (
        <div
            className={styles.modalOverlay}
            role="dialog"
            aria-modal="true"
            aria-label="Add items to job"
            onMouseDown={handleOverlayClick}
            onKeyDown={handleKeyDown}
            tabIndex={-1}
        >
            <div className={styles.modalCard}>
                <h2 className={styles.modalTitle}>Add Items to Job</h2>

                <div className={styles.searchBoxContainer}>
                    <ItemSearchBox
                        mode="add"
                        onItemClick={onToggleItem}
                        isItemSelected={isItemSelected}
                        columns={4}
                        rows={4}
                        pageSize={20}
                        sortField="name"
                        sortOrder="asc"
                        placeholder="Search items to add…"
                    />
                </div>

                {error ? (
                    <div className={styles.errorMsg}>{error}</div>
                ) : null}

                {status === "saved" ? (
                    <div className={styles.savedMsg}>Items added successfully</div>
                ) : null}

                <div className={styles.footerBar}>
                    <span className={styles.selectionCount}>
                        {selectedCount === 0
                            ? "No items selected"
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
                            disabled={selectedCount === 0 || isSaving}
                            aria-disabled={selectedCount === 0 || isSaving}
                        >
                            {isSaving
                                ? "Adding…"
                                : `Add Item${selectedCount !== 1 ? "s" : ""} (${selectedCount})`}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddItemsToJobModal;