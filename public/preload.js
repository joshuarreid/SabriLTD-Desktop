/**
 * Preload script exposing a small secure API to the renderer.
 * - Uses contextBridge + ipcRenderer.invoke for request/response.
 * - Exposes a subscription helper for 'transfer-progress' events.
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
     * Ask main to open a folder picker and return the selected path (or null).
     */
    selectDestinationFolder: async () => {
        console.log('[preload] selectDestinationFolder invoked');
        const res = await ipcRenderer.invoke('select-destination-folder');
        console.log('[preload] selectDestinationFolder result=', res);
        return res;
    },

});