import { useState, useCallback } from "react";
import { useCreateUser, useCurrentUserQuery, useDeleteUser, useUpdateUser, useUsersList } from "./useUsers";

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
    me: User | undefined;
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
    deleteUserMutation: ReturnType<typeof useDeleteUser>;
};

const logger = {
    info: (...args: unknown[]) => console.log('[useUserSettingsTab]', ...args),
    error: (...args: unknown[]) => console.error('[useUserSettingsTab]', ...args),
};

export const useUserSettingsTab = (): UseUserSettingsTabReturn => {
    logger.info("useUserSettingsTab initialized");

    // Centralized query hooks
    const { data: users = [], isPending, isError, error } = useUsersList();
    const { data: me } = useCurrentUserQuery();

    // Centralized mutations
    const createUserMutation = useCreateUser();
    const updateUserMutation = useUpdateUser();
    const deleteUserMutation = useDeleteUser();

    const [editStatus, setEditStatus] = useState<Status>('idle');
    const [addStatus, setAddStatus] = useState<Status>('idle');

    const [editingId, setEditingId] = useState<number | null>(null);
    const [removingId, setRemovingId] = useState<number | null>(null);
    const [addingUser, setAddingUser] = useState<boolean>(false);

    const openAddUser = () => setAddingUser(true);

    const handleAddUser = (user: UserInput, callback?: (error: Error | null) => void) => {
        logger.info('Creating user:', user.name);
        setAddStatus('saving');
        createUserMutation.mutate(user as any, {
            onSuccess: () => {
                setAddStatus('saved');
                setTimeout(() => setAddStatus('idle'), 1800);
                setAddingUser(false);
                if (callback) callback(null);
            },
            onError: (error: Error) => {
                setAddStatus('error');
                setTimeout(() => setAddStatus('idle'), 1800);
                if (callback) callback(error);
            }
        });
    };

    const handleEditUser = (userId: number) => setEditingId(userId);

    const handleSaveEdit = (userId: number, user: UserInput, callback?: (error: Error | null) => void) => {
        logger.info('Saving edit for user', userId, user.name);
        setEditStatus('saving');
        updateUserMutation.mutate(
            { userId, payload: user },
            {
                onSuccess: () => {
                    setEditStatus('saved');
                    setTimeout(() => setEditStatus('idle'), 1800);
                    setEditingId(null);
                    if (callback) callback(null);
                },
                onError: (err: Error) => {
                    setEditStatus('error');
                    setTimeout(() => setEditStatus('idle'), 1800);
                    setEditingId(null);
                    if (callback) callback(err);
                },
            }
        );
    };

    const handleRemoveUser = useCallback((userId: number) => setRemovingId(userId), []);

    const confirmRemoveUser = useCallback((userId: number) => {
        logger.info('Confirm delete for user', userId);
        deleteUserMutation.mutate(userId, {
            onSuccess: () => setRemovingId(null)
        });
    }, [deleteUserMutation]);

    const cancelRemoveUser = useCallback(() => setRemovingId(null), []);

    const cancelEditOrAdd = () => {
        setEditingId(null);
        setAddingUser(false);
        setEditStatus('idle');
        setAddStatus('idle');
    };

    return {
        users,
        me: me ?? undefined,
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