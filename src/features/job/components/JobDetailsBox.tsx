/**
 * JobDetailsBox.jsx
 *
 * UI-only component extracted from JobDetailScreen for scale.
 * Renders:
 * - job title + edit controls
 * - editable/read-only fields (name/company/client/description/updatedBy)
 * - date fields
 *
 * IMPORTANT:
 * - No business logic or data fetching here.
 * - All orchestration stays in hooks (useJobDetailScreen/useEditJobDetails).
 *
 * @component
 * @param {object} props
 * @param {any} props.job - Job data object.
 * @param {object} props.edit - View-model returned by useEditJobDetails({ job }).
 * @param {boolean} props.isActive - True if job.status is "active" (case-insensitive).
 * @param {string} props.companyName - Resolved company name for display.
 * @param {boolean} props.companyLoading - True while company query is pending.
 * @param {string|null} props.companyError - Error message for company lookup.
 * @param {string} props.userName - Resolved updated-by user name for display.
 * @param {boolean} props.userLoading - True while user query is pending.
 * @param {string|null} props.userError - Error message for user lookup.
 * @param {(value: string) => string} props.formatDisplayDate - Date formatter.
 * @returns {JSX.Element}
 */

import React from "react";
import { TbProgressCheck } from "react-icons/tb";
import { MdOutlineModeEditOutline, MdClose, MdCheck } from "react-icons/md";

import styles from "./jobdetailscreen.module.css";
import FilterDropdownSearchAndAdd from "../../../components/filterdropdown/FilterDropdownSearchAndAdd";

/**
 * Logger for JobDetailsBox.
 *
 * @constant
 * @type {{info: Function, error: Function}}
 */
const logger = {
    info: (...args) => console.log("[JobDetailsBox]", ...args),
    error: (...args) => console.error("[JobDetailsBox]", ...args),
};

const JobDetailsBox = ({
                           job,
                           edit,
                           isActive,
                           companyName,
                           companyLoading,
                           companyError,
                           userName,
                           userLoading,
                           userError,
                           formatDisplayDate,
                       }) => {
    logger.info("JobDetailsBox rendered", {
        jobId: job?.jobId,
        isEditMode: !!edit?.isEditMode,
    });

    return (
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
                    {edit.isEditMode ? <MdClose size={26} /> : <MdOutlineModeEditOutline size={26} />}
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
                        value={edit.isEditMode ? edit.editValues.description : job.description || "-"}
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
    );
};

export default JobDetailsBox;