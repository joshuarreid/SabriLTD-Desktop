import React from "react";
import styles from "../styles/viewitemmodal.module.css";
import ItemConditionIcon from "../../itemconditionicon/ItemConditionIcon";
import TagInfoPill from "../../taginfopill/TagInfoPill";

const logger = {
    info: (...args) => console.log("[ViewItemModal]", ...args),
    error: (...args) => console.error("[ViewItemModal]", ...args),
};

/**
 * formatDisplayDate
 * Formats an ISO date/string into "Nov 16 2025 2:30pm" (local time).
 *
 * @param {string} value
 * @returns {string}
 */
const formatDisplayDate = (value) => {
    if (!value) return "";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;

    const month = d.toLocaleString("en-US", { month: "short" }); // Nov
    const day = d.getDate(); // 16
    const year = d.getFullYear(); // 2025

    let hours = d.getHours();
    const minutes = d.getMinutes().toString().padStart(2, "0");
    const ampm = hours >= 12 ? "pm" : "am";
    hours = hours % 12;
    if (hours === 0) hours = 12;

    return `${month} ${day} ${year} ${hours}:${minutes}${ampm}`;
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

    const handleOverlayClick = (e) => {
        e.stopPropagation();
        logger.info("Overlay clicked; closing ViewItemModal");
        onClose();
    };

    const handleCloseClick = (e) => {
        e.stopPropagation();
        logger.info("Close button clicked; closing ViewItemModal");
        onClose();
    };

    const storageWithBuilding = (() => {
        const base = resolvedStorageDesc || "";
        if (!resolvedBuilding) return base || "-";

        const buildingName = resolvedBuilding.name || "";
        const buildingAddress = resolvedBuilding.address || "";

        const buildingPart = buildingAddress
            ? `${buildingName} (${buildingAddress})`
            : buildingName;

        if (!base) return buildingPart || "-";

        return `${base} — ${buildingPart}`;
    })();

    const formattedDateAdded = resolvedDateAdded
        ? formatDisplayDate(resolvedDateAdded)
        : "";
    const formattedDateUpdated = resolvedDateUpdated
        ? formatDisplayDate(resolvedDateUpdated)
        : "";

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
                    {/* ID */}
                    <div className={styles.fieldGroup}>
                        <span className={styles.fieldLabel}>ID</span>
                        <div className={styles.fieldValue}>
                            {resolvedId ?? "-"}
                        </div>
                    </div>

                    {/* Name */}
                    <div className={styles.fieldGroup}>
                        <span className={styles.fieldLabel}>Name</span>
                        <div className={styles.fieldValue}>
                            {resolvedName || "-"}
                        </div>
                    </div>

                    {/* Description (left-aligned via data-multiline CSS) */}
                    <div className={styles.fieldGroup}>
                        <span className={styles.fieldLabel}>Description</span>
                        <div
                            className={styles.fieldValue}
                            data-multiline="true"
                        >
                            {resolvedDescription || "-"}
                        </div>
                    </div>

                    {/* Condition */}
                    <div className={styles.fieldGroup}>
                        <span className={styles.fieldLabel}>Condition</span>
                        <div className={styles.fieldValue}>
                            {resolvedCondition ? (
                                <ItemConditionIcon conditionName={resolvedCondition} />
                            ) : (
                                "-"
                            )}
                        </div>
                    </div>

                    {/* Storage (includes building) */}
                    <div className={styles.fieldGroup}>
                        <span className={styles.fieldLabel}>Storage</span>
                        <div className={styles.fieldValue}>
                            {storageWithBuilding}
                        </div>
                    </div>

                    {/* Tags */}
                    {resolvedTags.length > 0 && (
                        <div className={styles.fieldGroup}>
                            <span className={styles.fieldLabel}>Tags</span>
                            <div
                                className={`${styles.fieldValue} ${styles.tagsFieldValue}`}
                            >
                                <div className={styles.tagsPillRow}>
                                    {resolvedTags.map((tag) => (
                                        <TagInfoPill key={tag} label={tag} />
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Updated By */}
                    <div className={styles.fieldGroup}>
                        <span className={styles.fieldLabel}>Updated By</span>
                        <div className={styles.fieldValue}>
                            {resolvedUpdatedBy || "-"}
                        </div>
                    </div>

                    {/* Dates (formatted) */}
                    <div className={styles.fieldInlineRow}>
                        <div className={styles.fieldInline}>
                            <span className={styles.fieldLabel}>
                                Date Added
                            </span>
                            <div className={styles.fieldValue}>
                                {formattedDateAdded || "-"}
                            </div>
                        </div>
                        <div className={styles.fieldInline}>
                            <span className={styles.fieldLabel}>
                                Last Updated
                            </span>
                            <div className={styles.fieldValue}>
                                {formattedDateUpdated || "-"}
                            </div>
                        </div>
                    </div>

                    {/* Jobs */}
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

                    {/* Comments */}
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

                    {/* Photos */}
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

                    {/* Meta row: loading / error */}
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