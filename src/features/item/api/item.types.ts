// filepath: /Users/joshuareid/Documents/Github/SabriLTD-Desktop/src/features/item/api/item.types.ts
// Item-related TypeScript types and interfaces

export interface Item {
    itemId?: number;
    name: string;
    [key: string]: any;
}

export interface ItemResponse {
    status?: string;
    data?: Item | null;
    meta?: any;
    transactionId?: string;
    errors?: any;
}

export interface ItemListResponse {
    status?: string;
    data: Item[];
    meta?: any;
    transactionId?: string;
    errors?: any;
}

export interface ItemSearchResponse {
    status?: string;
    data?: any;
    meta?: any;
    transactionId?: string;
    errors?: any;
}

