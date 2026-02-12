import React from "react";
import styles from "../styles/viewitemmodal.module.css";
import usePhotoPreview from "../hooks/usePhotoPreview";

/**
 * PhotoPreview
 * UI component for rendering the primary item photo centered in the left sector of the modal.
 *
 * @component
 * @param {object} props
 * @param {Array<{photoId:number,url:string}>} props.photos - Array of item photo objects.
 * @param {string} props.itemName - Name of the item (for descriptive photo alt text).
 * @returns {JSX.Element}
 */
const logger = {
    info: (...args) => console.log("[PhotoPreview]", ...args),
    error: (...args) => console.error("[PhotoPreview]", ...args),
};

const PhotoPreview = ({ photos, itemName }) => {
    const { hasPhotos, mainPhoto, altText } = usePhotoPreview({ photos, itemName });

    logger.info("PhotoPreview rendered", { hasPhotos });

    return (
        <div className={styles.leftColumn} data-testid="photo-preview">
            {mainPhoto ? (
                <img
                    src={mainPhoto.url}
                    alt={altText}
                    className={styles.mainPhoto}
                />
            ) : (
                <div className={styles.mainPhotoPlaceholder}>No photo</div>
            )}
        </div>
    );
};

export default PhotoPreview;