/**
 * Query keys for Tag-related TanStack queries & mutations.
 * Follows canonical key patterns to prevent cache bugs and ensure uniform query shapes.
 */

export const TAG = ['tag'] as const;

export const tagKeys = {
    /**
     * The root key for all tag queries.
     */
    all: TAG,

    /**
     * Key for all tag lists (with/without filters/pagination).
     */
    lists: (): readonly string[] => [...TAG, 'lists'],

    /**
     * Key for a filtered tag list.
     * Accepts plain filters (mirroring storageKeys.list) so we can include categoryId or
     * any other filter in a canonical way. These filters map directly to query params
     * for GET /api/tag (e.g., { categoryId, page, size, sortField, sortOrder, name }).
     */
    list: (filters: Record<string, any> = {}): readonly [string, string, Record<string, any>] => [...TAG, 'lists', filters],

    /**
     * Key for a tag detail query by tagId.
     */
    detail: (tagId: number): readonly [string, string, number] => [...TAG, 'detail', tagId],

    /**
     * Key for tag creation mutation.
     */
    create: (): readonly [string, string] => [...TAG, 'create'],

    /**
     * Key for tag update mutation by tagId.
     */
    update: (tagId: number): readonly [string, string, number, string] => [...TAG, 'detail', tagId, 'update'],

    /**
     * Key for tag removal mutation by tagId.
     */
    remove: (tagId: number): readonly [string, string, number, string] => [...TAG, 'detail', tagId, 'remove'],
};