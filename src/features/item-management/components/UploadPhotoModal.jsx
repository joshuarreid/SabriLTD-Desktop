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

const MAX_FILE_SIZE_MB = 25;
const SUPPORTED_FORMATS = ["image/png", "image/jpeg"];

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
    const [selectedFile, setSelectedFile] = useState(null);
    const [dragActive, setDragActive] = useState(false);
    const [fileError, setFileError] = useState(null);
    const fileInputRef = useRef(null);

    /**
     * Resets file state when modal is opened or closed.
     */
    useEffect(() => {
        if (!open) {
            setSelectedFile(null);
            setFileError(null);
            setDragActive(false);
        }
    }, [open]);

    /**
     * Updates selected file and validates type/size.
     * @param {FileList} fileList
     */
    const handleFiles = useCallback((fileList) => {
        const file = fileList?.[0];
        logger.info("File selected/dropped", file?.name);
        if (!file) {
            setFileError(null);
            setSelectedFile(null);
            return;
        }
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
        setSelectedFile(null);
        setFileError(null);
        setDragActive(false);
        onClose();
    };

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
                            multiple={false}
                        />
                        <div className={styles.dropZoneInner}>
                            {!selectedFile ? (
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
                                    Selected: {selectedFile.name}
                                </div>
                            )}
                        </div>
                    </div>
                    <div className={styles.metaRow}>
                        <span className={styles.metaLeft}>
                            Supported: <b>PNG, JPG</b>
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