import React from "react";
import { useParams } from "react-router-dom";
import { useViewItemModal } from "../../features/item/hooks/useViewItemModal.js";
import ViewItemModal from "../../features/item/components/ViewItemModal.jsx";
import useJobDetailScreen from "../hooks/useJobDetailScreen.ts";
import useEditJobForm from "../../features/job/hooks/useEditJobForm.ts";
import styles from "../styles/jobdetailscreen.module.css";
import EditJobForm from "../../features/job/components/EditJobForm.tsx";
import JobItemGridBox from "../../features/job/components/JobItemGridBox.tsx";

/**
 * Logger for JobDetailScreen.
 *
 * @constant
 * @type {{info: Function, error: Function}}
 */
const logger = {
    info: (...args) => console.log("[JobDetailScreen]", ...args),
    error: (...args) => console.error("[JobDetailScreen]", ...args),
};

/**
 * formatDisplayDate
 * Converts ISO date to "Dec 20 2025 5:33pm" style.
 *
 * @function formatDisplayDate
 * @param {string} value
 * @returns {string}
 */
const formatDisplayDate = (value) => {
    if (!value) return "";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    const month = d.toLocaleString("en-US", { month: "short" });
    const day = d.getDate();
    const year = d.getFullYear();
    let hours = d.getHours();
    const minutes = d.getMinutes().toString().padStart(2, "0");
    const ampm = hours >= 12 ? "pm" : "am";
    hours = hours % 12;
    if (hours === 0) hours = 12;
    return `${month} ${day} ${year} ${hours}:${minutes}${ampm}`;
};

/**
 * JobDetailScreen
 * Presents job details, item list, and edit mode controls.
 *
 * @component
 * @returns {JSX.Element}
 */
const JobDetailScreen = () => {
    logger.info("JobDetailScreen rendered");

    const { jobId } = useParams();

    /**
     * jobIdNum
     * Normalized numeric job id from route params.
     *
     * @type {number|null}
     */
    const jobIdNum = jobId ? Number(jobId) : null;

    const jobDetail = useJobDetailScreen({ jobId: jobIdNum });

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
        companyName,
        companyLoading,
        companyError,
        userName,
        userLoading,
        userError,
    } = jobDetail;

    const edit = useEditJobForm({ job });

    const viewItemModal = useViewItemModal();

    const {
        isOpen,
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
    } = viewItemModal;

    /**
     * handleItemClick
     * Called when an ItemInfoCard is clicked in the grid.
     *
     * @function handleItemClick
     * @param {object} item
     * @returns {void}
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

    const isActive =
        typeof job.status === "string" && job.status.toLowerCase() === "active";

    return (
        <div className={styles.jobDetailScreenRoot}>
            <EditJobForm
                job={job}
                edit={edit}
                isActive={isActive}
                companyName={companyName}
                companyLoading={companyLoading}
                companyError={companyError}
                userName={userName}
                userLoading={userLoading}
                userError={userError}
                formatDisplayDate={formatDisplayDate}
            />

            <JobItemGridBox
                jobId={job.jobId ?? jobIdNum}
                items={items}
                isPending={isPending}
                isError={isError}
                error={error}
                page={page}
                setPage={setPage}
                pageSize={pageSize}
                setPageSize={setPageSize}
                totalPages={totalPages}
                totalItems={totalItems}
                itemStart={itemStart}
                itemEnd={itemEnd}
                hasPrevious={hasPrevious}
                hasNext={hasNext}
                handleNext={handleNext}
                handlePrevious={handlePrevious}
                refetch={refetch}
                onItemClick={handleItemClick}
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