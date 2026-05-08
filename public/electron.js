import path from 'path';
import { app, BrowserWindow, ipcMain, dialog, screen } from 'electron';
import keytar from 'keytar';
import axios from 'axios';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Service name and account for keytar-secured session token.
 */
const SERVICE_NAME = 'SabriLTD-Inventory';
const ACCOUNT_NAME = 'InventoryAuthToken';

/**
 * Standard logger for electron main process.
 */
const logger = {
    info: (...args) => console.log('[electron-main]', ...args),
    error: (...args) => console.error('[electron-main]', ...args),
};

/**
 * Heuristic for detecting development mode (no ESM-only deps).
 */
const isDev = (() => {
    try {
        const envDev = process.env.NODE_ENV !== 'production';
        const defaultApp = !!process.defaultApp;
        const execPathMatches = /node_modules[\\/](react-scripts|electron)[\\/]/.test(process.execPath);
        const result = envDev || defaultApp || execPathMatches;
        logger.info('isDev heuristic result=%s (NODE_ENV=%s, defaultApp=%s)', result, process.env.NODE_ENV, !!process.defaultApp);
        return result;
    } catch (err) {
        logger.error('isDev heuristic failed, defaulting to true', err?.message);
        return true;
    }
})();

/**
 * Get the API base URL for logout, from env var `API_URL`.
 * @returns {string|null}
 */
function getApiUrl() {
    if (process.env.API_URL && typeof process.env.API_URL === 'string' && process.env.API_URL.trim() !== '') {
        return String(process.env.API_URL).replace(/\/+$/, '');
    }
    return null;
}

/**
 * Attempts to logout session against Inventory API and then delete cached JWT token.
 * Never logs sensitive token value. No-ops on error.
 * Can be called at app startup (to clean up zombie tokens) and on shutdown.
 *
 * @async
 * @function bestEffortLogoutAndClearToken
 * @returns {Promise<void>}
 */
async function bestEffortLogoutAndClearToken() {
    try {
        logger.info('bestEffortLogoutAndClearToken: Checking for session token...');
        const token = await keytar.getPassword(SERVICE_NAME, ACCOUNT_NAME);
        const apiUrl = getApiUrl();

        if (token && apiUrl) {
            logger.info('Session token found, attempting server-side logout');
            try {
                // POST /api/auth/logout with Authorization: Bearer <token>
                await axios.post(
                    `${apiUrl}/api/auth/logout`,
                    null,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            Accept: 'application/json'
                        },
                        timeout: 2500
                    }
                );
                logger.info('Remote logout successful (or no error thrown)');
            } catch (err) {
                logger.error('Remote logout errored - continuing anyway.', err?.message);
            }
        } else if (!token) {
            logger.info('No session token found (safe to continue)');
        } else if (!apiUrl) {
            logger.info('API_URL not configured - skipping remote logout');
        }

        // Always try to remove token from keytar.
        try {
            const deleted = await keytar.deletePassword(SERVICE_NAME, ACCOUNT_NAME);
            if (deleted) {
                logger.info('Session token deleted from secure store');
            } else {
                logger.info('No session token deleted (none present)');
            }
        } catch (err) {
            logger.error('Error removing token from keytar', err?.message);
        }
    } catch (err) {
        logger.error('bestEffortLogoutAndClearToken: Unexpected error', err?.message);
    }
}

/**
 * On application open: try to clear any zombie session token and log out if token is present.
 * This prevents lingering sessions if the app or OS was quit abnormally.
 */
app.once('ready', async () => {
    logger.info('App ready - performing startup session cleanup');
    await bestEffortLogoutAndClearToken();
    try {
        createMainWindow();
    } catch (err) {
        logger.error('Error during createMainWindow', err?.message);
    }

    app.on('activate', () => {
        logger.info('app activate');
        if (BrowserWindow.getAllWindows().length === 0) {
            createMainWindow();
        }
    });
});

/**
 * Before app shutdown: attempt logout and session token deletion (clean exit).
 * Defers quitting briefly to allow cleanup but will force-close if taking too long.
 */
let quittingCleanupStarted = false;
app.on('before-quit', (event) => {
    if (quittingCleanupStarted) {
        return;
    }
    quittingCleanupStarted = true;

    logger.info('App is quitting - running shutdown logout/token cleanup');
    event.preventDefault();

    const CLEANUP_TIMEOUT_MS = 3500;
    let finished = false;
    const finishQuit = (exitCode = 0) => {
        if (finished) return;
        finished = true;
        logger.info('Cleanup finished, exiting app');
        app.exit(exitCode);
    };

    bestEffortLogoutAndClearToken()
        .then(() => finishQuit(0))
        .catch((err) => {
            logger.error('Cleanup encountered error', err?.message);
            finishQuit(0);
        });

    setTimeout(() => {
        logger.error('Cleanup timeout reached, forcing app exit');
        finishQuit(0);
    }, CLEANUP_TIMEOUT_MS);
});

