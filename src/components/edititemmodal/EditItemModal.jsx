/**
 * EditItemModal.jsx
 *
 * Modal for editing an item's details: left side = photo preview with navigation, right side = editable fields as placeholders.
 * Now supports multi-photo navigation (dots and arrows) and responsive 75% modal size.
 *
 * @component
 * @param {object} props
 * @param {array} props.photos - Array of photo objects [{ photoId, url }]
 * @param {boolean} props.open - Modal open state
 * @param {function} props.onClose - Close handler for modal
 * @returns {JSX.Element|null}
 */
import React, { useState } from "react";
import styles from "./edititemmodal.module.css";
import SaveStatus from "../save/SaveStatus";

/**
 * logger for EditItemModal.
 * @constant
 */
const logger = {
    info: (...args) => console.log("[EditItemModal]", ...args),
    error: (...args) => console.error("[EditItemModal]", ...args),
};

/**
 * EditItemModal main component.
 * @param {object} props
 * @param {Array<{photoId:number, url:string}>} props.photos
 * @param {boolean} props.open
 * @param {function} props.onClose
 * @returns {JSX.Element|null}
 */
const EditItemModal = ({
                           photos = [],
                           open,
                           onClose,
                       }) => {
    logger.info("EditItemModal rendered", { photos, open });
    const [current, setCurrent] = useState(0);

    if (!open || !photos.length) return null;

    /**
     * Handles modal cancel/close.
     */
    const handleCancel = () => {
        logger.info("EditItemModal cancelled");
        onClose();
    };

    /**
     * Go to previous photo.
     */
    const handlePrev = () => {
        setCurrent((prev) => Math.max(prev - 1, 0));
    };

    /**
     * Go to next photo.
     */
    const handleNext = () => {
        setCurrent((prev) => Math.min(prev + 1, photos.length - 1));
    };

    /**
     * Select photo by index (dot click).
     * @param {number} idx
     */
    const handleSelect = (idx) => {
        setCurrent(idx);
    };

    const photo = photos[current];

    return (
        <div
            className={styles.modalOverlay}
            onClick={handleCancel}
            tabIndex={-1}
            aria-modal="true"
        >
            <div
                className={styles.modalCard}
                onClick={e => e.stopPropagation()}
                tabIndex={0}
                role="dialog"
                aria-modal="true"
                aria-labelledby="edit-item-modal-title"
            >
                <div className={styles.splitContainer}>
                    {/* Left: Photo Preview + controls */}
                    <div className={styles.photoPreviewCol}>
                        <div className={styles.photoPreviewWrapper}>
                            {photo?.url ? (
                                <img
                                    src={photo.url}
                                    alt="Item photo preview"
                                    className={styles.photoPreviewImg}
                                />
                            ) : (
                                <div className={styles.photoPreviewPlaceholder}>
                                    No Photo Available
                                </div>
                            )}

                            <div className={styles.photoNavWrapper}>
                                <button
                                    className={styles.arrowBtn}
                                    onClick={handlePrev}
                                    disabled={current === 0}
                                    aria-label="Previous photo"
                                    tabIndex={0}
                                >
                                    ◀
                                </button>
                                {photos.length > 1 && (
                                    <div className={styles.photoDotRow}>
                                        {photos.map((_, idx) => (
                                            <button
                                                key={idx}
                                                type="button"
                                                className={
                                                    styles.photoDot +
                                                    (idx === current ? ` ${styles.photoDotActive}` : "")
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
                                    className={styles.arrowBtn}
                                    onClick={handleNext}
                                    disabled={current === photos.length - 1}
                                    aria-label="Next photo"
                                    tabIndex={0}
                                >
                                    ▶
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Right: Editable placeholder fields */}
                    <div className={styles.fieldsCol}>
                        <h2 className={styles.itemTitle} id="edit-item-modal-title">
                            Edit Item
                        </h2>
                        <form className={styles.itemForm} onSubmit={e => e.preventDefault()}>
                            <div className={styles.fieldBlock}>
                                <label htmlFor="edit-item-title">Title</label>
                                <input
                                    id="edit-item-title"
                                    type="text"
                                    value="Minecraft Orange Character Print T-Shirt"
                                    className={styles.input}
                                    disabled
                                />
                            </div>
                            <div className={styles.fieldBlock}>
                                <label htmlFor="edit-item-price">Price</label>
                                <input
                                    id="edit-item-price"
                                    type="text"
                                    value="£6"
                                    className={styles.input}
                                    disabled
                                />
                            </div>
                            <div className={styles.fieldBlock}>
                                <label>Sizes</label>
                                <div className={styles.sizesRow}>
                                    {["4-5 Yrs", "5-6 Yrs", "7-8 Yrs", "9-10 Yrs", "10-11 Yrs", "11-12 Yrs", "13-14 Yrs"].map(size => (
                                        <button type="button" key={size} className={styles.sizeBtn} disabled>
                                            {size}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className={styles.fieldBlock}>
                                <label htmlFor="edit-item-description">Description</label>
                                <textarea
                                    id="edit-item-description"
                                    value="(Placeholder) Cool Minecraft T-Shirt, orange, kids sizes."
                                    className={styles.input}
                                    rows={3}
                                    disabled
                                />
                            </div>
                            <div className={styles.formActions}>
                                <button
                                    type="button"
                                    className={styles.saveButton}
                                    disabled
                                >
                                    Save
                                </button>
                                <button
                                    type="button"
                                    className={styles.cancelButton}
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