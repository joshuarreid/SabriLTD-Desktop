import ItemApiClient from './itemApiClient';
import type { Item } from './item.types';

/**
 * Singleton instance of ItemApiClient.
 */
const apiClient = new ItemApiClient();

const logger = {
    info: (...args: unknown[]) => console.log('[item]', ...args),
    error: (...args: unknown[]) => console.error('[item]', ...args),
};

export async function createItem(item: Item): Promise<Item | null> {
    logger.info('createItem called', { name: item?.name });
    try {
        const response = await apiClient.createItem(item);
        return response?.data || null;
    } catch (error) {
        logger.error('createItem failed', error);
        throw error;
    }
}

export async function getAllItems(params: Record<string, unknown> = {}): Promise<any> {
    logger.info('getAllItems called', params);
    try {
        const response = await apiClient.fetchAllItems(params);

        logger.info('getAllItems normalized response', {
            dataCount: Array.isArray(response?.data) ? response.data.length : 0,
            meta: response?.meta,
        });

        return response;
    } catch (error) {
        logger.error('getAllItems failed', error);
        throw error;
    }
}

export async function searchItems(params: Record<string, unknown>): Promise<any> {
    logger.info('searchItems called', params);
    try {
        const response = await apiClient.searchItems(params);

        logger.info('searchItems normalized response', {
            dataCount: Array.isArray(response?.data) ? response.data.length : 0,
            meta: response?.meta,
        });

        return response;
    } catch (error) {
        logger.error('searchItems failed', error);
        throw error;
    }
}

export async function getItemById(itemId: string | number): Promise<Item | null> {
    logger.info('getItemById called', { itemId });
    try {
        const response = await apiClient.fetchItemById(itemId);
        return response?.data || null;
    } catch (error) {
        logger.error('getItemById failed', error);
        throw error;
    }
}

export async function getItemDetails(itemId: string | number): Promise<any> {
    logger.info('getItemDetails called', { itemId });
    try {
        const response = await apiClient.fetchItemDetails(itemId);
        return response?.data || null;
    } catch (error) {
        logger.error('getItemDetails failed', error);
        throw error;
    }
}

export async function updateItem(itemId: string | number, item: Item): Promise<Item | null> {
    logger.info('updateItem called', { itemId });
    try {
        const response = await apiClient.updateItem(itemId, item);
        return response?.data || null;
    } catch (error) {
        logger.error('updateItem failed', error);
        throw error;
    }
}

export async function deleteItem(itemId: string | number): Promise<void> {
    logger.info('deleteItem called', { itemId });
    try {
        await apiClient.deleteItem(itemId);
    } catch (error) {
        logger.error('deleteItem failed', error);
        throw error;
    }
}

export async function deleteItemsBatch(itemIds: (string | number)[]): Promise<void> {
    logger.info('deleteItemsBatch called', { count: Array.isArray(itemIds) ? itemIds.length : 0 });
    try {
        await apiClient.deleteItemsBatch(itemIds);
    } catch (error) {
        logger.error('deleteItemsBatch failed', error);
        throw error;
    }
}
