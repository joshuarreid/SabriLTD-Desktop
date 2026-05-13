import { useQuery, useMutation, useQueryClient, UseMutationOptions } from "@tanstack/react-query";
import { itemKeys } from "../api/ItemQueryKeys";
import {
  getAllItems,
  searchItems,
  getItemById,
  getItemDetails,
  createItem,
  updateItem,
  deleteItem
} from "../api/item";
import type { Item } from "../api/item.types";

// Fetch all items
export function useAllItems(params: Record<string, unknown> = {}) {
  return useQuery({
    queryKey: itemKeys.lists(),
    queryFn: () => getAllItems(params),
  });
}

// Search items
export function useSearchItems(params: Record<string, unknown>) {
  return useQuery({
    queryKey: itemKeys.search(params),
    queryFn: async () => {
      const response = await searchItems(params);

      if (
        response?.status !== "OK" &&
        response?.status !== "success" &&
        response?.status !== 200
      ) {
        throw new Error(
          response?.errors?.length
            ? response.errors.map((e: any) => e.message).join(", ")
            : "Search failed"
        );
      }

      const raw = response?.data;
      const hits = Array.isArray(raw?.hits) ? raw.hits : [];
      const hitsCount = typeof raw?.hitsCount === "number" ? raw.hitsCount : hits.length;
      const totalHits = typeof raw?.totalHits === "number" ? raw.totalHits : hitsCount;
      const page = typeof raw?.page === "number" && raw.page > 0 ? raw.page : 1;
      const size = typeof raw?.size === "number" && raw.size > 0 ? raw.size : hits.length || 0;
      const sort = typeof raw?.sort === "string" ? raw.sort : null;
      const includeArchived = typeof raw?.includeArchived === "boolean" ? raw.includeArchived : null;

      return { hits, hitsCount, totalHits, page, size, sort, includeArchived };
    },
    enabled: !!params,
    keepPreviousData: true,
  });
}

// Fetch item by ID
export function useItemById(itemId: string | number) {
  return useQuery({
    queryKey: itemKeys.detail(itemId),
    queryFn: () => getItemById(itemId),
    enabled: !!itemId,
  });
}

// Fetch item details by ID
export function useItemDetails(itemId: string | number) {
  return useQuery({
    queryKey: itemKeys.details(itemId),
    queryFn: () => getItemDetails(itemId),
    enabled: !!itemId,
  });
}

// Create item
export function useCreateItem(options?: UseMutationOptions<Item | null, unknown, Item>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createItem,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: itemKeys.lists() });
      options?.onSuccess?.(...args);
    },
    ...options,
  });
}

// Update item
export function useUpdateItem(options?: UseMutationOptions<Item | null, unknown, { itemId: string | number; item: Item }>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, item }) => updateItem(itemId, item),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: itemKeys.lists() });
      options?.onSuccess?.(...args);
    },
    ...options,
  });
}

// Delete item
export function useDeleteItem(options?: UseMutationOptions<void, unknown, string | number>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteItem,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: itemKeys.lists() });
      options?.onSuccess?.(...args);
    },
    ...options,
  });
}
