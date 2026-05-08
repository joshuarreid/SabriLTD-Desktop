import { useState } from "react";
import { useQuery, useMutation, useQueryClient, QueryClient } from "@tanstack/react-query";
import { createUser, deleteUser, getAllUsers, getMe, updateUser } from "../../../api/user/user";
import { userKeys } from "../../../api/user/userQueryKeys";

// --- Types ---
export type User = {
    userId: number;
    name: string;
    email: string;
    [key: string]: any;
};

export type UserInput = {
    name: string;
    email: string;
    [key: string]: any;
};

type Status = 'idle' | 'saving' | 'saved' | 'error';

type UseUserSettingsTabReturn = {
    users: User[];
    me?: User;
    isPending: boolean;
    isError: boolean;
    error: Error | null;
    editingId: number | null;
    removingId: number | null;
    addingUser: boolean;
    openAddUser: () => void;
    handleAddUser: (user: UserInput, callback?: (error: Error | null) => void) => void;
    handleEditUser: (userId: number) => void;
    handleSaveEdit: (userId: number, user: UserInput, callback?: (error: Error | null) => void) => void;
    handleRemoveUser: (userId: number) => void;
    confirmRemoveUser: (userId: number) => void;
    cancelRemoveUser: () => void;
    cancelEditOrAdd: () => void;
    editStatus: Status;
    addStatus: Status;
    deleteUserMutation: ReturnType<typeof useMutation>;
};

const logger = {
    info: (...args: unknown[]) => console.log('[useUserSettingsTab]', ...args),
    error: (...args: unknown[]) => console.error('[useUserSettingsTab]', ...args),
};

const invalidateAllUserKeys = async (queryClient: QueryClient, user?: User) => {
    logger.info('Invalidating all relevant user query keys');
    await queryClient.invalidateQueries({ queryKey: userKeys.all });
    await queryClient.invalidateQueries({ queryKey: userKeys.lists() });
    await queryClient.invalidateQueries({ queryKey: userKeys.list() });
    if (user?.userId !== undefined && user?.userId !== null) {
        await queryClient.invalidateQueries({ queryKey: userKeys.detail(user.userId) });
        await queryClient.invalidateQueries({ queryKey: userKeys.update(user.userId) });
        await queryClient.invalidateQueries({ queryKey: userKeys.remove(user.userId) });
    }
    await queryClient.invalidateQueries({ queryKey: userKeys.public() });
    await queryClient.invalidateQueries({ queryKey: userKeys.publicList() });
    await queryClient.invalidateQueries({ queryKey: userKeys.me() });
};

export const useUserSettingsTab = (): UseUserSettingsTabReturn => {
    logger.info("useUserSettingsTab initialized");

    // Query hooks
    const { data: users = [], isPending, isError, error } = useQuery<User[], Error>({
        queryKey: userKeys.lists(),
        queryFn: getAllUsers,
    });

    const { data: me } = useQuery<User, Error>({
        queryKey: userKeys.me(),
        queryFn: getMe,
    });

    // Mutations and their save status
    const queryClient = useQueryClient();

    const [editStatus, setEditStatus] = useState<Status>('idle');
    const [addStatus, setAddStatus] = useState<Status>('idle');

    const updateUserMutation = useMutation({
        mutationFn: ({ userId, user }: { userId: number; user: UserInput }) => updateUser(userId, user),
        onMutate: () => setEditStatus('saving'),
        onSuccess: async (_updatedUser, { userId, user }) => {
            logger.info('user updated, invalidating user keys');
            await invalidateAllUserKeys(queryClient, { ...user, userId });
            setEditStatus('saved');
            setTimeout(() => setEditStatus('idle'), 1800);
        },
        onError: (err: Error) => {
            logger.error('updateUser failed', err);
            setEditStatus('error');
            setTimeout(() => setEditStatus('idle'), 1800);
        },
    });

    const deleteUserMutation = useMutation({
        mutationFn: (userId: number) => deleteUser(userId),
        onSuccess: async (_data, userId: number) => {
            logger.info('user deleted, invalidating user keys');
            await invalidateAllUserKeys(queryClient, { userId } as User);
        },
        onError: (err: Error) => logger.error('deleteUser failed', err),
    });

    const createUserMutation = useMutation({
        mutationFn: (user: UserInput) => createUser(user),
        onMutate: () => setAddStatus('saving'),
        onSuccess: async (createdUser: User) => {
            logger.info('user created, invalidating user keys');
            await invalidateAllUserKeys(queryClient, createdUser);
            setAddStatus('saved');
            setTimeout(() => setAddStatus('idle'), 1800);
        },
        onError: (err: Error) => {
            logger.error('createUser failed', err);
            setAddStatus('error');
            setTimeout(() => setAddStatus('idle'), 1800);
        },
    });

    const [editingId, setEditingId] = useState<number | null>(null);
    const [removingId, setRemovingId] = useState<number | null>(null);
    const [addingUser, setAddingUser] = useState<boolean>(false);

    const openAddUser = () => setAddingUser(true);

    const handleAddUser = (user: UserInput, callback?: (error: Error | null) => void) => {
        logger.info('Creating user:', user.name);
        createUserMutation.mutate(user, {
            onSuccess: () => {
                setAddingUser(false);
                if (callback) callback(null);
            },
            onError: (error: Error) => {
                if (callback) callback(error);
            }
        });
    };

    const handleEditUser = (userId: number) => setEditingId(userId);

    const handleSaveEdit = (userId: number, user: UserInput, callback?: (error: Error | null) => void) => {
        logger.info('Saving edit for user', userId, user.name);
        updateUserMutation.mutate(
            { userId, user },
            {
                onSuccess: () => {
                    setEditingId(null);
                    if (callback) callback(null);
                },
                onError: (err: Error) => {
                    setEditingId(null);
                    if (callback) callback(err);
                },
            }
        );
    };

    const handleRemoveUser = (userId: number) => setRemovingId(userId);

    const confirmRemoveUser = (userId: number) => {
        logger.info('Confirm delete for user', userId);
        deleteUserMutation.mutate(userId, {
            onSuccess: () => setRemovingId(null)
        });
    };

    const cancelRemoveUser = () => setRemovingId(null);

    const cancelEditOrAdd = () => {
        setEditingId(null);
        setAddingUser(false);
        setEditStatus('idle');
        setAddStatus('idle');
    };

    return {
        users,
        me,
        isPending,
        isError,
        error: error ?? null,
        editingId,
        removingId,
        addingUser,
        openAddUser,
        handleAddUser,
        handleEditUser,
        handleSaveEdit,
        handleRemoveUser,
        confirmRemoveUser,
        cancelRemoveUser,
        cancelEditOrAdd,
        editStatus,
        addStatus,
        deleteUserMutation,
    };
};