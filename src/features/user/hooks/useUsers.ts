import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import {
    createUser,
    deleteUser,
    getAllUsers,
    getMe,
    getPublicUsers,
    getUserById,
    updateUser,
} from "../api/user";
import { userKeys } from "../api/userQueryKeys";
import type {
    PublicUserListResponse,
    UserCreateInput,
    UserListResponse,
    UserResponse,
    UserUpdateInput,
} from "../api/user.types";

const logger = {
    info: (...args: unknown[]) => console.log("[useUsers]", ...args),
    error: (...args: unknown[]) => console.error("[useUsers]", ...args),
};

/**
 * Centralized query invalidation for user-related operations.
 * Mirrors the pattern used by storage/building settings, and keeps query-key knowledge in one place.
 */
export const invalidateAllUserKeys = async (queryClient: QueryClient, userId?: number) => {
    await queryClient.invalidateQueries({ queryKey: userKeys.all });
    await queryClient.invalidateQueries({ queryKey: userKeys.lists() });
    await queryClient.invalidateQueries({ queryKey: userKeys.list() });
    await queryClient.invalidateQueries({ queryKey: userKeys.public() });
    await queryClient.invalidateQueries({ queryKey: userKeys.publicList() });
    await queryClient.invalidateQueries({ queryKey: userKeys.me() });

    if (userId !== undefined && userId !== null) {
        await queryClient.invalidateQueries({ queryKey: userKeys.detail(userId) });
        await queryClient.invalidateQueries({ queryKey: userKeys.update(userId) });
        await queryClient.invalidateQueries({ queryKey: userKeys.remove(userId) });
    }
};

// --- Queries ---

export function useUsersList() {
    return useQuery<UserListResponse, Error>({
        queryKey: userKeys.lists(),
        queryFn: getAllUsers,
    });
}

export function useUserById(userId?: number) {
    return useQuery<UserResponse, Error>({
        queryKey: userId ? userKeys.detail(userId) : userKeys.detail("unknown"),
        queryFn: () => getUserById(userId as number),
        enabled: !!userId,
    });
}

export function useCurrentUserQuery() {
    return useQuery<UserResponse, Error>({
        queryKey: userKeys.me(),
        queryFn: getMe,
        retry: 1,
        staleTime: 60 * 1000,
    });
}

export function usePublicUsers() {
    return useQuery<PublicUserListResponse, Error>({
        queryKey: userKeys.public(),
        queryFn: getPublicUsers,
    });
}

// --- Mutations ---

export function useCreateUser() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload: UserCreateInput) => createUser(payload),
        onSuccess: async (created: UserResponse) => {
            logger.info("User created; invalidating user keys");
            await invalidateAllUserKeys(queryClient, created?.userId);
        },
    });
}

export function useUpdateUser() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ userId, payload }: { userId: number; payload: UserUpdateInput }) => updateUser(userId, payload),
        onSuccess: async (updated: UserResponse, { userId }) => {
            logger.info("User updated; invalidating user keys", { userId });
            await invalidateAllUserKeys(queryClient, updated?.userId ?? userId);
        },
    });
}

export function useDeleteUser() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (userId: number) => deleteUser(userId),
        onSuccess: async (_void, userId) => {
            logger.info("User deleted; invalidating user keys", { userId });
            await invalidateAllUserKeys(queryClient, userId);
        },
    });
}
