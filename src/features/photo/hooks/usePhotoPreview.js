/**
 * usePhotoPreview
 * Resolves the main photo (first photo or null) for the PhotoPreview component UI.
 *
 * @function usePhotoPreview
 * @param {object} options
 * @param {Array<{photoId:number, url:string}>} options.photos - Array of item photo objects.
 * @param {string} options.itemName - Name of the item (for descriptive alt text).
 * @returns {{
 *   hasPhotos: boolean,
 *   mainPhoto: {photoId: number, url: string} | null,
 *   altText: string
 * }}
 */
import { useMemo } from "react";

/**
 * Logger for usePhotoPreview.
 *
 * @constant
 * @type {{info: Function, error: Function}}
 */
const logger = {
    info: (...args) => console.log("[usePhotoPreview]", ...args),
    error: (...args) => console.error("[usePhotoPreview]", ...args),
};

export const usePhotoPreview = ({ photos, itemName }) => {
    // Memoize resolution for performance and traceability
    const { hasPhotos, mainPhoto, altText } = useMemo(() => {
        const hasPhotos = Array.isArray(photos) && photos.length > 0;
        const mainPhoto = hasPhotos ? photos[0] : null;
        const altText = mainPhoto
            ? itemName || "Item photo"
            : "No photo available";
        logger.info("Resolved photo preview", { hasPhotos, mainPhoto, altText });
        return { hasPhotos, mainPhoto, altText };
    }, [photos, itemName]);

    return { hasPhotos, mainPhoto, altText };
};

export default usePhotoPreview;