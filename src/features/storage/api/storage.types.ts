export interface Storage {
    storageId?: number;
    buildingId?: number;
    name: string;
    description?: string;
    [key: string]: any;
}

export interface StorageResponse {
    status?: string;
    data?: Storage | null;
    meta?: any;
    transactionId?: string;
    errors?: any;
}

export interface StorageListResponse {
    status?: string;
    data: Storage[];
    meta?: any;
    transactionId?: string;
    errors?: any;
}

