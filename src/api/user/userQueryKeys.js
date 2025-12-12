/**
 * TanStack Query keys for User-related queries.
 *
 * Provides a consistent, stable structure for cache keys related to public user endpoints and current user.
 * Use these keys for managing query caches such as public user listing and current user (/me).
 *
 * @see https://tanstack.com/query/v4/docs/react/guides/query-keys
 */

const logger = {
    info: (...args) => console.log('[userQueryKeys]', ...args),
    error: (...args) => console.error('[userQueryKeys]', ...args),
};

/**
 * Top-level user query cache key.
 * @constant
 * @type {Array}
 */
const USER = ['user'];

/**
 * userKeys
 * - Standardized key for user queries.
 *
 * @namespace
 */
export const userKeys = {
    /**
     * Query key for fetching the public (unauthenticated) user list.
     * Used for UI login screens, selectors, etc.
     * @returns {Array}
     */
    public: () => [...USER, 'public-list'],
    /**
     * Query key for fetching the current authenticated user (via /me).
     * Used for hooks and UI to cache 'me' status safely.
     * @returns {Array}
     */
    me: () => [...USER, 'me'],
};