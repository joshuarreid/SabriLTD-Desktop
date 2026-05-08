import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAllStorage, getStorageById, createStorage, updateStorage, deleteStorage } from "../api/storage";
import { storageKeys } from "../api/storageQueryKeys";
import type { Storage, StorageListResponse, StorageResponse } from "../api/storage.types";

export function useAllStorage(buildingId?: number) {
    return useQuery<StorageListResponse>({
        queryKey: storageKeys.list({ buildingId }),
        queryFn: () => getAllStorage(buildingId ? { buildingId } : {}),
    });
}

export function useStorageById(storageId: number) {
    return useQuery<StorageResponse>({
        queryKey: storageKeys.detail(storageId),
        queryFn: () => getStorageById(storageId),
        enabled: !!storageId,
    });
}

export function useCreateStorage() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createStorage,
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: storageKeys.lists() });
            if (data?.data?.buildingId)
                queryClient.invalidateQueries({ queryKey: storageKeys.list({ buildingId: data.data.buildingId }) });
        },
    });
}

export function useUpdateStorage() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ storageId, payload }: { storageId: number; payload: Partial<Storage> }) => updateStorage(storageId, payload),
        onSuccess: (data, { storageId, payload }) => {
            queryClient.invalidateQueries({ queryKey: storageKeys.detail(storageId) });
            if (payload.buildingId)
                queryClient.invalidateQueries({ queryKey: storageKeys.list({ buildingId: payload.buildingId }) });
        },
    });
}

export function useDeleteStorage() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (storageId: number) => deleteStorage(storageId),
        onSuccess: (_data, storageId) => {
            queryClient.invalidateQueries({ queryKey: storageKeys.lists() });
            // Optionally, invalidate detail/list for the deleted storage's building if you have that info
        },
    });
}

