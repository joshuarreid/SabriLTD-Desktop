/**
 * Electron main process (minimal template).
 *
 * Notes:
 * - Uses a simple heuristic for isDev to avoid requiring ESM-only packages.
 * - Exposes basic IPC handlers that the template renderer can call:
 *   - 'ping' => returns a small object
 *   - 'select-destination-folder' => shows native open dialog for folder
 *   - 'transfer-albums' => demo transfer that emits 'transfer-progress' events (simulated)
 *
 * Keep console logs in place for dev debugging. Replace with a production logger like
 * electron-log when packaging.
 */
const path = require('path');
const { app, BrowserWindow, ipcMain, dialog, screen } = require('electron');

const keytar = require('keytar');

const SERVICE_NAME = 'SabriLTD-Inventory';
const ACCOUNT_NAME = 'InventoryAuthToken';



console.log('[electron-main] Starting main process', { argv: process.argv.slice(1) });

/**
 * Heuristic to detect development.
 * Avoids requiring electron-is-dev (ESM) to prevent ERR_REQUIRE_ESM.
 */
const isDev = (() => {
    try {
        const envDev = process.env.NODE_ENV !== 'production';
        const defaultApp = !!process.defaultApp;
        const execPathMatches = /node_modules[\\/](react-scripts|electron)[\\/]/.test(process.execPath);
        const result = envDev || defaultApp || execPathMatches;
        console.log('[electron-main] isDev heuristic result=%s (NODE_ENV=%s, defaultApp=%s)', result, process.env.NODE_ENV, !!process.defaultApp);
        return result;
    } catch (err) {
        console.warn('[electron-main] isDev heuristic failed, defaulting to true', err && err.message);
        return true;
    }
})();

/**
 * Create the main BrowserWindow and load either CRA dev server or production index.
 */
function createMainWindow() {
    console.log('[electron-main] createMainWindow - creating BrowserWindow');

    const { width, height } = screen.getPrimaryDisplay().workAreaSize;
    console.log('[electron-main] primary display workAreaSize', { width, height });

    console.log('[electron-main] createMainWindow - creating BrowserWindow');
    const mainWindow = new BrowserWindow({
        width,
        height,
        useContentSize: true,
        fullscreen: false,
        fullscreenable: true,
        autoHideMenuBar: false,
        show: false,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false
        }
    });

    mainWindow.once('ready-to-show', () => {
        console.log('[electron-main] mainWindow ready-to-show -> showing');
        mainWindow.show();
    });

    mainWindow.on('closed', () => {
        console.log('[electron-main] mainWindow closed');
    });

    if (isDev) {
        const devUrl = 'http://localhost:3000';
        console.log('[electron-main] Loading dev URL:', devUrl);
        mainWindow.loadURL(devUrl).then(() => {
            console.log('[electron-main] Dev URL loaded');
        }).catch(err => {
            console.error('[electron-main] Error loading dev URL', err);
        });
        try {
            mainWindow.webContents.openDevTools({ mode: 'detach' });
        } catch (err) {
            console.warn('[electron-main] openDevTools failed', err && err.message);
        }
    } else {
        const indexPath = path.join(app.getAppPath(), 'build', 'index.html');
        console.log('[electron-main] Loading production index file:', indexPath);
        mainWindow.loadFile(indexPath).then(() => {
            console.log('[electron-main] Production index.html loaded');
        }).catch(err => {
            console.error('[electron-main] Error loading production index.html', err);
        });
    }

    return mainWindow;
}

/**
 * Basic IPC handlers
 */
ipcMain.handle('ping', async (event, payload) => {
    console.log('[electron-main] ipcHandler ping received', { payload });
    const response = { pong: true, received: payload, ts: new Date().toISOString() };
    console.log('[electron-main] ipcHandler ping responding', response);
    return response;
});

ipcMain.handle('select-destination-folder', async () => {
    console.log('[electron-main] select-destination-folder invoked');
    const result = await dialog.showOpenDialog({
        properties: ['openDirectory'],
        title: 'Select Destination Folder'
    });
    if (result.canceled || !result.filePaths || result.filePaths.length === 0) {
        console.log('[electron-main] select-destination-folder canceled');
        return null;
    }
    console.log('[electron-main] select-destination-folder path=', result.filePaths[0]);
    return result.filePaths[0];
});

/**
 * Simulated transfer handler.
 * - Accepts { albums, destination } and sends progress updates via 'transfer-progress' event.
 * - This is a demo / template implementation. Replace with real copy logic in production.
 */
ipcMain.handle('transfer-albums', async (event, data) => {
    console.log('[electron-main] transfer-albums invoked', { albumsCount: Array.isArray(data?.albums) ? data.albums.length : 0, destination: data?.destination });
    try {
        // Simulate work with progress updates
        const totalSteps = 20;
        for (let step = 1; step <= totalSteps; step++) {
            const pct = Math.round((step / totalSteps) * 100);
            // Send progress to renderer
            event.sender.send('transfer-progress', pct);
            // Short delay to simulate work
            await new Promise(resolve => setTimeout(resolve, 80));
        }
        console.log('[electron-main] transfer-albums complete');
        return { success: true };
    } catch (err) {
        console.error('[electron-main] transfer-albums error', err);
        return { success: false, message: err.message || String(err) };
    }
});

ipcMain.handle('token-store', async (event, { token }) => {
    /**
     * Stores the token securely using Keytar.
     * @param {string} token
     * @returns {boolean} True if stored successfully, else false.
     */
    try {
        await keytar.setPassword(SERVICE_NAME, ACCOUNT_NAME, token);
        console.log('[electron-main] token-store: token stored');
        return { success: true };
    } catch (err) {
        console.error('[electron-main] token-store error', err);
        return { success: false, message: err.message };
    }
});

ipcMain.handle('token-get', async () => {
    /**
     * Retrieves the auth token from Keytar.
     * @returns {string|null} The token or null if not found.
     */
    try {
        const token = await keytar.getPassword(SERVICE_NAME, ACCOUNT_NAME);
        console.log('[electron-main] token-get: token retrieved');
        return { success: true, token };
    } catch (err) {
        console.error('[electron-main] token-get error', err);
        return { success: false, message: err.message };
    }
});

ipcMain.handle('token-delete', async () => {
    /**
     * Deletes the auth token from Keytar.
     * @returns {boolean} True if deleted successfully.
     */
    try {
        await keytar.deletePassword(SERVICE_NAME, ACCOUNT_NAME);
        console.log('[electron-main] token-delete: token deleted');
        return { success: true };
    } catch (err) {
        console.error('[electron-main] token-delete error', err);
        return { success: false, message: err.message };
    }
});

/**
 * App lifecycle
 */
app.on('ready', () => {
    console.log('[electron-main] app ready');
    try {
        createMainWindow();
    } catch (err) {
        console.error('[electron-main] Error creating main window', err);
    }

    app.on('activate', () => {
        console.log('[electron-main] app activate');
        if (BrowserWindow.getAllWindows().length === 0) {
            createMainWindow();
        }
    });
});

app.on('window-all-closed', () => {
    console.log('[electron-main] window-all-closed platform=%s', process.platform);
    if (process.platform !== 'darwin') {
        console.log('[electron-main] quitting app');
        app.quit();
    } else {
        console.log('[electron-main] macOS - keeping app active');
    }
});