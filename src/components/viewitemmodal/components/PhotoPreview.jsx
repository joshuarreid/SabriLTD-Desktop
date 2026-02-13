import React, { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import styles from "../styles/photopreview.module.css";
import usePhotoPreview from "../hooks/usePhotoPreview";

/**
 * FullPhotoModal
 * Modal for full-photo preview (no visible controls or animations). Arrow keys go next/prev,
 * mouse wheel/touch to zoom, drag to pan. Close by clicking outside.
 *
 * @component
 * @param {object} props
 * @param {boolean} props.open
 * @param {Array<{photoId:number,url:string}>} props.photos
 * @param {number} props.current
 * @param {function} props.onClose
 * @param {function} props.onNavigate
 * @returns {JSX.Element}
 */
const FullPhotoModal = ({
                            open,
                            photos,
                            current,
                            onClose,
                            onNavigate
                        }) => {
    const imgRef = useRef(null);
    const [zoom, setZoom] = useState(1);
    const [drag, setDrag] = useState(false);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [start, setStart] = useState({ x: 0, y: 0 });

    const currPhoto = photos[current];

    // Keyboard: arrows to navigate, esc to close, +,- to zoom, double click to reset
    useEffect(() => {
        if (!open) return;
        const handleKey = (e) => {
            if (e.key === "Escape") onClose();
            else if (e.key === "ArrowLeft") onNavigate("prev");
            else if (e.key === "ArrowRight") onNavigate("next");
            else if (e.key === "+" || e.key === "=") setZoom(z => Math.min(z + 0.15, 3));
            else if (e.key === "-") setZoom(z => Math.max(z - 0.15, 1));
        };
        window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);
    }, [open, onClose, onNavigate]);

    // Mouse wheel zoom
    const handleWheel = (e) => {
        if (!open) return;
        setZoom(z =>
            Math.max(
                1,
                Math.min(z + (e.deltaY < 0 ? 0.16 : -0.16), 3)
            )
        );
    };

    // Mouse/touch drag pan
    const handleMouseDown = (e) => {
        e.preventDefault();
        setDrag(true);
        setStart({ x: e.clientX, y: e.clientY });
    };
    const handleMouseUp = () => setDrag(false);
    const handleMouseMove = (e) => {
        if (!drag) return;
        setOffset((prev) => ({
            x: prev.x + e.clientX - start.x,
            y: prev.y + e.clientY - start.y
        }));
        setStart({ x: e.clientX, y: e.clientY });
    };
    const handleTouchStart = (e) => {
        if (e.touches.length !== 1) return;
        setDrag(true);
        setStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    };
    const handleTouchEnd = () => setDrag(false);
    const handleTouchMove = (e) => {
        if (!drag || e.touches.length !== 1) return;
        setOffset((prev) => ({
            x: prev.x + e.touches[0].clientX - start.x,
            y: prev.y + e.touches[0].clientY - start.y
        }));
        setStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    };

    // Double click resets zoom/pan
    const handleDoubleClick = () => {
        setZoom(1);
        setOffset({ x: 0, y: 0 });
    };

    // Prevent scrolling outside modal
    useEffect(() => {
        if (!open) return;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = "";
        };
    }, [open]);

    if (!open || !currPhoto) return null;

    return (
        <div
            className={styles.modalOverlay}
            onClick={onClose}
            tabIndex={-1}
        >
            <div
                className={styles.modalCard}
                onClick={e => e.stopPropagation()}
                onWheel={handleWheel}
            >
                <img
                    src={currPhoto.url}
                    alt="Full preview"
                    className={styles.modalImg}
                    ref={imgRef}
                    style={{
                        transform: `scale(${zoom}) translate(${offset.x}px,${offset.y}px)`,
                        cursor: zoom > 1 ? "grab" : "zoom-in",
                        transition: drag ? "none" : "transform 0.19s"
                    }}
                    draggable={false}
                    onMouseDown={handleMouseDown}
                    onMouseUp={handleMouseUp}
                    onMouseMove={handleMouseMove}
                    onTouchStart={handleTouchStart}
                    onTouchEnd={handleTouchEnd}
                    onTouchMove={handleTouchMove}
                    onDoubleClick={handleDoubleClick}
                />
            </div>
        </div>
    );
};

