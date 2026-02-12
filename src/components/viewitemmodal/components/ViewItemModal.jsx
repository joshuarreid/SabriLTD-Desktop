import React from "react";
import styles from "../styles/viewitemmodal.module.css";
import ItemConditionIcon from "../../itemconditionicon/ItemConditionIcon";
import TagInfoPill from "../../taginfopill/TagInfoPill";
import PhotoPreview from "./PhotoPreview";
import HorizontalJobBox from "./HorizontalJobBox";

/**
 * Logger for ViewItemModal.
 * @constant
 * @type {{info: Function, error: Function}}
 */
const logger = {
    info: (...args) => console.log("[ViewItemModal]", ...args),
    error: (...args) => console.error("[ViewItemModal]", ...args),
};

/**
 * formatDisplayDate
 * Formats an ISO date/string into "Nov 16 2025 2:30pm" (local time).
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

/**
 * ViewItemModal
 * Read-only modal for displaying preview + full details of a selected item.
 * UI-only: all data fetching and merging is handled by useViewItemModal.
 *
 * @component
 */
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
     * Builds a combined storage display string including building information.
     * @constant
     * @type {string}
     */
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

                {/* Top section: 2/3 photos, 1/3 fields (commerce-style layout) */}
                <div className={styles.topRow}>
                    {/* Left: main photo area (2/3) */}
                    <PhotoPreview photos={resolvedPhotos} itemName={resolvedName} />

                    {/* Right: key fields (1/3) */}
                    <div className={styles.rightColumn}>
                        <div className={styles.fieldGroup}>
                            <span className={styles.fieldLabel}>Name</span>
                            <div className={styles.fieldValue}>
                                {resolvedName || "-"}
                            </div>
                        </div>

                        <div className={styles.fieldGroup}>
                            <span className={styles.fieldLabel}>
                                Description
                            </span>
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
                                {resolvedCondition ? (
                                    <ItemConditionIcon
                                        conditionName={resolvedCondition}
                                    />
                                ) : (
                                    "-"
                                )}
                            </div>
                        </div>

                        <div className={styles.fieldGroup}>
                            <span className={styles.fieldLabel}>Storage</span>
                            <div className={styles.fieldValue}>
                                {storageWithBuilding}
                            </div>
                        </div>

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

                        <div className={styles.fieldGroup}>
                            <span className={styles.fieldLabel}>
                                Updated By
                            </span>
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
                    </div>
                </div>

                {/* Jobs field (horizontal box, paginated) */}
                {resolvedJobs.length > 0 && (
                    <div className={styles.fieldGroup}>
                        <HorizontalJobBox jobs={resolvedJobs} />
                    </div>
                )}

                {/* Comments and meta */}
                <div className={styles.itemDetails}>

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