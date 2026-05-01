import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { photoKeys } from '../api/photoQueryKeys';
import {
  uploadPhoto,
  getAllPhotos,
  getPendingPhotos,
  getPhotoById,
  deletePhoto,
} from '../api/photo';
import type { Photo, PhotoListResponse } from '../api/photo.types';

/**
 * Fetch all photos
 */
export function useAllPhotos() {
  return useQuery<PhotoListResponse>({
    queryKey: photoKeys.lists(),
    queryFn: getAllPhotos,
  });
}

/**
 * Fetch all pending photos
 */
export function usePendingPhotos() {
  return useQuery<PhotoListResponse>({
    queryKey: photoKeys.pendingList(),
    queryFn: getPendingPhotos,
  });
}

/**
 * Fetch a photo by ID
 */
export function usePhotoById(photoId: number | string) {
  return useQuery<Photo | null>({
    queryKey: photoKeys.detail(photoId),
    queryFn: () => getPhotoById(Number(photoId)),
    enabled: !!photoId,
  });
}

/**
 * Upload a photo (mutation)
 */
export function useUploadPhoto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: photoKeys.upload(),
    mutationFn: uploadPhoto,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: photoKeys.lists() });
      queryClient.invalidateQueries({ queryKey: photoKeys.pendingList() });
    },
  });
}

/**
 * Delete a photo by ID (mutation)
 */
export function useDeletePhoto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (photoId: number | string) => deletePhoto(Number(photoId)),
    onSuccess: (_data, photoId) => {
      queryClient.invalidateQueries({ queryKey: photoKeys.lists() });
      queryClient.invalidateQueries({ queryKey: photoKeys.detail(photoId) });
      queryClient.invalidateQueries({ queryKey: photoKeys.pendingList() });
    },
  });
}

