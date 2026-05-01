/**
 * usePhotoPreview
 * Resolves the main photo (first photo or null) for the PhotoPreview component UI.
 *
 * @function usePhotoPreview
 * @param {object} options
 * @param {string} options.itemName - Name of the item (for descriptive alt text).
 * @returns {{
 *   hasPhotos: boolean,
 *   mainPhoto: {photoId: number, url: string} | null,
 *   altText: string
 * }}
 */
import { useMemo } from "react";
import { useAllPhotos } from "./usePhotos";
import type { Photo } from "../api/photo.types";

interface UsePhotoPreviewOptions {
    itemName: string;
}

interface UsePhotoPreviewResult {
    hasPhotos: boolean;
    mainPhoto: Photo | null;
    altText: string;
    allPhotos: Photo[];
    isLoading: boolean;
    isError: boolean;
}

/**
 * Logger for usePhotoPreview.
 *
 * @constant
 * @type {{info: Function, error: Function}}
 */
const logger = {
    info: (...args: any[]) => console.log("[usePhotoPreview]", ...args),
    error: (...args: any[]) => console.error("[usePhotoPreview]", ...args),
};

export const usePhotoPreview = ({ itemName }: UsePhotoPreviewOptions): UsePhotoPreviewResult => {
    const { data, isLoading, isError } = useAllPhotos();
    const photos = data?.data || [];

    const { hasPhotos, mainPhoto, altText } = useMemo(() => {
        const hasPhotos = Array.isArray(photos) && photos.length > 0;
        const mainPhoto = hasPhotos ? photos[0] : null;
        const altText = mainPhoto
            ? itemName || "Item photo"
            : "No photo available";
        logger.info("Resolved photo preview", { hasPhotos, mainPhoto, altText });
        return { hasPhotos, mainPhoto, altText };
    }, [photos, itemName]);

    return { hasPhotos, mainPhoto, altText, allPhotos: photos, isLoading, isError };
};

export default usePhotoPreview;