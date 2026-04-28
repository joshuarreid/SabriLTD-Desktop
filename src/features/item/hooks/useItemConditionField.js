/**
 * useItemConditionField.js
 *
 * Fetches and caches allowed item condition options via Condition API,
 * using react-query for caching and deduplication.
 * Follows Bulletproof React conventions.
 *
 * @module useItemConditionField
 */

import { useQuery } from '@tanstack/react-query';
import { getAllConditions } from "../../../api/condition/condition.js";
import { conditionKeys } from "../../../api/condition/conditionQueryKeys.js";


/**
 * Standard logger for this hook.
 * @constant
 */
const logger = {
    info: (...args) => console.log('[useItemConditionField]', ...args),
    error: (...args) => console.error('[useItemConditionField]', ...args),
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
export function useItemConditionField() {
    const {
        data,
        isPending,
        isError,
        error,
        refetch,
    } = useQuery({
        queryKey: conditionKeys.lists(),
        queryFn: async () => {
            logger.info('Fetching condition list via Condition API...');
            const result = await getAllConditions();
            logger.info('Received conditions:', result);
            return result;
        },
        staleTime: Infinity,
        cacheTime: Infinity,
    });

    return {
        options: Array.isArray(data) ? data : [],
        loading: isPending,
        error: isError ? error?.message || 'Failed to load conditions' : '',
        refetch,
    };
}

export default useItemConditionField;