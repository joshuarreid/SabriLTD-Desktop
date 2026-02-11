/**
 * EditItemModal.jsx
 *
 * Modal layout for dashboard item editing:
 * - General Information, Photo, and two vertical columns.
 * - Left stacks: General, Associations, Tag/Category.
 * - Right stacks: Photo, Comments.
 * Follows Bulletproof React, logging, and JSDoc standards.
 */

import React from "react";
import styles from "../styles/edititemmodal.module.css";
import SaveStatus from "../../save/SaveStatus";
import { useEditItemModal } from "../hooks/useEditItemModal";
import ItemConditionField from "./ItemConditionField";
import ItemJobField from "./ItemJobField";
import ItemStorageField from "./ItemStorageField";
import ItemTagField from "./ItemTagField";
import useItemTagField from "../hooks/useItemTagField";

/**
 * logger for EditItemModal.
 * @constant
 */
const logger = {
    info: (...args) => console.log("[EditItemModal]", ...args),
    error: (...args) => console.error("[EditItemModal]", ...args),
};

/**
 * EditItemModal
 * UI-only modal for editing an inventory item (Bulletproof React).
 *
 * @component
 * @param {Object} props
 * @param {Array<{url?: string}>} [props.photos=[]] - Photos to preview.
 * @param {boolean} props.open - Whether the modal is open.
 * @param {Function} props.onClose - Callback for cancel/close.
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
        itemName, setItemName,
        itemDescription, setItemDescription,
        conditionId, setConditionId,
        jobIds, setJobIds,
        storageId, setStorageId,
        storageDesc, setStorageDesc,
        comments, setComments,
        selectedCategoryId, setSelectedCategoryId,
        selectedTagIds, setSelectedTagIds,
        tagSearch, setTagSearch,
        handleSubmit,
        isSaving,
        isSaved,
        isSaveError,
        saveStatus,
        apiError,
    } = useEditItemModal({ photos, open, onClose });

    // Tag field state (query logic is in own hook)
    const itemTagFieldState = useItemTagField({ selectedCategoryId, tagSearch });

    /**
     * Handles category selection.
     * @param {number} categoryId
     */
    const handleCategoryChange = (categoryId) => {
        logger.info("Category changed in modal", categoryId);
        setSelectedCategoryId(categoryId);
        setSelectedTagIds([]);
        setTagSearch("");
    };

    /**
     * Handles tag selection/removal.
     * @param {number[]} tagIds
     */
    const handleTagChange = (tagIds) => {
        logger.info("Tag selection changed", tagIds);
        setSelectedTagIds(tagIds);
    };

    // Only enable "Save" when all *required* fields except jobIds/comments are present
    const isFormReady =
        !!itemName &&
        !!conditionId &&
        !!storageId &&
        selectedTagIds.length > 0;

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
                {/* Scrollable content wrapper */}
                <div className={styles.contentArea}>
                    <form onSubmit={handleSubmit} autoComplete="off" id="edit-item-modal-form">
                        {/* Two vertical columns */}
                        <div className={styles.twoPaneGrid}>
                            {/* Left column: General + Associations + Tag/Category */}
                            <div className={styles.leftColumnStack}>
                                <div className={styles.formPanelCardGeneral}>
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
                                            className={styles.inputModernXXLDescription}
                                            rows={5}
                                        />
                                    </div>
                                </div>
                                <div className={styles.formPanelCard}>
                                    <div className={styles.fieldModernBlockXXLCompact}>
                                        <div className={styles.inputModernXXLCompact} style={{ padding: 0, border: "none", background: "none" }}>
                                            <ItemConditionField
                                                value={conditionId}
                                                onChange={setConditionId}
                                            />
                                        </div>
                                    </div>
                                    <div className={styles.fieldModernBlockXXLCompact}>
                                        <div className={styles.inputModernXXLCompact} style={{ padding: 0, border: "none", background: "none" }}>
                                            <ItemJobField
                                                value={jobIds}
                                                onChange={setJobIds}
                                            />
                                        </div>
                                    </div>
                                    <div className={styles.fieldModernBlockXXLCompact}>
                                        <ItemStorageField
                                            value={storageId}
                                            onChange={setStorageId}
                                        />
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
                                {/* Tagging (Category + Tags) */}
                                <div className={styles.formPanelCardTagTall} style={{ marginTop: "2rem" }}>
                                    <div className={styles.itemModernTitleXXL}>Tagging</div>
                                    <ItemTagField
                                        selectedCategoryId={selectedCategoryId}
                                        selectedTagIds={selectedTagIds}
                                        onCategoryChange={handleCategoryChange}
                                        onTagChange={handleTagChange}
                                        itemTagFieldState={{
                                            ...itemTagFieldState,
                                            tagSearch,
                                            setTagSearch,
                                        }}
                                    />
                                </div>
                            </div>
                            {/* Right column: Photo + Comments fills remaining height */}
                            <div className={styles.rightColumnStack}>
                                <div className={styles.photoModernCardStyledTall}>
                                    <div className={styles.photoModernSquareFrameXXLTall}>
                                        {photo?.url ? (
                                            <img
                                                src={photo.url}
                                                alt="Item photo preview"
                                                className={styles.photoModernSquareImgXXLTall}
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
                                                type="button"
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
                                                type="button"
                                            >
                                                <span>&#9654;</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                {/* Comments */}
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
                        {/* Save/cancel bottom right -- keep button inside .form so Enter works */}
                        <div className={styles.modernFormActionRowXXLCompact}>
                            <button
                                type="submit"
                                className={styles.saveModernButtonXXLCompact}
                                disabled={!isFormReady || isSaving}
                            >
                                {isSaving ? "Saving…" : "Save"}
                            </button>
                            <button
                                type="button"
                                className={styles.cancelModernButtonXXLCompact}
                                onClick={handleCancel}
                                disabled={isSaving}
                            >
                                Cancel
                            </button>
                        </div>
                        <div className={styles.saveFeedback}>
                            <SaveStatus status={saveStatus} />
                            {apiError && (
                                <div className={styles.errorMessage}>
                                    {apiError}
                                </div>
                            )}
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default EditItemModal;