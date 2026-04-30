import type { QueryKey } from '@tanstack/react-query';

/**
 * Query keys for Company-related TanStack queries & mutations.
 *
 * Follows the same shape as userQueryKeys so cache invalidation is consistent across features.
 */

/**
 * Top-level company query cache key.
 * @constant
 * @type {Array}
 */
export const COMPANY = ["company"] as const;

/**
 * Canonical Company query/mutation cache keys.
 */
export const companyKeys = {
    /**
     * Root key
     */
    all: COMPANY as QueryKey,

    /**
     * Lists root
     */
    lists: (): QueryKey => [...COMPANY, "lists"],

    /**
     * Filtered list key
     * @param {object} filters
     */
    list: (filters: Record<string, unknown> = {}): QueryKey => [...companyKeys.lists(), { filters }],

    /**
     * Single company detail
     * @param {number|string} companyId
     */
    detail: (companyId: number | string): QueryKey => [...COMPANY, "detail", companyId],

    /**
     * Aggregate companies-with-jobs key
     * @param {object} params
     */
    withJobs: (params: Record<string, unknown> = {}): QueryKey => [...COMPANY, "with-jobs", { params }],

    /**
     * Create mutation key
     */
    create: (): QueryKey => [...COMPANY, "create"],

    /**
     * Update mutation key
     * @param {number|string} companyId
     */
    update: (companyId: number | string) => [...companyKeys.detail(companyId), "update"],

    /**
     * Remove mutation key
     * @param {number|string} companyId
     */
    remove: (companyId: number | string) => [...companyKeys.detail(companyId), "remove"],
};