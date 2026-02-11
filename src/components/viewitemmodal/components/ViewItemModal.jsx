/**
 * ViewItemModal
 * Read-only modal for displaying preview + full details of a selected item.
 * Opens instantly with preview data and hydrates remaining fields via
 * GET /api/items/{itemId}/details using the canonical itemKeys.details pattern.
 *
 * @component
 * @param {object} props
 * @param {object|null} props.previewItem - Lightweight item from search/grid (may be null).
 * @param {number|string|null} props.itemId - Selected itemId to fetch details for.
 * @param {boolean} props.open - Whether the modal is currently open.
 * @param {function} props.onClose - Callback invoked when modal should close.
 * @returns {JSX.Element|null}
 */

import React from "react";
import { useQuery } from "@tanstack/react-query";
import styles from "../styles/viewitemmodal.module.css";
import itemKeys from "../../../api/item/ItemQueryKeys";
import { getItemDetails } from "../../../api/item/item";

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

const ViewItemModal = ({ previewItem, itemId, open, onClose }) => {
    if (!open || (!previewItem && !itemId)) return null;

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

    /**
     * Item details query.
     * Uses the same queryKey pattern and fetcher as the rest of the project:
     *   - queryKey: itemKeys.details(itemId)
     *   - queryFn:  () => getItemDetails(itemId)
     */
    const {
        data: details,
        isPending: isDetailsPending,
        isError: isDetailsError,
        error: detailsError,
    } = useQuery({
        queryKey: itemKeys.details(itemId),
        enabled: Boolean(itemId),
        queryFn: async () => {
            logger.info("ViewItemModal fetching item details", { itemId });
            return getItemDetails(itemId);
        },
        // Align with your desired cache lifetime for details
        staleTime: 10 * 60 * 1000, // 10 minutes
    });

    // --- Merge preview + details to display ---

    const resolvedId =
        (details && details.itemId) ??
        (previewItem && (previewItem.itemId ?? previewItem.id)) ??
        null;

    const resolvedName =
        (details && details.name) || (previewItem && previewItem.name) || "";

    const resolvedDescription =
        (details && details.description) ||
        (previewItem && previewItem.description) ||
        "";

    const resolvedCondition =
        (details && details.condition && details.condition.name) ||
        (previewItem &&
            (previewItem.conditionName ||
                previewItem.condition ||
                (previewItem.condition && previewItem.condition.name))) ||
        null;

    const resolvedStorageDesc =
        (details && details.storageDesc) ||
        (previewItem && previewItem.storageDesc) ||
        "";

    const resolvedUpdatedBy =
        (details &&
            details.updatedBy &&
            (details.updatedBy.name ||
                details.updatedBy.email ||
                details.updatedBy.userId)) ||
        (previewItem && previewItem.updatedBy) ||
        null;

    const resolvedDateAdded =
        (details && details.dateAdded) ||
        (previewItem && previewItem.dateAdded) ||
        "";

    const resolvedDateUpdated =
        (details && details.dateUpdated) ||
        (previewItem && previewItem.dateUpdated) ||
        "";

    const resolvedTagsFromDetails =
        details && Array.isArray(details.tags)
            ? details.tags
                .map((t) =>
                    typeof t === "string"
                        ? t
                        : t && typeof t === "object"
                            ? t.name
                            : null,
                )
                .filter(Boolean)
            : [];

    const resolvedTagsFromPreview =
        previewItem && Array.isArray(previewItem.tags)
            ? previewItem.tags.map((t) =>
                typeof t === "string"
                    ? t
                    : t && typeof t === "object"
                        ? t.name
                        : null,
            )
            : [];

    const resolvedTags =
        resolvedTagsFromDetails.length > 0
            ? resolvedTagsFromDetails
            : resolvedTagsFromPreview.filter(Boolean);

    const resolvedJobs =
        details && Array.isArray(details.jobs) ? details.jobs : [];

    const resolvedComments =
        details && Array.isArray(details.comments) ? details.comments : [];

    const resolvedPhotos =
        details && Array.isArray(details.photos) ? details.photos : [];

    const resolvedBuilding =
        details && details.buildingWithStorage ? details.buildingWithStorage : null;

    const detailsErrorMessage =
        isDetailsError && detailsError
            ? detailsError.message || "Failed to load item details."
            : null;

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
                            <span className={styles.fieldLabel}>
                                Building
                            </span>
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