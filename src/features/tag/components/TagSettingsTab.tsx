import React from "react";
import { useTagSettingsTab } from "../hooks/useTagSettingsTab";
import TagSettingsLayout from "./TagSettingsLayout";

const logger = {
    info: (...args: unknown[]) => console.log("[TagSettingsTab]", ...args),
    error: (...args: unknown[]) => console.error("[TagSettingsTab]", ...args),
};

const TagSettingsTab: React.FC = () => {
    logger.info("TagSettingsTab rendered");

    const {
        categories,
        isCategoriesPending,
        isCategoriesError,
        categoriesError,
        selectedCategoryId,
        setSelectedCategoryId,
        tags,
        isTagsPending,
        isTagsError,
        tagsError,
        tagSearch,
        sortKey,
        setSortKey,
        filteredTags,
        createTagStatus,
        tagDeleteId,
        tagDeleteStatus,
        onConfirmTagDelete,
        onCancelTagDelete,
        onTagDeleteRequest,
        onTagSearchKeyDown,
        onTagSearchChange,
    } = useTagSettingsTab();

    return (
        <TagSettingsLayout
            categories={categories}
            selectedCategoryId={selectedCategoryId}
            onCategoryClick={setSelectedCategoryId}
            isCategoriesPending={isCategoriesPending}
            isCategoriesError={isCategoriesError}
            categoriesError={categoriesError}
            tags={tags}
            isTagsPending={isTagsPending}
            isTagsError={isTagsError}
            tagsError={tagsError}
            tagSearch={tagSearch}
            onTagSearchChange={onTagSearchChange}
            onTagSearchKeyDown={onTagSearchKeyDown}
            sortKey={sortKey}
            onSortChange={setSortKey}
            filteredTags={filteredTags}
            createTagStatus={createTagStatus}
            tagDeleteId={tagDeleteId}
            tagDeleteStatus={tagDeleteStatus}
            onConfirmTagDelete={onConfirmTagDelete}
            onCancelTagDelete={onCancelTagDelete}
            onTagDeleteRequest={onTagDeleteRequest}
        />
    );
};

export default TagSettingsTab;