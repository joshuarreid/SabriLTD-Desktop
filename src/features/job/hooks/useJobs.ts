import { useQuery, useMutation, useQueryClient, UseMutationOptions } from "@tanstack/react-query";
import { jobKeys } from "../api/jobQueryKeys";
import {
  createJob,
  getAllJobs,
  searchJobs,
  getJobById,
  updateJob,
  deleteJob
} from "../api/job";
import type { Job } from "../api/job.types";

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
