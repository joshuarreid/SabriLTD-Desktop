/**
 * EditItemModal.jsx
 *
 * Modal for editing or creating an item, full-width, clean card-panel layout.
 * Arrangement directly mirrors the provided reference (screenshot 8).
 * - Photo/media preview card at top-left (not inside field grid)
 * - General, Associations, Tagging, Comments below as horizontally-aligned cards
 * - Save/Cancel at bottom right, Close "x" top left.
 * All fields and buttons maintain compact, modern style conventions.
 *
 * @component
 * @param {object} props
 * @param {array} props.photos - Array of photo objects [{ photoId, url }]
 * @param {boolean} props.open - Modal open state
 * @param {function} props.onClose - Close handler for modal
 * @returns {JSX.Element|null}
 */

import React from "react";
import styles from "./edititemmodal.module.css";
import SaveStatus from "../save/SaveStatus";
import { useEditItemModal } from "./useEditItemModal";

/**
 * logger for EditItemModal.
 * @constant
 */
const logger = {
    info: (...args) => console.log("[EditItemModal]", ...args),
    error: (...args) => console.error("[EditItemModal]", ...args),
};

const conditionPlaceholder = "[Condition dropdown placeholder]";
const jobPlaceholder = "[Job dropdown with search placeholder]";
const storagePlaceholder = "[Storage dropdown placeholder]";
const tagCategoryPlaceholder = "[Tag category dropdown placeholder]";
const tagsPlaceholder = "[Tags modal placeholder]";

/**
 * EditItemModal
 * Main modal UI for edit/create item, screenshot-matched arrangement.
 *
 * @param {object} props
 * @param {array} props.photos
 * @param {boolean} props.open
 * @param {function} props.onClose
 * @returns {JSX.Element|null}
 */
