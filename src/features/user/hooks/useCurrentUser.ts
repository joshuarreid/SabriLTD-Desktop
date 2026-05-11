import { useCurrentUserQuery } from './useUsers';

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

    const { data, isLoading, isError, error } = useCurrentUserQuery();

    logger.info('useCurrentUser query result', { data, isLoading, isError, error });

    return {
        user: isLoading || isError ? null : data ?? null,
        loading: isLoading,
        error: error ?? null,
    };
};