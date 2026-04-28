/**
 * usePendingPhotos
 * Custom hook for AddItemScreen. Handles retrieval of pending photos and upload logic.
 *
 * @returns {object} {
 *   pendingPhotos: Array<Object>,
 *   isPending: boolean,
 *   isError: boolean,
 *   error: Error|null,
 *   onUploadPhoto: Function
 * }
 */
import { useQuery } from "@tanstack/react-query";
import { photoKeys } from "../../../api/photo/photoQueryKeys.js";
import { getPendingPhotos } from "../../../api/photo/photo.js";


const logger = {
    info: (...args) => console.log("[useAddItemScreen]", ...args),
    error: (...args) => console.error("[useAddItemScreen]", ...args),
};

export const usePendingPhotos = () => {
    logger.info("usePendingPhotos called");

    const {
        data,
        isPending,
        isError,
        error,
    } = useQuery({
        queryKey: photoKeys.pendingList(),
        queryFn: getPendingPhotos,
    });

    /**
     * onUploadPhoto
     * Handler to open upload dialog (stub).
     * TODO: wire this to a real modal/flow.
     */
    const onUploadPhoto = () => {
        logger.info("Upload photo button clicked");
        // TODO: Implement upload modal/modal open handler
    };

    return {
        pendingPhotos: data?.data ?? [],
        isPending,
        isError,
        error,
        onUploadPhoto,
    };
};