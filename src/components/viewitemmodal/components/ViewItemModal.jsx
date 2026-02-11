/**
 * ViewItemModal
 * Read-only modal for displaying preview + full details of a selected item.
 * UI-only: all data fetching and merging is handled by useViewItemModal.
 *
 * @component
 * @param {object} props
 * @param {boolean} props.open - Whether the modal is currently open.
 * @param {function} props.onClose - Callback invoked when modal should close.
 * @param {boolean} props.isDetailsPending
 * @param {boolean} props.isDetailsError
 * @param {any} props.detailsError
 * @param {number|string|null} props.resolvedId
 * @param {string} props.resolvedName
 * @param {string} props.resolvedDescription
 * @param {string|null} props.resolvedCondition
 * @param {string} props.resolvedStorageDesc
 * @param {string|null} props.resolvedUpdatedBy
 * @param {string} props.resolvedDateAdded
 * @param {string} props.resolvedDateUpdated
 * @param {string[]} props.resolvedTags
 * @param {Array} props.resolvedJobs
 * @param {Array} props.resolvedComments
 * @param {Array} props.resolvedPhotos
 * @param {object|null} props.resolvedBuilding
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

const ViewItemModal = ({
                           open,
                           onClose,
                           isDetailsPending,
                           isDetailsError,
                           detailsError,
                           resolvedId,
                           resolvedName,
                           resolvedDescription,
                           resolvedCondition,
                           resolvedStorageDesc,
                           resolvedUpdatedBy,
                           resolvedDateAdded,
                           resolvedDateUpdated,
                           resolvedTags,
                           resolvedJobs,
                           resolvedComments,
                           resolvedPhotos,
                           resolvedBuilding,
                       }) => {
    if (!open) return null;

    const detailsErrorMessage =
        isDetailsError && detailsError
            ? detailsError.message || "Failed to load item details."
            : null;

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
                    {resolvedName || "Item Details"}
                </h2>

                <div className={styles.itemDetails}>
                    <div className={styles.fieldGroup}>
                        <span className={styles.fieldLabel}>ID</span>
                        <div className={styles.fieldValue}>
                            {resolvedId ?? "-"}
                        </div>
                    </div>

                    <div className={styles.fieldGroup}>
                        <span className={styles.fieldLabel}>Name</span>
                        <div className={styles.fieldValue}>
                            {resolvedName || "-"}
                        </div>
                    </div>

                    <div className={styles.fieldGroup}>
                        <span className={styles.fieldLabel}>Description</span>
                        <div
                            className={styles.fieldValue}
                            data-multiline="true"
                        >
                            {resolvedDescription || "-"}
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
                            {resolvedStorageDesc || "-"}
                        </div>
                    </div>

                    {resolvedBuilding && (
                        <div className={styles.fieldGroup}>
                            <span className={styles.fieldLabel}>Building</span>
                            <div className={styles.fieldValue}>
                                {resolvedBuilding.name || "-"}
                                {resolvedBuilding.address
                                    ? ` — ${resolvedBuilding.address}`
                                    : ""}
                            </div>
                        </div>
                    )}

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
                                {resolvedDateAdded || "-"}
                            </div>
                        </div>
                        <div className={styles.fieldInline}>
                            <span className={styles.fieldLabel}>
                                Last Updated
                            </span>
                            <div className={styles.fieldValue}>
                                {resolvedDateUpdated || "-"}
                            </div>
                        </div>
                    </div>

                    {resolvedJobs.length > 0 && (
                        <div className={styles.fieldGroup}>
                            <span className={styles.fieldLabel}>Jobs</span>
                            <div
                                className={styles.fieldValue}
                                data-multiline="true"
                            >
                                {resolvedJobs.map((job) => (
                                    <div
                                        key={job.jobId}
                                        className={styles.subRow}
                                    >
                                        <strong>{job.name}</strong>
                                        {job.client
                                            ? ` — ${job.client}`
                                            : null}
                                        {job.status
                                            ? ` [${job.status}]`
                                            : null}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {resolvedComments.length > 0 && (
                        <div className={styles.fieldGroup}>
                            <span className={styles.fieldLabel}>Comments</span>
                            <div
                                className={styles.fieldValue}
                                data-multiline="true"
                            >
                                {resolvedComments.map((c) => (
                                    <div
                                        key={c.id}
                                        className={styles.subRow}
                                    >
                                        {c.commentText}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {resolvedPhotos.length > 0 && (
                        <div className={styles.fieldGroup}>
                            <span className={styles.fieldLabel}>Photos</span>
                            <div className={styles.photosRow}>
                                {resolvedPhotos.map((p) => (
                                    <img
                                        key={p.photoId}
                                        src={p.url}
                                        alt={resolvedName || "Item photo"}
                                        className={styles.photoThumb}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    <div className={styles.metaRow}>
                        {isDetailsPending && (
                            <span className={styles.detailsLoading}>
                                Loading full details…
                            </span>
                        )}
                        {detailsErrorMessage && (
                            <span className={styles.detailsError}>
                                {detailsErrorMessage}
                            </span>
                        )}
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