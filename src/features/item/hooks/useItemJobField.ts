/**
 * useItemJobField.js
 *
 * Fetches jobs for item-job pill selection.
 * Returns recent jobs (sorted by dateAdded DESC) or search results, using Sabri Inventory Job API.
 * Handles all errors and status states per Bulletproof React conventions.
 * No prop drilling/context dependency. JSDoc and logger for traceability.
 *
 * @module useItemJobField
 * @param {Object} params
 * @param {string} params.search - The current search string
 * @returns {{
 *   jobs: Array<{jobId: number, name: string}>,
 *   loading: boolean,
 *   error: string
 * }}
 */

import { useMemo } from "react";
import { useAllJobs, useSearchJobs } from "../../job/hooks/useJobs";
import type { Job } from "../../job/api/job.types";

export interface JobPill {
    jobId: number;
    name: string;
}

export interface UseItemJobFieldParams {
    search?: string;
}

export interface UseItemJobFieldReturn {
    jobs: JobPill[];
    loading: boolean;
    error: string;
}

/**
 * logger for useItemJobField
 */
const logger = {
    info: (...args: unknown[]) => console.log("[useItemJobField]", ...args),
    error: (...args: unknown[]) => console.error("[useItemJobField]", ...args),
};

function isJobArray(value: unknown): value is Job[] {
    return Array.isArray(value);
}

/**
 * Maps and sorts jobs for pill grid usage.
 * - Sort by dateAdded DESC (null-safe)
 * - Map to {jobId, name}
 */
function processJobs(jobsArray: Job[]): JobPill[] {
    return [...jobsArray]
        .sort((a, b) => {
            const bDate = (b as any)?.dateAdded ? new Date((b as any).dateAdded).getTime() : 0;
            const aDate = (a as any)?.dateAdded ? new Date((a as any).dateAdded).getTime() : 0;
            return bDate - aDate;
        })
        .map((job) => ({
            jobId: Number(job.jobId),
            name: String(job.name ?? ""),
        }))
        .filter((j) => Number.isFinite(j.jobId) && !!j.name);
}

/**
 * useItemJobField
 * Fetches recent jobs (sorted) or search results, for item-job pill selection.
 * Delegates fetching/key logic to `useJobs.ts`.
 */
export function useItemJobField({ search = "" }: UseItemJobFieldParams = {}): UseItemJobFieldReturn {
    const DEFAULT_PAGE_SIZE = 12;
    const JOB_SORT_FIELD = "dateAdded";
    const JOB_SORT_ORDER = "desc";

    const trimmed = (search || "").trim();

    const listParams = useMemo(() => ({
        page: 1,
        size: DEFAULT_PAGE_SIZE,
        sortField: JOB_SORT_FIELD,
        sortOrder: JOB_SORT_ORDER,
    }), []);

    const searchParams = useMemo(() => {
        if (!trimmed) return null;
        return {
            q: trimmed,
            page: 1,
            size: DEFAULT_PAGE_SIZE,
            sortField: JOB_SORT_FIELD,
            sortOrder: JOB_SORT_ORDER,
        };
    }, [trimmed]);

    const listQuery = useAllJobs(listParams);
    const searchQuery = useSearchJobs((searchParams || {}) as Record<string, unknown>);

    // When searching: use searchQuery; otherwise recent list.
    const active = trimmed ? searchQuery : listQuery;

    const raw = useMemo<Job[]>(() => {
        const data = (active as any)?.data;
        // Most endpoints return { status, data: Job[] }
        if (data && isJobArray((data as any).data)) return (data as any).data;
        // Some wrappers might already return Job[]
        if (isJobArray(data)) return data;
        return [];
    }, [active, trimmed]);

    const jobs = useMemo(() => {
        const processed = processJobs(raw);
        return processed.slice(0, DEFAULT_PAGE_SIZE);
    }, [raw]);

    const loading = !!(active as any)?.isPending;
    const isError = !!(active as any)?.isError;
    const err = (active as any)?.error as any;

    if (isError) {
        logger.error("Failed to load jobs", err);
    }

    logger.info("useItemJobField", {
        isSearch: !!trimmed,
        query: trimmed,
        results: jobs.length,
    });

    return {
        jobs,
        loading,
        error: isError ? (err?.message || "Failed to load jobs") : "",
    };
}

export default useItemJobField;