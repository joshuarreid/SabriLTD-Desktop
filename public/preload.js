/**
 * Preload script exposing a small secure API to the renderer via Electron's contextBridge.
 * - Uses contextBridge + ipcRenderer.invoke for secure request/response patterns.
 * - Exposes token management and folder picker.
 *
 * Ensure you add new APIs here as you add relevant IPC functionality in electron.js.
 */
const { contextBridge, ipcRenderer } = require('electron');

console.log('[preload] preload initialized');

contextBridge.exposeInMainWorld('electronAPI', {
    /**
     * Ping the main process for a quick round-trip test.
     * Usage: await window.electronAPI.ping({ any: 'payload' })
     */
    ping: async (payload) => {
        console.log('[preload] ping ->', payload);
        const res = await ipcRenderer.invoke('ping', payload);
        console.log('[preload] ping <-', res);
        return res;
    },

    /**
     * Opens a folder picker dialog via IPC.
     * @returns {Promise<string|null>} - Selected folder path or null if cancelled.
     */
    selectDestinationFolder: async () => {
        console.log('[preload] selectDestinationFolder invoked');
        const res = await ipcRenderer.invoke('select-destination-folder');
        console.log('[preload] selectDestinationFolder result=', res);
        return res;
    },

    /**
     * Stores an authentication token via IPC/Keytar.
     * @param {string} token - The token to store securely.
     * @returns {Promise<{success: boolean, message?: string}>}
     */
    tokenStore: async (token) => {
        console.log('[preload] tokenStore invoked');
        return ipcRenderer.invoke('token-store', { token });
    },

    /**
     * Gets the authentication token from secure storage via IPC/Keytar.
     * @returns {Promise<{success: boolean, token?: string, message?: string}>}
     */
    tokenGet: async () => {
        console.log('[preload] tokenGet invoked');
        return ipcRenderer.invoke('token-get');
    },

    /**
     * Deletes the authentication token via IPC/Keytar.
     * @returns {Promise<{success: boolean, message?: string}>}
     */
    tokenDelete: async () => {
        console.log('[preload] tokenDelete invoked');
        return ipcRenderer.invoke('token-delete');
    }
});