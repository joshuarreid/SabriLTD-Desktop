import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { buildingKeys } from '../api/buildingQueryKeys';
import {
  createBuilding,
  getAllBuildings,
  getBuildingById,
  updateBuilding,
  deleteBuilding,
  getBuildingsWithStorage,
} from '../api/building';
import type { Building, BuildingListResponse, BuildingResponse } from '../api/building.types';

/**
 * Fetch all buildings (optionally filtered/paginated)
 * @param {Record<string, unknown>} params
 */
export function useAllBuildings(params: Record<string, unknown> = {}) {
  return useQuery<BuildingListResponse>({
    queryKey: buildingKeys.lists(),
    queryFn: () => getAllBuildings(params),
  });
}

/**
 * Fetch a building by ID
 * @param {number|string} buildingId
 */
export function useBuildingById(buildingId: number | string) {
  return useQuery<BuildingResponse>({
    queryKey: buildingKeys.detail(buildingId),
    queryFn: () => getBuildingById(buildingId),
    enabled: !!buildingId,
  });
}

/**
 * Create a new building
 */
export function useCreateBuilding() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: buildingKeys.create(),
    mutationFn: createBuilding,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: buildingKeys.lists() });
    },
  });
}

/**
 * Update an existing building
 */
export function useUpdateBuilding() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ buildingId, building }: { buildingId: number | string; building: Building }) =>
      updateBuilding(buildingId, building),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: buildingKeys.detail(variables.buildingId) });
      queryClient.invalidateQueries({ queryKey: buildingKeys.lists() });
    },
  });
}

/**
 * Fetch all buildings with their storage (aggregate endpoint)
 * @param {Record<string, unknown>} params
 */
export function useBuildingsWithStorage(params: Record<string, unknown> = {}) {
  return useQuery({
    queryKey: buildingKeys.withStorageList(params),
    queryFn: () => getBuildingsWithStorage(params),
  });
}

/**
 * Delete a building by ID
 */
export function useDeleteBuilding() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (buildingId: number | string) => deleteBuilding(buildingId),
    onSuccess: (_data, buildingId) => {
      queryClient.invalidateQueries({ queryKey: buildingKeys.lists() });
      queryClient.invalidateQueries({ queryKey: buildingKeys.detail(buildingId) });
    },
  });
}
