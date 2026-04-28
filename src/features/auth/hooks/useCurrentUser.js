import { useQuery } from '@tanstack/react-query';
import {userKeys} from "../../../api/user/userQueryKeys.js";
import { getMe } from '../../../api/user/user.js';

/**
 * Logger for useCurrentUser.js.
 */
const logger = {
    info: (...args) => console.log('[useCurrentUser]', ...args),
    error: (...args) => console.error('[useCurrentUser]', ...args),
};

/**
 * useCurrentUser
 * Fetches the current authenticated user from the /me API endpoint using react-query.
 *
 * @returns {{
 *   user: object | null,
 *   loading: boolean,
 *   error: any
 * }}
 */
export const useCurrentUser = () => {
    logger.info('useCurrentUser called');
    const {
        data,
        isLoading,
        isError,
        error,
    } = useQuery({
        queryKey: userKeys.me(),
        queryFn: getMe,
        retry: 1,
        staleTime: 60 * 1000, // 1 minute
        onError: (err) => {
            logger.error('Failed to fetch current user via /me:', err);
        },
    });

    logger.info('useCurrentUser query result', { data, isLoading, isError, error });

    return {
        user: isLoading || isError ? null : data,
        loading: isLoading,
        error,
    };
};