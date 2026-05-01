import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tagKeys } from '../api/tagQueryKeys';
import {
  createTag,
  getAllTags,
  getTagById,
  updateTag,
  deleteTag,
} from '../api/tag';
import type { Tag, TagListResponse, TagResponse } from '../api/tag.types';

/**
 * Fetch all tags (optionally filtered/paginated)
 * @param {Record<string, unknown>} params
 */
export function useAllTags(params: Record<string, unknown> = {}) {
  return useQuery<TagListResponse>({
    queryKey: tagKeys.list(params), // <-- FIXED: include params in query key
    queryFn: () => getAllTags(params),
  });
}

/**
 * Fetch a tag by ID
 * @param {number|string} tagId
 */
export function useTagById(tagId: number | string) {
  return useQuery<TagResponse>({
    queryKey: tagKeys.detail(Number(tagId)),
    queryFn: () => getTagById(Number(tagId)),
    enabled: !!tagId,
  });
}

/**
 * Create a new tag
 */
export function useCreateTag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: tagKeys.create(),
    mutationFn: createTag,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tagKeys.lists() });
    },
  });
}

/**
 * Update an existing tag
 */
export function useUpdateTag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ tagId, tag }: { tagId: number | string; tag: Tag }) =>
      updateTag(Number(tagId), tag),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: tagKeys.detail(Number(variables.tagId)) });
      queryClient.invalidateQueries({ queryKey: tagKeys.lists() });
    },
  });
}

/**
 * Delete a tag by ID
 */
export function useDeleteTag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (tagId: number | string) => deleteTag(Number(tagId)),
    onSuccess: (_data, tagId) => {
      queryClient.invalidateQueries({ queryKey: tagKeys.lists() });
      queryClient.invalidateQueries({ queryKey: tagKeys.detail(Number(tagId)) });
    },
  });
}
