/**
 * EditItemModal.jsx
 *
 * Modal for editing or creating an item, nearly full screen.
 * Photo preview on left, fields right. Save/cancel in bottom right.
 * Close "x" button in top left.
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

    // --- Item form wireframe state (only input/textarea wired for now) ---
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
                aria-labelledby="edit-item-modal-title"
            >
                {/* Close "X" button */}
                <button
                    type="button"
                    className={styles.closeButtonTopLeft}
                    onClick={handleCancel}
                    title="Close"
                    aria-label="Close modal"
                >
                    &times;
                </button>
                <div className={styles.splitModernContainerXXL}>
                    {/* Left: Modern square photo preview with nav controls */}
                    <div className={styles.photoModernColXXL}>
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
                    {/* Right: Form wireframe */}
                    <div className={styles.fieldsModernColXXLCompact}>
                        <form className={styles.itemModernFormXXLCompact} onSubmit={e => e.preventDefault()}>
                            <div className={styles.itemModernTitleXXL}>Edit Item</div>
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
                                <label className={styles.labelModernXXL} htmlFor="edit-item-description">Description</label>
                                <textarea
                                    id="edit-item-description"
                                    placeholder="Enter a longer description for this item"
                                    value={itemDescription}
                                    onChange={e => setItemDescription(e.target.value)}
                                    className={styles.inputModernXXLCompact}
                                    rows={2}
                                />
                            </div>
                            <div className={styles.fieldModernBlockXXLCompact}>
                                <label className={styles.labelModernXXL}>Condition</label>
                                <div className={styles.inputModernXXLCompact} style={{ opacity: 0.5 }}>
                                    [Condition dropdown placeholder]
                                </div>
                            </div>
                            <div className={styles.fieldModernBlockXXLCompact}>
                                <label className={styles.labelModernXXL}>Jobs</label>
                                <div className={styles.inputModernXXLCompact} style={{ opacity: 0.5 }}>
                                    [Job dropdown with search placeholder]
                                </div>
                            </div>
                            <div className={styles.fieldModernBlockXXLCompact}>
                                <label className={styles.labelModernXXL}>Storage</label>
                                <div className={styles.inputModernXXLCompact} style={{ opacity: 0.5 }}>
                                    [Storage dropdown placeholder]
                                </div>
                            </div>
                            <div className={styles.fieldModernBlockXXLCompact}>
                                <label className={styles.labelModernXXL} htmlFor="edit-item-storage-desc">Storage Description</label>
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
                            <div className={styles.fieldModernBlockXXLCompact}>
                                <label className={styles.labelModernXXL}>Tag Category</label>
                                <div className={styles.inputModernXXLCompact} style={{ opacity: 0.5 }}>
                                    [Tag category dropdown placeholder]
                                </div>
                            </div>
                            <div className={styles.fieldModernBlockXXLCompact}>
                                <label className={styles.labelModernXXL}>Tags</label>
                                <button type="button" className={styles.inputModernXXLCompact} style={{ opacity: 0.5 }}>
                                    [Tags modal placeholder]
                                </button>
                            </div>
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
                            {/* The Save/Cancel actions are absolutely placed bottom right of the modal */}
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
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EditItemModal;