import { useQuery } from '@tanstack/react-query';
import { userKeys } from '../api/userQueryKeys';
import { getMe } from '../api/user';

// Define a type for the user object (customize as needed)
type CurrentUser = {
    id: number;
    username: string;
    name?: string;
    email?: string;
    [key: string]: any;
};

type UseCurrentUserResult = {
    user: CurrentUser | null;
    loading: boolean;
    error: Error | null;
};

/**
 * Logger for useCurrentUser.js.
 */
const logger = {
    info: (...args: unknown[]) => console.log('[useCurrentUser]', ...args),
    error: (...args: unknown[]) => console.error('[useCurrentUser]', ...args),
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
export const useCurrentUser = (): UseCurrentUserResult => {
    logger.info('useCurrentUser called');
    const {
        data,
        isLoading,
        isError,
        error,
    } = useQuery<CurrentUser, Error>({
        queryKey: userKeys.me(),
        queryFn: getMe,
        retry: 1,
        staleTime: 60 * 1000, // 1 minute
        onError: (err: Error) => {
            logger.error('Failed to fetch current user via /me:', err);
        },
    });

    logger.info('useCurrentUser query result', { data, isLoading, isError, error });

    return {
        user: isLoading || isError ? null : data ?? null,
        loading: isLoading,
        error: error ?? null,
    };
};