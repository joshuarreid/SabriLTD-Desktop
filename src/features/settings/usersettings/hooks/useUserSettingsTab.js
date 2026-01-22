import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createUser, deleteUser, getAllUsers, getMe, updateUser } from "../../../../api/user/user";
import { userKeys } from "../../../../api/user/userQueryKeys";

/**
 * logger for useUserSettingsTab hook.
 * @type {{info: Function, error: Function}}
 */
const logger = {
    info: (...args) => console.log('[useUserSettingsTab]', ...args),
    error: (...args) => console.error('[useUserSettingsTab]', ...args),
};

/**
 * invalidateAllUserKeys
 * Invalidates all user query keys after any user mutation (add, update, delete).
 * Includes: all, lists, list, detail, me (if it's the current user), public, publicList.
 *
 * @async
 * @function invalidateAllUserKeys
 * @param {object} queryClient - The TanStack Query client.
 * @param {object} user - The affected user object (if available).
 */
const invalidateAllUserKeys = async (queryClient, user) => {
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
    // Always invalidate 'me'; will fetch correctly if the updated/deleted user is the current user
    await queryClient.invalidateQueries({ queryKey: userKeys.me() });
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

    /**
     * Update user mutation with full cache invalidation on success.
     */
    const updateUserMutation = useMutation({
        mutationFn: ({ userId, user }) => updateUser(userId, user),
        onMutate: () => setEditStatus('saving'),
        onSuccess: async (_updatedUser, { userId, user }) => {
            logger.info('User updated, invalidating user keys');
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

    /**
     * Delete user mutation with full cache invalidation on success.
     * (Returned in hook for use in modal delete status badge.)
     */
    const deleteUserMutation = useMutation({
        mutationFn: (userId) => deleteUser(userId),
        onSuccess: async (_data, userId) => {
            logger.info('User deleted, invalidating user keys');
            await invalidateAllUserKeys(queryClient, { userId });
        },
        onError: (err) => logger.error('deleteUser failed', err),
    });

    /**
     * Create user mutation with full cache invalidation on success.
     */
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
     *
     * @function openAddUser
     * @returns {void}
     */
    const openAddUser = () => setAddingUser(true);

    /**
     * handleAddUser
     * Handles creation of a new user.
     *
     * @function handleAddUser
     * @param {{name: string, email: string}} user - User object to create (name & email).
     * @param {function} [callback] - Optional, callback(error) after mutation completes.
     * @returns {void}
     */
    const handleAddUser = (user, callback) => {
        logger.info('Creating user:', user.name);
        createUserMutation.mutate(user, {
            onSuccess: () => {
                setAddingUser(false);
                if (callback) callback(null);
            },
            onError: (error) => {
                if (callback) callback(error);
            }
        });
    };

    /**
     * handleEditUser
     * Open row editor for user.
     *
     * @function handleEditUser
     * @param {number} userId - The user ID to edit.
     * @returns {void}
     */
    const handleEditUser = (userId) => setEditingId(userId);

    /**
     * handleSaveEdit
     * Submits an update to a user.
     *
     * @function handleSaveEdit
     * @param {number} userId - The user ID to update.
     * @param {{name: string, email: string}} user - The inputfields to update.
     * @param {function} [callback] - Optional, callback(error) after mutation completes.
     * @returns {void}
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
     *
     * @function handleRemoveUser
     * @param {number} userId - The user ID to remove.
     * @returns {void}
     */
    const handleRemoveUser = (userId) => setRemovingId(userId);

    /**
     * confirmRemoveUser
     * Confirm user delete and call mutation.
     *
     * @function confirmRemoveUser
     * @param {number} userId - The user ID to confirm remove.
     * @returns {void}
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
     *
     * @function cancelRemoveUser
     * @returns {void}
     */
    const cancelRemoveUser = () => setRemovingId(null);

    /**
     * cancelEditOrAdd
     * Cancels user edit or add UX.
     *
     * @function cancelEditOrAdd
     * @returns {void}
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
        deleteUserMutation, // <------ KEY: This makes deleteStatus work in UserSettingsTab.jsx
    };
};