const EditItemModal = ({ photos = [], open, onClose }) => {
    logger.info("EditItemModal rendered", { photos, open });

    const {
        photo,
        current,
        photos: allPhotos,
        handlePrev,
        handleNext,
        handleSelect,
        handleCancel,
        isFirst,
        isLast,
    } = useEditItemModal({ photos, open, onClose });

    const [itemName, setItemName] = React.useState("");
    const [itemDescription, setItemDescription] = React.useState("");
    const [storageDesc, setStorageDesc] = React.useState("");
    const [comments, setComments] = React.useState("");

    if (!open || !allPhotos.length) return null;

    return (
        <div
            className={styles.modalOverlay}
            onClick={handleCancel}
            tabIndex={-1}
            aria-modal="true"
        >
            <div
                className={styles.modalCardXXLCompact}
                onClick={e => e.stopPropagation()}
                tabIndex={0}
                role="dialog"
                aria-modal="true"
            >
                {/* Close X */}
                <button
                    type="button"
                    className={styles.closeButtonTopLeft}
                    onClick={handleCancel}
                    title="Close"
                    aria-label="Close modal"
                >
                    &times;
                </button>
                <div className={styles.mainGridPanelsLayout}>
                    {/* Top row: Photo/media card (only) */}
                    <div className={styles.panelRowPhotoOnly}>
                        <div className={styles.photoModernCardStyled}>
                            <div className={styles.photoModernSquareFrameXXL}>
                                {photo?.url ? (
                                    <img
                                        src={photo.url}
                                        alt="Item photo preview"
                                        className={styles.photoModernSquareImgXXL}
                                    />
                                ) : (
                                    <div className={styles.photoModernPlaceholderXXL}>
                                        No Photo Available
                                    </div>
                                )}
                                <div className={styles.photoModernSquareNavXXL}>
                                    <button
                                        className={styles.photoModernSquareArrowXXL}
                                        onClick={handlePrev}
                                        disabled={isFirst}
                                        aria-label="Previous photo"
                                        tabIndex={0}
                                    >
                                        <span>&#9664;</span>
                                    </button>
                                    {allPhotos.length > 1 && (
                                        <div className={styles.photoModernSquareDotsXXL}>
                                            {allPhotos.map((_, idx) => (
                                                <span
                                                    key={idx}
                                                    className={
                                                        styles.photoModernSquareDotXXL +
                                                        (idx === current ? ` ${styles.photoModernSquareDotActiveXXL}` : "")
                                                    }
                                                    onClick={() => handleSelect(idx)}
                                                    aria-label={
                                                        idx === current
                                                            ? `Photo ${idx + 1} (current)`
                                                            : `Go to photo ${idx + 1}`
                                                    }
                                                    tabIndex={0}
                                                />
                                            ))}
                                        </div>
                                    )}
                                    <button
                                        className={styles.photoModernSquareArrowXXL}
                                        onClick={handleNext}
                                        disabled={isLast}
                                        aria-label="Next photo"
                                        tabIndex={0}
                                    >
                                        <span>&#9654;</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* Second row: General, Associations */}
                    <div className={styles.panelRowGrid}>
                        <div className={styles.formPanelCard}>
                            <div className={styles.itemModernTitleXXL}>General Information</div>
                            <div className={styles.fieldModernBlockXXLCompact}>
                                <label className={styles.labelModernXXL} htmlFor="edit-item-title">Title</label>
                                <input
                                    id="edit-item-title"
                                    type="text"
                                    placeholder="Enter item name"
                                    value={itemName}
                                    onChange={e => setItemName(e.target.value)}
                                    className={styles.inputModernXXLCompact}
                                    autoComplete="off"
                                />
                            </div>
                            <div className={styles.fieldModernBlockXXLCompact}>
                                <label className={styles.labelModernXXL} htmlFor="edit-item-description">
                                    Description
                                </label>
                                <textarea
                                    id="edit-item-description"
                                    placeholder="Enter a longer description for this item"
                                    value={itemDescription}
                                    onChange={e => setItemDescription(e.target.value)}
                                    className={styles.inputModernXXLCompact}
                                    rows={2}
                                />
                            </div>
                        </div>
                        <div className={styles.formPanelCard}>
                            <div className={styles.itemModernTitleXXL}>Associations</div>
                            <div className={styles.fieldModernBlockXXLCompact}>
                                <label className={styles.labelModernXXL}>Condition</label>
                                <div className={styles.inputModernXXLCompact} style={{ opacity: 0.5 }}>
                                    {conditionPlaceholder}
                                </div>
                            </div>
                            <div className={styles.fieldModernBlockXXLCompact}>
                                <label className={styles.labelModernXXL}>Jobs</label>
                                <div className={styles.inputModernXXLCompact} style={{ opacity: 0.5 }}>
                                    {jobPlaceholder}
                                </div>
                            </div>
                            <div className={styles.fieldModernBlockXXLCompact}>
                                <label className={styles.labelModernXXL}>Storage</label>
                                <div className={styles.inputModernXXLCompact} style={{ opacity: 0.5 }}>
                                    {storagePlaceholder}
                                </div>
                            </div>
                            <div className={styles.fieldModernBlockXXLCompact}>
                                <label className={styles.labelModernXXL} htmlFor="edit-item-storage-desc">
                                    Storage Description
                                </label>
                                <input
                                    id="edit-item-storage-desc"
                                    type="text"
                                    placeholder="Enter storage location/notes"
                                    value={storageDesc}
                                    onChange={e => setStorageDesc(e.target.value)}
                                    className={styles.inputModernXXLCompact}
                                    autoComplete="off"
                                />
                            </div>
                        </div>
                    </div>
                    {/* Third row: Tagging, Comments */}
                    <div className={styles.panelRowGrid}>
                        <div className={styles.formPanelCard}>
                            <div className={styles.itemModernTitleXXL}>Tagging</div>
                            <div className={styles.fieldModernBlockXXLCompact}>
                                <label className={styles.labelModernXXL}>Tag Category</label>
                                <div className={styles.inputModernXXLCompact} style={{ opacity: 0.5 }}>
                                    {tagCategoryPlaceholder}
                                </div>
                            </div>
                            <div className={styles.fieldModernBlockXXLCompact}>
                                <label className={styles.labelModernXXL}>Tags</label>
                                <button type="button"
                                        className={styles.inputModernXXLCompact}
                                        style={{ opacity: 0.5 }}>
                                    {tagsPlaceholder}
                                </button>
                            </div>
                        </div>
                        <div className={styles.formPanelCard}>
                            <div className={styles.itemModernTitleXXL}>Comments</div>
                            <div className={styles.fieldModernBlockXXLCompact}>
                                <label className={styles.labelModernXXL} htmlFor="edit-item-comments">Comments</label>
                                <input
                                    id="edit-item-comments"
                                    type="text"
                                    placeholder="Add comments"
                                    value={comments}
                                    onChange={e => setComments(e.target.value)}
                                    className={styles.inputModernXXLCompact}
                                    autoComplete="off"
                                />
                            </div>
                        </div>
                    </div>
                </div>
                {/* Bottom-right save/cancel */}
                <div className={styles.modernFormActionRowXXLCompact}>
                    <button
                        type="submit"
                        className={styles.saveModernButtonXXLCompact}
                        disabled
                    >
                        Save
                    </button>
                    <button
                        type="button"
                        className={styles.cancelModernButtonXXLCompact}
                        onClick={handleCancel}
                    >
                        Cancel
                    </button>
                </div>
                <div className={styles.saveFeedback}>
                    <SaveStatus status={"idle"} />
                </div>
            </div>
        </div>
    );
};

export default EditItemModal;