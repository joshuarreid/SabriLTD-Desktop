import { useQuery, useMutation, useQueryClient, UseMutationOptions } from "@tanstack/react-query";
import { jobKeys } from "../api/jobQueryKeys";

import {
  createJob,
  getAllJobs,
  searchJobs,
  getJobById,
  updateJob,
  deleteJob,
  getJobClients,
  updateJobItems
} from "../api/job";
import { getItemById, updateItem } from "../../item/api/item";
import type { Job } from "../api/job.types";
import itemKeys from "../../item/api/ItemQueryKeys";

// Fetch all jobs
export function useAllJobs(params: Record<string, unknown> = {}) {
  return useQuery({
    queryKey: jobKeys.lists(),
    queryFn: () => getAllJobs(params),
  });
}

// Search jobs
export function useSearchJobs(params: Record<string, unknown>) {
  return useQuery({
    queryKey: jobKeys.search(params),
    queryFn: () => searchJobs(params),
    enabled: !!params,
  });
}

// Fetch job by ID
export function useJobById(jobId: string) {
  return useQuery({
    queryKey: jobKeys.detail(jobId),
    queryFn: () => getJobById(jobId),
    enabled: !!jobId,
  });
}

// Fetch job clients by companyId
export function useJobClients(params: Record<string, unknown>) {
  return useQuery({
    queryKey: jobKeys.clientsList(params),
    queryFn: () => getJobClients(params),
    enabled: !!params && !!params.companyId,
  });
}

export function useCreateJob(options: UseMutationOptions<any, any, Job> = {}) {
  const queryClient = useQueryClient();
  return useMutation<any, any, Job>({
    mutationKey: jobKeys.create(),
    mutationFn: createJob,
    ...options,
    onSuccess: async (data, variables, context, mutation) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: jobKeys.lists() }),
        queryClient.invalidateQueries({ queryKey: jobKeys.search({}) }),
        queryClient.invalidateQueries({ queryKey: jobKeys.clients() }),
        queryClient.invalidateQueries({ queryKey: jobKeys.companies() }),
      ]);
      if (options.onSuccess) options.onSuccess(data, variables, context, mutation);
    },
  });
}

// Update job mutation
export function useUpdateJob(options: UseMutationOptions<any, any, { jobId: string, job: Job }> = {}) {
  const queryClient = useQueryClient();
  return useMutation<any, any, { jobId: string, job: Job }>({
    mutationKey: jobKeys.update("update"), // static key, or you can omit mutationKey
    mutationFn: ({ jobId, job }) => updateJob(jobId, job),
    ...options,
    onSuccess: async (data, variables, context, mutation) => {
      if (variables?.jobId) {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: jobKeys.detail(variables.jobId) }),
          queryClient.invalidateQueries({ queryKey: jobKeys.lists() }),
        ]);
      }
      if (options.onSuccess) options.onSuccess(data, variables, context, mutation);
    },
  });
}

// Delete job mutation
export function useDeleteJob(options: UseMutationOptions<any, any, string> = {}) {
  const queryClient = useQueryClient();
  return useMutation<any, any, string>({
    mutationKey: jobKeys.remove("remove"), // static key, or you can omit mutationKey
    mutationFn: (jobId: string) => deleteJob(jobId),
    ...options,
    onSuccess: async (data, jobId, context, mutation) => {
      if (jobId) {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: jobKeys.lists() }),
          queryClient.invalidateQueries({ queryKey: jobKeys.detail(jobId) }),
        ]);
      }
      if (options.onSuccess) options.onSuccess(data, jobId, context, mutation);
    },
  });
}

// Update job items mutation
export function useUpdateJobItems(options: UseMutationOptions<any, any, { jobId: string | number, itemIds: (string | number)[] }> = {}) {
  const queryClient = useQueryClient();
  return useMutation<any, any, { jobId: string | number, itemIds: (string | number)[] }>({
    mutationKey: jobKeys.update("update-items"),
    mutationFn: ({ jobId, itemIds }) => updateJobItems(jobId, itemIds),
    ...options,
    onSuccess: async (data, variables, context, mutation) => {
      if (variables?.jobId) {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: jobKeys.detail(variables.jobId) }),
          queryClient.invalidateQueries({ queryKey: jobKeys.lists() }),
        ]);
      }
      if (options.onSuccess) options.onSuccess(data, variables, context, mutation);
    },
  });
}

// Add items to job mutation
export function useAddItemsToJob(options: UseMutationOptions<any, any, { jobId: string | number, itemIds: (string | number)[] }> = {}) {
  const queryClient = useQueryClient();
  return useMutation<any, any, { jobId: string | number, itemIds: (string | number)[] }>({
    mutationKey: jobKeys.update("add-items"),
    mutationFn: async ({ jobId, itemIds }) => {
      // For each item, fetch and update
      const results = [];
      for (const itemId of itemIds) {
        const fullItem = await getItemById(itemId);
        if (!fullItem) throw new Error(`Failed to fetch item ${itemId}`);
        const existingJobIds = Array.isArray(fullItem.jobIds)
          ? fullItem.jobIds.map(Number)
          : [];
        const jobIdNum = typeof jobId === "string" ? parseInt(jobId as string, 10) : jobId;
        const newJobIds = existingJobIds.includes(jobIdNum)
          ? existingJobIds
          : [...existingJobIds, jobIdNum];
        const payload = {
          name: fullItem.name,
          description: fullItem.description ?? null,
          conditionId: fullItem.conditionId ?? null,
          jobIds: Array.isArray(newJobIds) ? newJobIds.map(Number) : [],
          storageId: fullItem.storageId ?? null,
          storageDesc: fullItem.storageDesc ?? null,
          photoIds: Array.isArray(fullItem.photoIds) ? fullItem.photoIds.map(Number) : [],
          tagIds: Array.isArray(fullItem.tagIds)
            ? fullItem.tagIds.map((tag: any) => typeof tag === "object" && tag !== null ? Number(tag.id) : Number(tag))
            : [],
          comments: Array.isArray(fullItem.comments) ? fullItem.comments : [],
          updatedBy: fullItem.updatedBy ?? null,
          archived: typeof fullItem.archived === "boolean" ? fullItem.archived : false,
        };
        const result = await updateItem(itemId, payload);
        results.push(result);
      }
      return results;
    },
    ...options,
    onSuccess: async (data, variables, context, mutation) => {
      // Invalidate all relevant queries
      if (variables?.itemIds) {
        await Promise.all(
          variables.itemIds.map(async (itemId) => {
            await queryClient.invalidateQueries({ queryKey: itemKeys.detail(itemId) });
            await queryClient.invalidateQueries({ queryKey: itemKeys.details(itemId) });
          })
        );
      }
      if (variables?.jobId) {
        await queryClient.invalidateQueries({ queryKey: jobKeys.detail(variables.jobId) });
        await queryClient.invalidateQueries({ queryKey: jobKeys.lists() });
      }
      await queryClient.invalidateQueries({ queryKey: itemKeys.lists() });
      await queryClient.invalidateQueries({ queryKey: itemKeys.search() });
      if (options.onSuccess) options.onSuccess(data, variables, context, mutation);
    },
  });
}

// Utility hook to manually invalidate a job's cache (detail and lists)
export function useInvalidateJob(jobId: string | number) {
  const queryClient = useQueryClient();
  return () => {
    if (jobId) {
      queryClient.invalidateQueries({ queryKey: jobKeys.detail(jobId) });
      queryClient.invalidateQueries({ queryKey: jobKeys.lists() });
    }
  };
}
