import React from "react";
import { useParams } from "react-router-dom";
import { TbProgressCheck } from "react-icons/tb";
import { MdOutlineModeEditOutline } from "react-icons/md";
import ItemCardGrid from "../components/item-grid/components/ItemCardGrid";
import { useViewItemModal } from "../components/viewitemmodal/hooks/useViewItemModal";
import ViewItemModal from "../components/viewitemmodal/components/ViewItemModal";
import useJobDetailScreen from "../features/job-management/hooks/useJobDetailScreen";
import styles from "../features/job-management/styles/jobdetailscreen.module.css";

/**
 * Logger for JobDetailScreen.
 * @constant
 */
const logger = {
    info: (...args) => console.log("[JobDetailScreen]", ...args),
    error: (...args) => console.error("[JobDetailScreen]", ...args),
};

/**
 * formatDisplayDate
 * Converts ISO date to "Dec 20 2025 5:33pm" style
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
 * Presents immutable job info fields—no hover, no pointer, no focus styling.
 * Pencil icon edit button is in the top right corner for future editing.
 *
 * @component
 * @returns {JSX.Element}
 */
const JobDetailScreen = () => {
    logger.info("JobDetailScreen rendered");

    const { jobId } = useParams();
    const jobIdNum = jobId ? Number(jobId) : null;

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
        companyName,
        companyLoading,
        companyError,
        userName,
        userLoading,
        userError,
    } = useJobDetailScreen({ jobId: jobIdNum });

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
        typeof job.status === "string" &&
        job.status.toLowerCase() === "active";

    return (
        <div className={styles.jobDetailScreenRoot}>
            <div className={styles.jobInfoBar}>
                <button
                    type="button"
                    className={styles.jobEditIconBtn}
                    aria-label="Edit job details"
                    title="Edit job details"
                    tabIndex={0}
                >
                    <MdOutlineModeEditOutline size={26} />
                </button>
                <div className={styles.jobSummaryRow}>
                    {isActive && (
                        <TbProgressCheck
                            size={22}
                            color="#338c41"
                            className={styles.jobActiveIcon}
                            aria-label="Active job"
                        />
                    )}
                    <span className={styles.jobTitle}>{job.name} - {job.description}</span>
                </div>
                <div className={styles.jobFieldsBoxesRow}>
                    <div className={styles.jobFieldTextboxGroup}>
                        <label className={styles.jobFieldLabel} htmlFor="job-name">Name</label>
                        <input
                            id="job-name"
                            className={styles.jobFieldTextbox}
                            value={job.name || "-"}
                            readOnly
                            tabIndex={0}
                            aria-readonly="true"
                        />
                    </div>
                    <div className={styles.jobFieldTextboxGroup}>
                        <label className={styles.jobFieldLabel} htmlFor="job-company">Company</label>
                        <input
                            id="job-company"
                            className={styles.jobFieldTextbox}
                            value={companyLoading ? "Loading..." : (companyName || "-")}
                            readOnly
                            tabIndex={0}
                            aria-readonly="true"
                        />
                        {companyError && (
                            <div className={styles.jobFieldError}>{companyError}</div>
                        )}
                    </div>
                    <div className={styles.jobFieldTextboxGroup}>
                        <label className={styles.jobFieldLabel} htmlFor="job-client">Client</label>
                        <input
                            id="job-client"
                            className={styles.jobFieldTextbox}
                            value={job.client || "-"}
                            readOnly
                            tabIndex={0}
                            aria-readonly="true"
                        />
                    </div>
                    <div className={styles.jobFieldTextboxGroup}>
                        <label className={styles.jobFieldLabel} htmlFor="job-description">Description</label>
                        <input
                            id="job-description"
                            className={styles.jobFieldTextbox}
                            value={job.description || "-"}
                            readOnly
                            tabIndex={0}
                            aria-readonly="true"
                        />
                    </div>
                    <div className={styles.jobFieldTextboxGroup}>
                        <label className={styles.jobFieldLabel} htmlFor="job-updatedby">Updated By</label>
                        <input
                            id="job-updatedby"
                            className={styles.jobFieldTextbox}
                            value={userLoading ? "Loading..." : (userName || "-")}
                            readOnly
                            tabIndex={0}
                            aria-readonly="true"
                        />
                        {userError && (
                            <div className={styles.jobFieldError}>{userError}</div>
                        )}
                    </div>
                </div>
                <div className={styles.jobDatesBoxesRow}>
                    <div className={styles.jobFieldTextboxGroup}>
                        <label className={styles.jobFieldLabel} htmlFor="job-dateadded">Date Added</label>
                        <input
                            id="job-dateadded"
                            className={styles.jobFieldTextbox}
                            value={formatDisplayDate(job.dateAdded)}
                            readOnly
                            tabIndex={0}
                            aria-readonly="true"
                        />
                    </div>
                    <div className={styles.jobFieldTextboxGroup}>
                        <label className={styles.jobFieldLabel} htmlFor="job-dateupdated">Last Updated</label>
                        <input
                            id="job-dateupdated"
                            className={styles.jobFieldTextbox}
                            value={formatDisplayDate(job.dateUpdated)}
                            readOnly
                            tabIndex={0}
                            aria-readonly="true"
                        />
                    </div>
                </div>
            </div>
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