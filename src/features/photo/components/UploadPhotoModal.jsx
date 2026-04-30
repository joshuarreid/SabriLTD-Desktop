import React, { useRef, useState, useCallback, useEffect } from "react";
import styles from "../styles/uploadphotomodal.module.css";

/**
 * logger for UploadPhotoModal
 * @constant
 */
const logger = {
    info: (...args) => console.log("[UploadPhotoModal]", ...args),
    error: (...args) => console.error("[UploadPhotoModal]", ...args),
};

const MAX_FILE_SIZE_MB = 250;
const SUPPORTED_FORMATS = ["image/png", "image/jpeg", "image/jpg"];

/**
 * UploadPhotoModal component for selecting/uploading a single file.
 *
 * @param {object} props
 * @param {boolean} props.open - Whether the modal is open
 * @param {function} props.onClose - Callback when modal is closed
 * @param {function} props.onUpload - Handler for confirmed file upload (single File)
 * @param {boolean} [props.isUploading] - Uploading state
 * @param {string|null} [props.error] - Error message
 * @returns {JSX.Element|null}
 */
export const UploadPhotoModal = ({
                                     open,
                                     onClose,
                                     onUpload,
                                     isUploading = false,
                                     error = null,
                                 }) => {
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [dragActive, setDragActive] = useState(false);
    const [fileError, setFileError] = useState(null);
    const fileInputRef = useRef(null);

    /**
     * Resets file state when modal is opened or closed.
     */
    useEffect(() => {
        if (!open) {
            setSelectedFiles([]);
            setFileError(null);
            setDragActive(false);
        }
    }, [open]);

    /**
     * Updates selected files and validates type/size.
     * @param {FileList} fileList
     */
    const handleFiles = useCallback((fileList) => {
        if (!fileList || fileList.length === 0) {
            setFileError(null);
            setSelectedFiles([]);
            return;
        }
        const files = Array.from(fileList);
        const invalid = files.find(
            (file) =>
                !SUPPORTED_FORMATS.includes(file.type) ||
                file.size > MAX_FILE_SIZE_MB * 1024 * 1024
        );
        if (invalid) {
            setFileError(
                `Invalid file: ${invalid.name}. Only PNG/JPEG under ${MAX_FILE_SIZE_MB}MB allowed.`
            );
            setSelectedFiles([]);
            return;
        }
        setFileError(null);
        setSelectedFiles(files);
    }, []);

    /** Handles drag events for visual feedback. */
    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!dragActive) setDragActive(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
            handleFiles(e.dataTransfer.files);
        }
    };

    const handleBrowseClick = () => {
        fileInputRef.current?.click();
    };

    const handleInputChange = (e) => {
        handleFiles(e.target.files);
    };

    /** Clear all state and close modal */
    const handleCancel = () => {
        setSelectedFiles([]);
        setFileError(null);
        setDragActive(false);
        onClose();
    };

    const handleUpload = () => {
        if (selectedFiles.length > 0 && !fileError) {
            onUpload(selectedFiles);
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
                onClick={e => e.stopPropagation()}
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
                    onSubmit={e => {
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
                            multiple={true}
                        />
                        <div className={styles.dropZoneInner}>
                            {selectedFiles.length === 0 ? (
                                <>
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
                                <div className={styles.fileName}>
                                    Selected:{" "}
                                    {selectedFiles.map((file) => file.name).join(", ")}
                                </div>
                            )}
                        </div>
                    </div>
                    <div className={styles.metaRow}>
                        <span className={styles.metaLeft}>
                            Supported: <b>PNG, JPG, JPEG</b>
                        </span>
                        <span className={styles.metaRight}>
                            Max size: <b>{MAX_FILE_SIZE_MB}MB</b>
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
                            disabled={
                                selectedFiles.length === 0 || !!fileError || isUploading
                            }
                            aria-disabled={
                                selectedFiles.length === 0 || !!fileError || isUploading
                            }
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