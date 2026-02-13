import React from "react";
import { useParams } from "react-router-dom";
import ItemCardGrid from "../components/item-grid/components/ItemCardGrid";
import { useViewItemModal } from "../components/viewitemmodal/hooks/useViewItemModal";
import ViewItemModal from "../components/viewitemmodal/components/ViewItemModal";
import useJobDetailScreen from "../features/job-management/hooks/useJobDetailScreen";

/**
 * Logger for JobDetailScreen.
 * @constant
 */
const logger = {
    info: (...args) => console.log("[JobDetailScreen]", ...args),
    error: (...args) => console.error("[JobDetailScreen]", ...args),
};

/**
 * JobDetailScreen
 * Renders a 5x5 grid populated by items found using a search for job.name,
 * with item modal integration.
 *
 * @component
 * @returns {JSX.Element}
 */
const JobDetailScreen = () => {
    logger.info("JobDetailScreen rendered");

    // Extract jobId from route params
    const { jobId } = useParams();
    const jobIdNum = jobId ? Number(jobId) : null;

    // Business/data logic (fetch job, then items with job.name as search query)
    const {
        items,
        isPending,
        isError,
        error,
        page,
        setPage,
        pageSize,
        setPageSize,
        totalPages,
        totalItems,
        itemStart,
        itemEnd,
        hasPrevious,
        hasNext,
        handleNext,
        handlePrevious,
        refetch,
        job,
        isJobPending,
        isJobError,
        jobError,
        refetchJob,
    } = useJobDetailScreen({ jobId: jobIdNum });

    // Modal state/handlers
    const {
        isOpen,
        previewItem,
        selectedItemId,
        details,
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
        openWithItem,
        close,
    } = useViewItemModal();

    /**
     * handleItemClick
     * Called when an ItemInfoCard is clicked in the grid.
     * @param {object} item
     */
    const handleItemClick = (item) => {
        if (!item) {
            logger.error("handleItemClick called without an item in JobDetailScreen");
            return;
        }
        logger.info("Item clicked from grid", {
            itemId: item.id || item.itemId,
            name: item.name,
        });
        openWithItem(item);
    };

    // Loading, error, and content rendering
    if (isJobPending || !job) {
        return <div style={{ padding: 30 }}>Loading job details…</div>;
    }
    if (isJobError) {
        logger.error("Failed to load job details", jobError);
        return (
            <div style={{ color: "#d02", padding: 30 }}>
                Error loading job: {jobError?.message || "Unknown error"}
            </div>
        );
    }

    return (
        <div>
            <h2 style={{ marginTop: 14, marginBottom: 10 }}>
                Job #{jobIdNum}: {job.name}
            </h2>
            <ItemCardGrid
                items={items}
                columns={5}
                rows={5}
                onItemClick={handleItemClick}
                isPending={isPending}
                isError={isError}
                error={error}
                page={page}
                setPage={setPage}
                totalPages={totalPages}
                totalItems={totalItems}
                hasPrevious={hasPrevious}
                hasNext={hasNext}
                itemStart={itemStart}
                itemEnd={itemEnd}
                pageSize={pageSize}
                handleNext={handleNext}
                handlePrevious={handlePrevious}
                refetch={refetch}
            />

            <ViewItemModal
                open={isOpen}
                onClose={close}
                isDetailsPending={isDetailsPending}
                isDetailsError={isDetailsError}
                detailsError={detailsError}
                resolvedId={resolvedId}
                resolvedName={resolvedName}
                resolvedDescription={resolvedDescription}
                resolvedCondition={resolvedCondition}
                resolvedStorageDesc={resolvedStorageDesc}
                resolvedUpdatedBy={resolvedUpdatedBy}
                resolvedDateAdded={resolvedDateAdded}
                resolvedDateUpdated={resolvedDateUpdated}
                resolvedTags={resolvedTags}
                resolvedJobs={resolvedJobs}
                resolvedComments={resolvedComments}
                resolvedPhotos={resolvedPhotos}
                resolvedBuilding={resolvedBuilding}
            />
        </div>
    );
};

export default JobDetailScreen;