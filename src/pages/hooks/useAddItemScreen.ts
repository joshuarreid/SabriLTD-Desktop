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
import { photoKeys } from "../../features/photo/api/photoQueryKeys";
import { getPendingPhotos } from "../../features/photo/api/photo";

const logger = {
    info: (...args: any[]) => console.log("[useAddItemScreen]", ...args),
    error: (...args: any[]) => console.error("[useAddItemScreen]", ...args),
};

interface PendingPhoto {
    // Define the shape of a pending photo if known, otherwise use 'any'
    [key: string]: any;
}

interface UsePendingPhotosResult {
    pendingPhotos: PendingPhoto[];
    isPending: boolean;
    isError: boolean;
    error: Error | null;
    onUploadPhoto: () => void;
}

export const usePendingPhotos = (): UsePendingPhotosResult => {
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
        error: error as Error | null,
        onUploadPhoto,
    };
};