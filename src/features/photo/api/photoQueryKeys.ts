/**
 * Query keys for Photo-related TanStack queries & mutations.
 * Follows canonical key patterns to prevent cache bugs and ensure uniform query shapes.
 */

export const PHOTO: readonly ["photo"] = ["photo"] as const;

export const photoKeys = {
    /**
     * The root key for all photo queries.
     */
    all: PHOTO,

    /**
     * Key for all photo lists (with/without filters/pagination).
     */
    lists: (): readonly ["photo", "lists"] => [...PHOTO, "lists"] as const,

    /**
     * Key for a filtered photos list.
     */
    list: (filters: Record<string, any> = {}): readonly ["photo", "lists", { filters: Record<string, any> }] => [...photoKeys.lists(), { filters }] as const,

    /**
     * Key for all pending photo lists.
     */
    pendingLists: (): readonly ["photo", "pending", "lists"] => [...PHOTO, "pending", "lists"] as const,

    /**
     * Key for a filtered pending photos list.
     */
    pendingList: (filters: Record<string, any> = {}): readonly ["photo", "pending", "lists", { filters: Record<string, any> }] => [...photoKeys.pendingLists(), { filters }] as const,

    /**
     * Key for a single photo detail by id.
     */
    detail: (photoId: number | string): readonly ["photo", "detail", number | string] => [...PHOTO, "detail", photoId] as const,

    /**
     * Key for upload mutation.
     */
    upload: (): readonly ["photo", "upload"] => [...PHOTO, "upload"] as const,

    /**
     * Key for update mutation by id.
     */
    update: (photoId: number | string): readonly ["photo", "detail", number | string, "update"] => [...PHOTO, "detail", photoId, "update"] as const,

    /**
     * Key for remove mutation by id.
     */
    remove: (photoId: number | string): readonly ["photo", "detail", number | string, "remove"] => [...PHOTO, "detail", photoId, "remove"] as const,
};