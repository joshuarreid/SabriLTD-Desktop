/**
 * PhotoInfoCard.jsx
 *
 * Presentational card for a pending photo.
 * Styled and architected to match CompanyInfoCard conventions.
 *
 * @component
 * @param {object} props
 * @param {object} props.photo - Pending photo object.
 * @param {boolean} [props.selected=false] - Whether card is selected.
 * @param {(photo: object) => void} [props.onClick] - Card click handler.
 * @returns {JSX.Element}
 */
import React from "react";
import type { Photo } from "../api/photo.types";
import styles from "../styles/photoinfocard.module.css";

interface PhotoInfoCardProps {
    photo: Photo;
    selected?: boolean;
    onClick?: (photo: Photo) => void;
}

/**
 * logger for PhotoInfoCard.
 * @constant
 * @type {{info: Function, error: Function}}
 */
const logger = {
    info: (...args: any[]) => console.log("[PhotoInfoCard]", ...args),
    error: (...args: any[]) => console.error("[PhotoInfoCard]", ...args),
};

const PhotoInfoCard: React.FC<PhotoInfoCardProps> = ({ photo, selected = false, onClick }) => {
    logger.info("PhotoInfoCard rendered", { photoId: photo?.photoId });

    return (
        <button
            type="button"
            className={
                styles.photoCard + (selected ? ` ${styles.selectedCard || ""}` : "")
            }
            onClick={() => onClick && onClick(photo)}
            aria-label={
                selected
                    ? `Pending Photo ${photo.photoId}, selected`
                    : `Pending Photo ${photo.photoId}`
            }
        >
            <span className={styles.statusDot} />
            <div className={styles.photoThumbContainer}>
                {photo.url ? (
                    <img
                        src={photo.url}
                        alt={`Photo ${photo.photoId}`}
                        className={styles.photoThumb}
                    />
                ) : (
                    <div className={styles.photoPlaceholder}>
                        No Image
                    </div>
                )}
            </div>
            <div className={styles.photoInfo}>
                {photo.dateAdded && (
                    <div className={styles.photoMeta}>
                        Added: {new Date(photo.dateAdded).toLocaleString()}
                    </div>
                )}
            </div>
        </button>
    );
};

export default PhotoInfoCard;