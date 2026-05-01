// Photo-related TypeScript types and interfaces

export interface Photo {
    photoId?: number;
    itemId?: number;
    url: string;
    filename: string;
    uploadedAt?: string;
    updatedBy: number;
    status?: string;
    [key: string]: any;
}

export interface PhotoResponse {
    status?: string;
    data?: Photo | null;
    meta?: any;
    transactionId?: string;
    errors?: any;
}

export interface PhotoListResponse {
    status?: string;
    data: Photo[];
    meta?: any;
    transactionId?: string;
    errors?: any;
}

export interface UploadPhotoFields {
    photoFiles: File[];
    itemId?: number;
    updatedBy: number;
}

