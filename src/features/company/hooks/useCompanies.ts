import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { companyKeys } from '../api/companyQueryKeys';
import {
  getAllCompanies,
  getCompanyById,
  createCompany,
  updateCompany,
  deleteCompany,
  getCompaniesWithJobs,
} from '../api/company';
import type {
  Company,
  CompanyListResponse,
  CompanyResponse,
  CompanyWithJobsListResponse,
} from '../api/company.types';

/**
 * Fetch all companies (optionally filtered/paginated)
 * @param {Record<string, unknown>} params
 */
export function useAllCompanies(params: Record<string, unknown> = {}) {
  return useQuery<CompanyListResponse>({
    queryKey: companyKeys.lists(),
    queryFn: () => getAllCompanies(params),
  });
}

/**
 * Fetch a company by ID
 * @param {number|string} companyId
 */
export function useCompanyById(companyId: number | string) {
  return useQuery<CompanyResponse>({
    queryKey: companyKeys.detail(companyId),
    queryFn: () => getCompanyById(companyId),
    enabled: !!companyId,
  });
}

/**
 * Create a new company
 */
export function useCreateCompany() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: companyKeys.create(),
    mutationFn: createCompany,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: companyKeys.lists() });
    },
  });
}

/**
 * Update an existing company
 */
export function useUpdateCompany() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ companyId, company }: { companyId: number | string; company: Company }) =>
      updateCompany(companyId, company),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: companyKeys.detail(variables.companyId) });
      queryClient.invalidateQueries({ queryKey: companyKeys.lists() });
    },
  });
}

/**
 * Fetch all companies with their jobs (aggregate endpoint)
 * @param {Record<string, unknown>} params
 */
export function useCompaniesWithJobs(params: Record<string, unknown> = {}) {
  return useQuery<CompanyWithJobsListResponse>({
    queryKey: companyKeys.withJobs(params),
    queryFn: () => getCompaniesWithJobs(params),
  });
}

/**
 * Delete a company by ID
 */
export function useDeleteCompany() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (companyId: number | string) => deleteCompany(companyId),
    onSuccess: (_data, companyId) => {
      queryClient.invalidateQueries({ queryKey: companyKeys.lists() });
      queryClient.invalidateQueries({ queryKey: companyKeys.detail(companyId) });
    },
  });
}

