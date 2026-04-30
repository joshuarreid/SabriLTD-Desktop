import React from "react";
import SaveStatus from "../../../components/save/SaveStatus";
import ItemConditionField from "./ItemConditionField";
import ItemJobField from "./ItemJobField";
import ItemStorageField from "./ItemStorageField";
import ItemTagField from "./ItemTagField";
import styles from "../styles/edititemmodal.module.css";

interface EditItemFormProps {
    photo: { url: string } | null;
    current: number;
    photos: { url: string }[];
    handlePrev: () => void;
    handleNext: () => void;
    handleSelect: (idx: number) => void;
    handleCancel: () => void;
    isFirst: boolean;
    isLast: boolean;
    itemName: string;
    setItemName: (name: string) => void;
    itemDescription: string;
    setItemDescription: (desc: string) => void;
    conditionId: number | null;
    setConditionId: (id: number | null) => void;
    jobIds: number[];
    setJobIds: (ids: number[]) => void;
    storageId: number | null;
    setStorageId: (id: number | null) => void;
    storageDesc: string;
    setStorageDesc: (desc: string) => void;
    comments: string;
    setComments: (comments: string) => void;
    selectedCategoryId: number | null;
    setSelectedCategoryId: (id: number | null) => void;
    selectedTagIds: number[];
    setSelectedTagIds: (ids: number[]) => void;
    tagSearch: string;
    setTagSearch: (search: string) => void;
    handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
    isSaving: boolean;
    isSaved: boolean;
    isSaveError: boolean;
    saveStatus: string;
    apiError: string;
    itemTagFieldState: any;
}

/**
 * EditItemForm
 * Form for editing an inventory item. Extracted from the original EditItemModal.
 *
 * @component
 * @param {EditItemFormProps} props - Props passed from EditItemModal
 * @returns {JSX.Element}
 */
const EditItemForm: React.FC<EditItemFormProps> = ({
    photo,
    current,
    photos = [],
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
    itemTagFieldState
}) => {
    // Handlers for category and tag changes
    const handleCategoryChange = (categoryId: number | null) => {
        setSelectedCategoryId(categoryId);
        setSelectedTagIds([]);
        setTagSearch("");
    };
    const handleTagChange = (tagIds: number[]) => {
        setSelectedTagIds(tagIds);
    };
    // Only enable "Save" when all *required* fields except jobIds/comments are present
    const isFormReady = !!itemName && !!conditionId && !!storageId && selectedTagIds.length > 0;
    if (!photos.length) return null;
    const allowedSaveStatus = saveStatus === "saving" || saveStatus === "saved" ? saveStatus : undefined;
    return (
        <form onSubmit={handleSubmit} autoComplete="off" id="edit-item-modal-form" style={{ height: "100%" }}>
            {/* Image preview at the top */}
            <div className={styles.photoModernCardStyledTall} style={{ margin: "0 auto 32px auto" }}>
                <div className={styles.photoModernSquareFrameXXLTall}>
                    {photo?.url ? (
                        <img
                            src={photo.url}
                            alt="Item photo preview"
                            className={styles.photoModernSquareImgXXLTall}
                        />
                    ) : (
                        <div className={styles.photoModernPlaceholderXXL}>No Photo Available</div>
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
                        {photos.length > 1 && (
                            <div className={styles.photoModernSquareDotsXXL}>
                                {photos.map((_, idx) => (
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
            {/* All fields stacked vertically with reduced side padding */}
            <div style={{ width: "100%", boxSizing: "border-box", padding: "0 30px", display: "flex", flexDirection: "column", gap: 24 }}>
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
                            required
                        />
                    </div>
                    <div className={styles.fieldModernBlockXXLCompact}>
                        <label className={styles.labelModernXXL} htmlFor="edit-item-description">Description</label>
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
                            <ItemConditionField value={conditionId} onChange={setConditionId} />
                        </div>
                    </div>
                    <div className={styles.fieldModernBlockXXLCompact}>
                        <div className={styles.inputModernXXLCompact} style={{ padding: 0, border: "none", background: "none" }}>
                            <ItemJobField value={jobIds} onChange={setJobIds} />
                        </div>
                    </div>
                    <div className={styles.fieldModernBlockXXLCompact}>
                        {/* @ts-ignore: JSX component from JS file */}
                        <ItemStorageField value={storageId} onChange={setStorageId} />
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
                </div>
                <div className={styles.formPanelCardTagTall}>
                    <div className={styles.itemModernTitleXXL}>Tagging</div>
                    <ItemTagField
                        selectedCategoryId={selectedCategoryId}
                        selectedTagIds={selectedTagIds}
                        onCategoryChange={setSelectedCategoryId}
                        onTagChange={setSelectedTagIds}
                        itemTagFieldState={{
                            ...itemTagFieldState,
                            tagSearch,
                            setTagSearch,
                        }}
                    />
                </div>
                {/* Comments at the very bottom */}
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
                {/* Sticky Save/cancel bottom right -- always visible, scrolls with modal */}
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
            </div>
            <div className={styles.saveFeedback}>
                <SaveStatus status={allowedSaveStatus} />
                {apiError && (
                    <div className={styles.errorMessage}>{apiError}</div>
                )}
            </div>
        </form>
    );
};

export default EditItemForm;

