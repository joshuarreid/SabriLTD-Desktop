/**
 * useItemConditionField.js
 *
 * Fetches and caches allowed item condition options via Condition API,
 * using react-query for caching and deduplication.
 * Follows Bulletproof React conventions.
 *
 * @module useItemConditionField
 */

import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { getAllConditions } from "../../../api/condition/condition.js";
import { conditionKeys } from "../../../api/condition/conditionQueryKeys.js";

export interface ConditionOption {
    conditionId: number;
    name: string;
}

export interface UseItemConditionFieldReturn {
    options: ConditionOption[];
    loading: boolean;
    error: string;
    refetch: UseQueryResult<ConditionOption[], Error>["refetch"];
}

/**
 * Standard logger for this hook.
 * @constant
 */
const logger = {
    info: (...args: unknown[]) => console.log('[useItemConditionField]', ...args),
    error: (...args: unknown[]) => console.error('[useItemConditionField]', ...args),
};

/**
 * Fetches allowed item conditions from API, caches forever.
 *
 * @returns {{
 *   options: Array<{conditionId: number, name: string}>,
 *   loading: boolean,
 *   error: string,
 *   refetch: () => void
 * }}
 */
export function useItemConditionField(): UseItemConditionFieldReturn {
    const {
        data,
        isPending,
        isError,
        error,
        refetch,
    } = useQuery<ConditionOption[], Error>({
        queryKey: conditionKeys.lists(),
        queryFn: async () => {
            logger.info("Fetching condition list via Condition API...");
            const result = await getAllConditions();
            logger.info("Received conditions:", result);
            // Be defensive: some APIs return {data: [...]}
            if (Array.isArray(result)) return result as ConditionOption[];
            if (Array.isArray((result as any)?.data)) return (result as any).data as ConditionOption[];
            return [];
        },
        staleTime: Infinity,
        gcTime: Infinity,
    });

    return {
        options: Array.isArray(data) ? data : [],
        loading: isPending,
        error: isError ? error?.message || "Failed to load conditions" : "",
        refetch,
    };
}

export default useItemConditionField;