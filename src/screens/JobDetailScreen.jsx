import React from "react";
import { useParams } from "react-router-dom";
import { TbProgressCheck } from "react-icons/tb";
import { MdOutlineModeEditOutline, MdClose, MdCheck } from "react-icons/md";
import ItemCardGrid from "../components/item-grid/components/ItemCardGrid";
import { useViewItemModal } from "../components/viewitemmodal/hooks/useViewItemModal";
import ViewItemModal from "../components/viewitemmodal/components/ViewItemModal";
import FilterDropdownSearchAndAdd from "../components/filterdropdown/FilterDropdownSearchAndAdd";
import useJobDetailScreen from "../features/job-management/hooks/useJobDetailScreen";
import useEditJobDetails from "../features/job-management/hooks/useEditJobDetails";
import styles from "../features/job-management/styles/jobdetailscreen.module.css";

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
     * - Parsed numeric job id from route params.
     *
     * @type {number|null}
     */
    const jobIdNum = jobId ? Number(jobId) : null;

    /**
     * jobDetail
     * - Read-only job detail and items state.
     */
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
    } = useJobDetailScreen({ jobId: jobIdNum });

    /**
     * edit
     * - Edit-mode state and mutations for job updates.
     */
    const edit = useEditJobDetails({ job });

    /**
     * viewItemModal
     * - Modal state for viewing item details.
     */
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
    } = useViewItemModal();

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

    /**
     * isActive
     * - True when job status is "active" (case-insensitive).
     *
     * @type {boolean}
     */
    const isActive =
        typeof job.status === "string" && job.status.toLowerCase() === "active";

    return (
        <div className={styles.jobDetailScreenRoot}>
            <div className={styles.jobInfoBar}>
                {/* Edit mode action buttons */}
                <div className={styles.jobEditActions}>
                    {edit.isEditMode && (
                        <button
                            type="button"
                            className={`${styles.jobSaveBtn} ${
                                !edit.hasChanges || edit.saveJobState.isPending
                                    ? styles.jobSaveBtnDisabled
                                    : ""
                            }`}
                            aria-label="Save changes"
                            title={edit.saveJobState.isPending ? "Saving..." : "Save changes"}
                            tabIndex={0}
                            onClick={edit.saveJob}
                            disabled={!edit.hasChanges || edit.saveJobState.isPending}
                        >
                            <MdCheck size={26} />
                        </button>
                    )}
                    <button
                        type="button"
                        className={`${styles.jobEditIconBtn} ${
                            edit.isEditMode ? styles.jobEditIconBtnActive : ""
                        }`}
                        aria-label={edit.isEditMode ? "Cancel editing" : "Edit job details"}
                        title={edit.isEditMode ? "Cancel editing" : "Edit job details"}
                        tabIndex={0}
                        onClick={edit.toggleEditMode}
                    >
                        {edit.isEditMode ? (
                            <MdClose size={26} />
                        ) : (
                            <MdOutlineModeEditOutline size={26} />
                        )}
                    </button>
                </div>

                {/* Save error message */}
                {edit.saveJobState.isError && (
                    <div className={styles.jobSaveError}>
                        Failed to save: {edit.saveJobState.error?.message || "Unknown error"}
                    </div>
                )}

                <div className={styles.jobSummaryRow}>
                    {isActive && (
                        <TbProgressCheck
                            size={22}
                            color="#338c41"
                            className={styles.jobActiveIcon}
                            aria-label="Active job"
                        />
                    )}
                    <span className={styles.jobTitle}>
                        {edit.isEditMode ? edit.editValues.name : job.name} -{" "}
                        {edit.isEditMode ? edit.editValues.description : job.description}
                    </span>
                </div>

                <div className={styles.jobFieldsBoxesRow}>
                    <div className={styles.jobFieldTextboxGroup}>
                        <label className={styles.jobFieldLabel} htmlFor="job-name">
                            Name
                        </label>
                        <input
                            id="job-name"
                            className={`${styles.jobFieldTextbox} ${
                                edit.isEditMode ? styles.jobFieldTextboxEditable : ""
                            }`}
                            value={edit.isEditMode ? edit.editValues.name : job.name || "-"}
                            readOnly={!edit.isEditMode}
                            onChange={
                                edit.isEditMode
                                    ? (e) => edit.updateEditField("name", e.target.value)
                                    : undefined
                            }
                            tabIndex={0}
                            aria-readonly={!edit.isEditMode}
                        />
                    </div>

                    <div className={styles.jobFieldTextboxGroup}>
                        <label className={styles.jobFieldLabel} htmlFor="job-company">
                            Company
                        </label>

                        {edit.isEditMode ? (
                            <FilterDropdownSearchAndAdd
                                label="Company"
                                options={edit.companyOptions}
                                value={edit.editValues.companyId || ""}
                                onChange={edit.handleCompanyChange}
                                className={styles.jobFieldDropdownInline}
                                emptyLabel={
                                    edit.companiesState.isCompaniesPending
                                        ? "Loading..."
                                        : "No companies found"
                                }
                                onCreateNew={edit.createNewCompany}
                                createNewLabel="Create new company"
                            />
                        ) : (
                            <input
                                id="job-company"
                                className={styles.jobFieldTextbox}
                                value={companyLoading ? "Loading..." : companyName || "-"}
                                readOnly
                                tabIndex={0}
                                aria-readonly="true"
                            />
                        )}

                        {companyError && !edit.isEditMode && (
                            <div className={styles.jobFieldError}>{companyError}</div>
                        )}

                        {edit.companiesState.isCompaniesError && edit.isEditMode && (
                            <div className={styles.jobFieldError}>Could not load companies</div>
                        )}

                        {edit.createCompanyState.isPending && (
                            <div className={styles.jobFieldInfo}>Creating company...</div>
                        )}

                        {edit.createCompanyState.isError && (
                            <div className={styles.jobFieldError}>
                                Failed to create company:{" "}
                                {edit.createCompanyState.error?.message || "Unknown error"}
                            </div>
                        )}
                    </div>

                    <div className={styles.jobFieldTextboxGroup}>
                        <label className={styles.jobFieldLabel} htmlFor="job-client">
                            Client
                        </label>

                        {edit.isEditMode ? (
                            edit.editValues.companyId ? (
                                <FilterDropdownSearchAndAdd
                                    label="Client"
                                    options={edit.clientOptions}
                                    value={edit.editValues.client || ""}
                                    onChange={edit.handleClientChange}
                                    className={styles.jobFieldDropdownInline}
                                    emptyLabel={
                                        edit.clientsState.isClientsPending
                                            ? "Loading..."
                                            : "No clients found"
                                    }
                                    onCreateNew={edit.createNewClient}
                                    createNewLabel="Add new client"
                                />
                            ) : (
                                <input
                                    id="job-client"
                                    className={`${styles.jobFieldTextbox} ${styles.jobFieldTextboxDisabled}`}
                                    value="Select a company first"
                                    readOnly
                                    tabIndex={0}
                                    aria-readonly="true"
                                />
                            )
                        ) : (
                            <input
                                id="job-client"
                                className={styles.jobFieldTextbox}
                                value={job.client || "-"}
                                readOnly
                                tabIndex={0}
                                aria-readonly="true"
                            />
                        )}

                        {edit.clientsState.isClientsError &&
                            edit.isEditMode &&
                            edit.editValues.companyId && (
                                <div className={styles.jobFieldError}>Could not load clients</div>
                            )}
                    </div>

                    <div className={styles.jobFieldTextboxGroup}>
                        <label className={styles.jobFieldLabel} htmlFor="job-description">
                            Description
                        </label>
                        <input
                            id="job-description"
                            className={`${styles.jobFieldTextbox} ${
                                edit.isEditMode ? styles.jobFieldTextboxEditable : ""
                            }`}
                            value={
                                edit.isEditMode ? edit.editValues.description : job.description || "-"
                            }
                            readOnly={!edit.isEditMode}
                            onChange={
                                edit.isEditMode
                                    ? (e) => edit.updateEditField("description", e.target.value)
                                    : undefined
                            }
                            tabIndex={0}
                            aria-readonly={!edit.isEditMode}
                        />
                    </div>

                    <div className={styles.jobFieldTextboxGroup}>
                        <label className={styles.jobFieldLabel} htmlFor="job-updatedby">
                            Updated By
                        </label>
                        <input
                            id="job-updatedby"
                            className={styles.jobFieldTextbox}
                            value={userLoading ? "Loading..." : userName || "-"}
                            readOnly
                            tabIndex={0}
                            aria-readonly="true"
                        />
                        {userError && <div className={styles.jobFieldError}>{userError}</div>}
                    </div>
                </div>

                <div className={styles.jobDatesBoxesRow}>
                    <div className={styles.jobFieldTextboxGroup}>
                        <label className={styles.jobFieldLabel} htmlFor="job-dateadded">
                            Date Added
                        </label>
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
                        <label className={styles.jobFieldLabel} htmlFor="job-dateupdated">
                            Last Updated
                        </label>
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
                setPageSize={setPageSize}
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