/**
 * Building-related TypeScript types and interfaces
 */

export interface Building {
    buildingId?: number;
    name: string;
    address: string;
    manager: string;
    [key: string]: any;
}

export interface BuildingResponse {
    status?: string;
    data?: Building | null;
    meta?: any;
    transactionId?: string;
    errors?: any;
}

export interface BuildingListResponse {
    status?: string;
    data: Building[];
    meta?: any;
    transactionId?: string;
    errors?: any;
}
