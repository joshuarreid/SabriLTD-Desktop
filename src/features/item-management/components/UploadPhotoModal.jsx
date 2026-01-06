/**
 * UploadPhotoModal.jsx
 *
 * Modal for uploading a photo (drag & drop or file select).
 * Borrows styling and accessibility patterns from EditBuildingModal.
 *
 * @component
 * @param {object} props
 * @param {boolean} props.open - If the modal is open
 * @param {function} props.onClose - Close/cancel callback
 * @param {function} props.onUpload - Handler for when upload is confirmed. Receives the selected File.
 * @param {boolean} [props.isUploading] - Show spinner/disabled state if uploading
 * @param {string|null} [props.error] - Error message string to display (optional)
 * @returns {JSX.Element|null}
 */

import React, { useRef, useState, useCallback } from "react";
import styles from "../styles/uploadphotomodal.module.css";

const logger = {
    info: (...args) => console.log("[UploadPhotoModal]", ...args),
    error: (...args) => console.error("[UploadPhotoModal]", ...args),
};

const MAX_FILE_SIZE_MB = 25;
const SUPPORTED_FORMATS = ["image/png", "image/jpeg"];

export const UploadPhotoModal = ({
                                     open,
                                     onClose,
                                     onUpload,
                                     isUploading = false,
                                     error = null,
                                 }) => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [dragActive, setDragActive] = useState(false);
    const [fileError, setFileError] = useState(null);
    const fileInputRef = useRef(null);

    /** Handles file selection or drop. */
    const handleFiles = useCallback((files) => {
        const file = files?.[0];
        logger.info("File selected/dropped", file);

        if (!file) return;

        if (!SUPPORTED_FORMATS.includes(file.type)) {
            setFileError("Only PNG and JPG files are supported.");
            setSelectedFile(null);
            return;
        }
        if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
            setFileError(`Maximum file size is ${MAX_FILE_SIZE_MB}MB.`);
            setSelectedFile(null);
            return;
        }
        setFileError(null);
        setSelectedFile(file);
    }, []);

    /** Handles drag over event to show visual feedback. */
    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!dragActive) setDragActive(true);
    };
    /** Handles drag leave to clear feedback. */
    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
    };
    /** Handles drop event and reads the file(s). */
    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
            handleFiles(e.dataTransfer.files);
        }
    };
    /** Handles click "Browse" link. */
    const handleBrowseClick = () => {
        fileInputRef.current?.click();
    };
    /** Handles file input selection. */
    const handleInputChange = (e) => {
        handleFiles(e.target.files);
    };

    /** Handles modal cancel/close (ESC or overlay). */
    const handleCancel = () => {
        setSelectedFile(null);
        setFileError(null);
        onClose();
    };

    /** Handles upload button click. */
    const handleUpload = () => {
        if (selectedFile && !fileError) {
            onUpload(selectedFile);
        }
    };

    if (!open) return null;

    return (
        <div
            className={styles.modalOverlay}
            onClick={handleCancel}
            tabIndex={-1}
            aria-modal="true"
        >
            <div
                className={styles.modalCard}
                onClick={(e) => e.stopPropagation()}
                tabIndex={0}
                role="dialog"
                aria-modal="true"
                aria-labelledby="upload-photo-modal-title"
            >
                <h2 className={styles.modalTitle} id="upload-photo-modal-title">
                    Upload Photo
                </h2>
                <form
                    className={styles.uploadForm}
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleUpload();
                    }}
                >
                    {/* DRAG-AND-DROP AREA */}
                    <div
                        className={
                            styles.dropZone +
                            (dragActive ? ` ${styles.dragActive}` : "") +
                            (fileError ? ` ${styles.errorZone}` : "")
                        }
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        tabIndex={0}
                        aria-label="Drag and drop area"
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".png,.jpg,.jpeg"
                            className={styles.fileInput}
                            onChange={handleInputChange}
                            tabIndex={-1}
                        />
                        <div className={styles.dropZoneInner}>
                            <svg
                                width="38"
                                height="38"
                                viewBox="0 0 38 38"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                                className={styles.cloudIcon}
                                aria-hidden="true"
                            >
                                <path
                                    d="M19 28V14M12 20L19 13L26 20"
                                    stroke="#A0A4B0"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                                <path
                                    d="M31.222 23.841A8.334 8.334 0 1 0 9.633 23.87"
                                    stroke="#A0A4B0"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                            {!selectedFile ? (
                                <>
                                    <span className={styles.dragText}>
                                        Drag & Drop your photo or{" "}
                                        <button
                                            type="button"
                                            className={styles.browseLink}
                                            onClick={handleBrowseClick}
                                            tabIndex={0}
                                        >
                                            Browse
                                        </button>
                                    </span>
                                </>
                            ) : (
                                <span className={styles.fileName}>
                                    Selected: {selectedFile.name}
                                </span>
                            )}
                        </div>
                    </div>
                    <div className={styles.metaRow}>
                        <span className={styles.metaLeft}>
                            Supported formats: <b>PNG, JPG</b>
                        </span>
                        <span className={styles.metaRight}>
                            Maximum size: <b>{MAX_FILE_SIZE_MB}MB</b>
                        </span>
                    </div>
                    {(fileError || error) && (
                        <div className={styles.errorMsg}>
                            {fileError || error}
                        </div>
                    )}
                    <div className={styles.formActions}>
                        <button
                            type="submit"
                            className={styles.uploadButton}
                            disabled={!selectedFile || !!fileError || isUploading}
                            aria-disabled={!selectedFile || !!fileError || isUploading}
                        >
                            {isUploading ? "Uploading…" : "Upload"}
                        </button>
                        <button
                            type="button"
                            className={styles.cancelButton}
                            onClick={handleCancel}
                            disabled={isUploading}
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UploadPhotoModal;