/**
 * PhotoPreview
 * Main preview card with thumbnail strip.
 * Arrow keys to navigate. Clicking preview opens full modal with zoom/pan/navigation (no visible controls or modal animations).
 *
 * @component
 * @param {Array<{photoId:number,url:string}>} photos
 * @param {string} itemName
 * @returns {JSX.Element}
 */
const logger = {
    info: (...args) => console.log("[PhotoPreview]", ...args),
    error: (...args) => console.error("[PhotoPreview]", ...args),
};

const PhotoPreview = ({ photos, itemName }) => {
    const { hasPhotos, mainPhoto, altText } = usePhotoPreview({ photos, itemName });
    const [current, setCurrent] = useState(0);
    const [modalOpen, setModalOpen] = useState(false);

    /**
     * Keyboard navigation for gallery (main preview area).
     */
    const handleGalleryKey = useCallback((e) => {
        if (e.key === "ArrowLeft") setCurrent(i => Math.max(0, i - 1));
        else if (e.key === "ArrowRight") setCurrent(i => Math.min(photos.length - 1, i + 1));
    }, [photos.length]);
    useEffect(() => {
        window.addEventListener("keydown", handleGalleryKey);
        return () => window.removeEventListener("keydown", handleGalleryKey);
    }, [handleGalleryKey]);

    /**
     * Modal navigation (prev/next).
     */
    const handleModalNavigate = (direction) => {
        setCurrent(i => {
            if (direction === "prev") return Math.max(0, i - 1);
            if (direction === "next") return Math.min(photos.length - 1, i + 1);
            return i;
        });
    };

    if (!hasPhotos) {
        return (
            <motion.div
                className={styles.previewCard}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ type: "spring", stiffness: 200, damping: 22 }}
            >
                <div className={styles.mainPhotoPlaceholder}>No photo</div>
            </motion.div>
        );
    }

    const currPhoto = photos[current];

    logger.info("PhotoPreview rendered", { current, total: photos.length });

    return (
        <div className={styles.galleryRoot}>
            <motion.div
                className={styles.previewCard}
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ type: "spring", stiffness: 220, damping: 18 }}
            >
                <motion.img
                    src={currPhoto.url}
                    alt={altText}
                    className={styles.previewImg}
                    onClick={() => setModalOpen(true)}
                    style={{ cursor: "pointer" }}
                    tabIndex={0}
                    aria-label="View full photo"
                    initial={{ y: 30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 30, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 230, damping: 23 }}
                />
                <FullPhotoModal
                    open={modalOpen}
                    photos={photos}
                    current={current}
                    onClose={() => setModalOpen(false)}
                    onNavigate={handleModalNavigate}
                />
            </motion.div>
            {photos.length > 1 && (
                <motion.div
                    className={styles.thumbStrip}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 16 }}
                    transition={{ type: "spring", stiffness: 190, damping: 24 }}
                >
                    {photos.map((p, idx) => (
                        <motion.button
                            key={p.photoId || idx}
                            className={`${styles.thumbBtn} ${idx === current ? styles.thumbActive : ""}`}
                            onClick={() => setCurrent(idx)}
                            aria-label={`Select photo ${idx + 1}`}
                            tabIndex={0}
                            whileHover={{ scale: 1.08 }}
                            whileTap={{ scale: 0.93 }}
                        >
                            <motion.img
                                src={p.url}
                                alt=""
                                className={styles.thumbImg}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.23 }}
                            />
                        </motion.button>
                    ))}
                </motion.div>
            )}
        </div>
    );
};

export default PhotoPreview;