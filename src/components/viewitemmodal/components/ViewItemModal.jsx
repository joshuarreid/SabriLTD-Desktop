/**
 * ViewItemModal
 * Read-only modal for displaying details of a selected inventory item.
 *
 * @component
 * @param {object} props
 * @param {object|null} props.item - The item to display.
 * @param {boolean} props.open - Whether the modal is currently open.
 * @param {function} props.onClose - Callback invoked when modal should close.
 * @returns {JSX.Element|null}
 */

import React from "react";
import styles from "../styles/viewitemmodal.module.css";

/**
 * Logger for ViewItemModal.
 *
 * @constant
 * @type {{info: Function, error: Function}}
 */
const logger = {
    info: (...args) => console.log("[ViewItemModal]", ...args),
    error: (...args) => console.error("[ViewItemModal]", ...args),
};

const ViewItemModal = ({ item, open, onClose }) => {
    if (!open || !item) return null;

    /**
     * Handles clicking on the overlay to close the modal.
     *
     * @function handleOverlayClick
     * @param {React.MouseEvent<HTMLDivElement>} e
     * @returns {void}
     */
    const handleOverlayClick = (e) => {
        e.stopPropagation();
        logger.info("Overlay clicked; closing ViewItemModal");
        onClose();
    };

    /**
     * Handles clicking the Close button.
     *
     * @function handleCloseClick
     * @param {React.MouseEvent<HTMLButtonElement>} e
     * @returns {void}
     */
    const handleCloseClick = (e) => {
        e.stopPropagation();
        logger.info("Close button clicked; closing ViewItemModal");
        onClose();
    };

    const {
        itemId,
        id,
        name,
        description,
        condition,
        conditionName,
        storageDesc,
        updatedBy,
        dateAdded,
        dateUpdated,
        tags,
    } = item;

    const resolvedId = itemId ?? id ?? null;

    const resolvedCondition =
        conditionName ||
        (condition && (condition.name || condition)) ||
        null;

    const resolvedTags =
        tags && Array.isArray(tags)
            ? tags
                .map((t) => (typeof t === "string" ? t : t.name))
                .filter(Boolean)
            : [];

    const resolvedUpdatedBy =
        updatedBy && typeof updatedBy === "object"
            ? updatedBy.name || updatedBy.email || updatedBy.userId
            : updatedBy || null;

    return (
        <div
            className={styles.modalOverlay}
            onClick={handleOverlayClick}
            tabIndex={-1}
            aria-modal="true"
            role="presentation"
        >
            <div
                className={styles.modalCard}
                onClick={(e) => e.stopPropagation()}
                tabIndex={0}
                role="dialog"
                aria-modal="true"
                aria-labelledby="view-item-modal-title"
            >
                <h2 className={styles.modalTitle} id="view-item-modal-title">
                    {name || "Item Details"}
                </h2>

                <div className={styles.itemDetails}>
                    {/* ID field */}
                    <div className={styles.fieldGroup}>
                        <span className={styles.fieldLabel}>ID</span>
                        <div className={styles.fieldValue}>
                            {resolvedId ?? "-"}
                        </div>
                    </div>

                    <div className={styles.fieldGroup}>
                        <span className={styles.fieldLabel}>Name</span>
                        <div className={styles.fieldValue}>
                            {name || "-"}
                        </div>
                    </div>

                    <div className={styles.fieldGroup}>
                        <span className={styles.fieldLabel}>Description</span>
                        <div
                            className={styles.fieldValue}
                            data-multiline="true"
                        >
                            {description || "-"}
                        </div>
                    </div>

                    <div className={styles.fieldGroup}>
                        <span className={styles.fieldLabel}>Condition</span>
                        <div className={styles.fieldValue}>
                            {resolvedCondition || "-"}
                        </div>
                    </div>

                    <div className={styles.fieldGroup}>
                        <span className={styles.fieldLabel}>Storage</span>
                        <div className={styles.fieldValue}>
                            {storageDesc || "-"}
                        </div>
                    </div>

                    {resolvedTags.length > 0 && (
                        <div className={styles.fieldGroup}>
                            <span className={styles.fieldLabel}>Tags</span>
                            <div className={styles.fieldValue}>
                                {resolvedTags.join(", ")}
                            </div>
                        </div>
                    )}

                    <div className={styles.fieldGroup}>
                        <span className={styles.fieldLabel}>Updated By</span>
                        <div className={styles.fieldValue}>
                            {resolvedUpdatedBy || "-"}
                        </div>
                    </div>

                    <div className={styles.fieldInlineRow}>
                        <div className={styles.fieldInline}>
                            <span className={styles.fieldLabel}>
                                Date Added
                            </span>
                            <div className={styles.fieldValue}>
                                {dateAdded || "-"}
                            </div>
                        </div>
                        <div className={styles.fieldInline}>
                            <span className={styles.fieldLabel}>
                                Last Updated
                            </span>
                            <div className={styles.fieldValue}>
                                {dateUpdated || "-"}
                            </div>
                        </div>
                    </div>
                </div>

                <div className={styles.actions}>
                    <button
                        type="button"
                        className={styles.closeButton}
                        onClick={handleCloseClick}
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ViewItemModal;