/**
 * Create and manage main BrowserWindow (with robust logging).
 * Loads dev URL if in dev, else loads production build.
 *
 * @returns {BrowserWindow}
 */
function createMainWindow() {
    logger.info('createMainWindow - creating BrowserWindow');
    const { width, height } = screen.getPrimaryDisplay().workAreaSize;
    logger.info('primary display workAreaSize', { width, height });

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

    // Helpful diagnostics for the "white screen" class of issues.
    mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
        logger.error('did-fail-load', { errorCode, errorDescription, validatedURL });
        try {
            // In packaged apps, a blank window with no clues is painful; open devtools on failure.
            if (!isDev) {
                mainWindow.webContents.openDevTools({ mode: 'detach' });
            }
        } catch (err) {
            logger.error('openDevTools (on did-fail-load) failed', err?.message);
        }

        const escaped = String(errorDescription || 'Unknown error')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');

        mainWindow.loadURL(
            `data:text/html;charset=utf-8,` +
            encodeURIComponent(
                `<html><body style="font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Arial; padding: 24px;">
                  <h2>SabriLTD Desktop failed to load</h2>
                  <p><b>Error</b>: ${escaped}</p>
                  <p><b>Code</b>: ${errorCode}</p>
                  <p><b>URL</b>: ${validatedURL || ''}</p>
                  <p>Check the DevTools console for details.</p>
                </body></html>`
            )
        ).catch(err => logger.error('Failed to load diagnostics page', err?.message));
    });

    mainWindow.webContents.on('render-process-gone', (event, details) => {
        logger.error('render-process-gone', details);
    });

    mainWindow.webContents.on('unresponsive', () => {
        logger.error('renderer became unresponsive');
    });

    mainWindow.once('ready-to-show', () => {
        logger.info('mainWindow ready-to-show -> showing');
        mainWindow.show();
    });
    mainWindow.on('closed', () => logger.info('mainWindow closed'));

    // --- FIXED LOGIC BELOW ---
    const startUrl = process.env.ELECTRON_START_URL;
    if (startUrl) {
        logger.info('Loading ELECTRON_START_URL:', startUrl);
        mainWindow.loadURL(startUrl).then(() => {
            logger.info('Dev URL loaded');
        }).catch(err => logger.error('Error loading dev URL', err?.message));
        try {
            mainWindow.webContents.openDevTools({ mode: 'detach' });
        } catch (err) {
            logger.error('openDevTools failed', err?.message);
        }
    } else {
        const indexPath = path.join(app.getAppPath(), 'build', 'index.html');
        logger.info('Loading production index file:', indexPath);
        mainWindow.loadFile(indexPath).then(() => {
            logger.info('Production index.html loaded');
        }).catch(err => {
            logger.error('Error loading production index.html', err?.message);
            try {
                mainWindow.webContents.openDevTools({ mode: 'detach' });
            } catch (e) {
                // ignore
            }
        });
    }
    return mainWindow;
}

// --- IPC/Token/File Handlers below (no business logic, just wrappers) ---

/**
 * Ping the main process for testing.
 */
ipcMain.handle('ping', async (event, payload) => {
    logger.info('ipcHandler ping received', { payload });
    const response = { pong: true, received: payload, ts: new Date().toISOString() };
    logger.info('ipcHandler ping responding', response);
    return response;
});

/**
 * Open a folder picker dialog via IPC.
 */
ipcMain.handle('select-destination-folder', async () => {
    logger.info('select-destination-folder invoked');
    const result = await dialog.showOpenDialog({
        properties: ['openDirectory'],
        title: 'Select Destination Folder'
    });
    if (result.canceled || !result.filePaths || result.filePaths.length === 0) {
        logger.info('select-destination-folder canceled');
        return null;
    }
    logger.info('select-destination-folder path=', result.filePaths[0]);
    return result.filePaths[0];
});

/**
 * Stores auth token via IPC into keytar.
 */
ipcMain.handle('token-store', async (event, { token }) => {
    try {
        await keytar.setPassword(SERVICE_NAME, ACCOUNT_NAME, token);
        logger.info('token-store: token stored');
        return { success: true };
    } catch (err) {
        logger.error('token-store error', err?.message);
        return { success: false, message: err?.message };
    }
});

/**
 * Reads auth token from keytar.
 */
ipcMain.handle('token-get', async () => {
    try {
        const token = await keytar.getPassword(SERVICE_NAME, ACCOUNT_NAME);
        logger.info('token-get: token presence status:', !!token);
        return { success: true, token };
    } catch (err) {
        logger.error('token-get error', err?.message);
        return { success: false, message: err?.message };
    }
});

/**
 * Deletes auth token in keytar.
 */
ipcMain.handle('token-delete', async () => {
    try {
        await keytar.deletePassword(SERVICE_NAME, ACCOUNT_NAME);
        logger.info('token-delete: token deleted');
        return { success: true };
    } catch (err) {
        logger.error('token-delete error', err?.message);
        return { success: false, message: err?.message };
    }
});