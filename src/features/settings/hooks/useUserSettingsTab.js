import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createUser, deleteUser, getAllUsers, getMe, updateUser } from "../../../api/user/user";
import { userKeys } from "../../../api/user/userQueryKeys";

/**
 * logger for useUserSettingsTab hook.
 * @type {{info: Function, error: Function}}
 */
const logger = {
    info: (...args) => console.log('[useUserSettingsTab]', ...args),
    error: (...args) => console.error('[useUserSettingsTab]', ...args),
};

/**
 * Helper to invalidate all relevant user queries after a mutation.
 *
 * @param {object} queryClient - The TanStack Query client.
 * @param {object} user - The affected user object (if available).
 */
const invalidateAllUserKeys = async (queryClient, user) => {
    logger.info('Invalidating all relevant user query keys');
    // Always invalidate these
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
    // If this is to affect the current user, also invalidate me()
    if (user && typeof user.userId !== "undefined") {
        await queryClient.invalidateQueries({ queryKey: userKeys.me() });
    }
};

/**
 * useUserSettingsTab
 * Encapsulates business logic/state for users table in settings.
 *
 * @returns {object} - State and handlers for managing users.
 */
export const useUserSettingsTab = () => {
    logger.info("useUserSettingsTab initialized");

    // Query hooks
    const { data: users = [], isPending, isError, error } = useQuery({
        queryKey: userKeys.lists(),
        queryFn: getAllUsers,
    });

    const { data: me } = useQuery({
        queryKey: userKeys.me(),
        queryFn: getMe,
    });

    // Mutations and their save status
    const queryClient = useQueryClient();

    const [editStatus, setEditStatus] = useState('idle');
    const [addStatus, setAddStatus] = useState('idle');

    const updateUserMutation = useMutation({
        mutationFn: ({ userId, user }) => updateUser(userId, user),
        onMutate: () => setEditStatus('saving'),
        onSuccess: async (_updatedUser, { userId, user }) => {
            logger.info('User updated, invalidating user keys');
            // Note: user param might not have full info, fallback to userId
            await invalidateAllUserKeys(queryClient, { ...user, userId });
            setEditStatus('saved');
            setTimeout(() => setEditStatus('idle'), 1800);
        },
        onError: (err) => {
            logger.error('updateUser failed', err);
            setEditStatus('error');
            setTimeout(() => setEditStatus('idle'), 1800);
        },
    });

    const deleteUserMutation = useMutation({
        mutationFn: (userId) => deleteUser(userId),
        onSuccess: async (_data, userId) => {
            logger.info('User deleted, invalidating user keys');
            await invalidateAllUserKeys(queryClient, { userId });
        },
        onError: (err) => logger.error('deleteUser failed', err),
    });

    const createUserMutation = useMutation({
        mutationFn: (user) => createUser(user),
        onMutate: () => setAddStatus('saving'),
        onSuccess: async (createdUser) => {
            logger.info('User created, invalidating user keys');
            await invalidateAllUserKeys(queryClient, createdUser);
            setAddStatus('saved');
            setTimeout(() => setAddStatus('idle'), 1800);
        },
        onError: (err) => {
            logger.error('createUser failed', err);
            setAddStatus('error');
            setTimeout(() => setAddStatus('idle'), 1800);
        },
    });

    // Local state for UI editing/UX
    const [editingId, setEditingId] = useState(null);
    const [removingId, setRemovingId] = useState(null);
    const [addingUser, setAddingUser] = useState(false);

    /**
     * openAddUser
     * Opens add new user UX row.
     */
    const openAddUser = () => setAddingUser(true);

    /**
     * handleAddUser
     * Handles creation of a new user.
     * @param {{name:string,email:string}} user
     */
    const handleAddUser = (user) => {
        logger.info('Creating user:', user.name);
        createUserMutation.mutate(user, {
            onSuccess: () => setAddingUser(false),
        });
    };

    /**
     * handleEditUser
     * Open row editor for user.
     * @param {number} userId
     */
    const handleEditUser = (userId) => setEditingId(userId);

    /**
     * handleSaveEdit
     * Submits an update to a user.
     * @param {number} userId
     * @param {{name: string, email: string}} user
     * @param {function} [callback] - Optional, callback(error) on complete.
     */
    const handleSaveEdit = (userId, user, callback) => {
        logger.info('Saving edit for user', userId, user.name);
        updateUserMutation.mutate(
            { userId, user },
            {
                onSuccess: () => {
                    setEditingId(null);
                    if (callback) callback(null);
                },
                onError: (err) => {
                    setEditingId(null);
                    if (callback) callback(err);
                },
            }
        );
    };

    /**
     * handleRemoveUser
     * Triggers UI to confirm removal for user.
     * @param {number} userId
     */
    const handleRemoveUser = (userId) => setRemovingId(userId);

    /**
     * confirmRemoveUser
     * Confirm user delete and call mutation.
     * @param {number} userId
     */
    const confirmRemoveUser = (userId) => {
        logger.info('Confirm delete for user', userId);
        deleteUserMutation.mutate(userId, {
            onSuccess: () => setRemovingId(null)
        });
    };

    /**
     * cancelRemoveUser
     * Cancels delete for user.
     */
    const cancelRemoveUser = () => setRemovingId(null);

    /**
     * cancelEditOrAdd
     * Cancels user edit or add UX.
     */
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
        error,
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
    };
};