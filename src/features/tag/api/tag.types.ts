/**
 * Tag-related TypeScript types and interfaces
 */

export interface Tag {
    tagId?: number;
    categoryId: number;
    name: string;
    updatedBy?: number;
    dateAdded?: string;
    dateUpdated?: string | null;
    [key: string]: any;
}

export interface TagResponse {
    status?: string;
    data?: Tag | null;
    meta?: any;
    transactionId?: string;
    errors?: any;
}

export interface TagListResponse {
    status?: string;
    data: Tag[];
    meta?: any;
    transactionId?: string;
    errors?: any;
}

