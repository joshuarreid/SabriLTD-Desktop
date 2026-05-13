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
    queryFn: () => searchItems(params),
    enabled: !!params,
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

