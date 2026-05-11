// User types for the user API layer

/**
 * Minimal public user (for public lists, login, etc)
 */
export interface PublicUser {
    userId: number;
    name: string;
}

/**
 * Full user object (for authenticated endpoints)
 */
export interface User {
    userId: number;
    name: string;
    email: string;
    dateAdded: string;
    dateUpdated: string;
}

/**
 * Input for creating a user
 */
export interface UserCreateInput {
    name: string;
    email: string;
    password: string;
}

/**
 * Input for updating a user
 */
export interface UserUpdateInput {
    name?: string;
    email?: string;
    password?: string;
}

/**
 * API response for a user or null
 */
export type UserResponse = User | null;

/**
 * API response for a list of users
 */
export type UserListResponse = User[];

/**
 * API response for a list of public users
 */
export type PublicUserListResponse = PublicUser[];

