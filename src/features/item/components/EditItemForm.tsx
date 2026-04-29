import React from "react";
import SaveStatus from "../../../components/save/SaveStatus";
import ItemConditionField from "./ItemConditionField";
import ItemJobField from "./ItemJobField";
import ItemStorageField from "./ItemStorageField";
import ItemTagField from "./ItemTagField";

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
    return (
        <form onSubmit={handleSubmit} autoComplete="off" id="edit-item-modal-form">
            <div style={{ display: "flex", flexDirection: "row", gap: 24 }}>
                {/* Left column: General + Associations + Tag/Category */}
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 16 }}>
                    {/* General fields */}
                    <input
                        type="text"
                        placeholder="Enter item name"
                        value={itemName}
                        onChange={e => setItemName(e.target.value)}
                        autoComplete="off"
                        required
                    />
                    <textarea
                        placeholder="Enter a longer description for this item"
                        value={itemDescription}
                        onChange={e => setItemDescription(e.target.value)}
                        rows={5}
                    />
                    <ItemConditionField value={conditionId} onChange={setConditionId} />
                    <ItemJobField value={jobIds} onChange={setJobIds} />
                    <ItemStorageField value={storageId} onChange={setStorageId} />
                    <input
                        type="text"
                        placeholder="Enter storage location/notes"
                        value={storageDesc}
                        onChange={e => setStorageDesc(e.target.value)}
                        autoComplete="off"
                    />
                    {/* Tagging (Category + Tags) */}
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
                {/* Right column: Photo + Comments */}
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 16 }}>
                    {/* Photo preview and navigation */}
                    {photos && photos.length > 0 && (
                        <div>
                            <img
                                src={photo?.url}
                                alt="Item Preview"
                                style={{ width: "100%", maxHeight: 200, objectFit: "contain" }}
                            />
                            <div>
                                <button type="button" onClick={handlePrev} disabled={isFirst}>&lt;</button>
                                <button type="button" onClick={handleNext} disabled={isLast}>&gt;</button>
                            </div>
                        </div>
                    )}
                    {/* Comments */}
                    <input
                        type="text"
                        placeholder="Add comments"
                        value={comments}
                        onChange={e => setComments(e.target.value)}
                        autoComplete="off"
                    />
                </div>
            </div>
            {/* Save status and actions */}
            <div style={{ marginTop: 24, display: "flex", justifyContent: "flex-end", gap: 12 }}>
                <SaveStatus status={saveStatus} />
                {apiError && <div style={{ color: "#cd384a" }}>{apiError}</div>}
                <button type="button" onClick={handleCancel} disabled={isSaving}>Cancel</button>
                <button type="submit" disabled={!isFormReady || isSaving}>{isSaving ? "Saving…" : "Save"}</button>
            </div>
        </form>
    );
};

export default EditItemForm;

