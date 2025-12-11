import { useAuth } from '../../login/hooks/useAuth';

/**
 * useCurrentUser
 * - Business logic hook for accessing current authenticated user.
 *
 * @returns {{ user: object|null, loading: boolean }}
 */
const logger = {
    info: (...args) => console.log('[useCurrentUser]', ...args),
    error: (...args) => console.error('[useCurrentUser]', ...args),
};

export const useCurrentUser = () => {
    logger.info('useCurrentUser called');
    const { user, isAuthenticated, loading } = useAuth();
    return { user: isAuthenticated ? user : null, loading };
};