/**
 * Centralized environment configuration.
 *
 * Purpose:
 *  - Resolve current environment and select corresponding API URL and API password.
 *  - Provide a small helper to build full API URLs from relative paths.
 *
 * Conventions:
 *  - Reads Create React App environment variables (REACT_APP_*)
 *
 * Exports:
 *  - ENV: normalized environment string ("local" | "prod")
 *  - isProd: boolean
 *  - isLocal: boolean
 *  - API_URL: resolved base API URL (string)
 *  - API_PASSWORD: resolved API password (string|undefined)
 *  - buildApiUrl(path): helper to combine API_URL with relative path
 */

const logger = {
    info: (...args) => console.log('[config/env]', ...args),
    error: (...args) => console.error('[config/env]', ...args),
};

/**
 * Normalize a base URL by removing trailing slashes.
 *
 * @param {string|undefined} value - raw URL
 * @returns {string|undefined} normalized URL or undefined if not provided
 */
function normalizeBaseUrl(value) {
    if (!value) return undefined;
    return String(value).replace(/\/+$/, '');
}

/**
 * Raw environment variables (CRA exposes REACT_APP_ prefixed vars).
 * @type {string|undefined}
 */
const RAW_ENV = process.env.REACT_APP_ENVIRONMENT;
const OVERRIDE_URL = process.env.REACT_APP_API_URL;
const LOCAL_URL = process.env.REACT_APP_API_URL_LOCAL;
const PROD_URL = process.env.REACT_APP_API_URL_PROD;

const OVERRIDE_PW = process.env.REACT_APP_API_PASSWORD;
const LOCAL_PW = process.env.REACT_APP_API_PASSWORD_LOCAL;
const PROD_PW = process.env.REACT_APP_API_PASSWORD_PROD;

/**
 * Current environment string. Expected values: "local" or "prod".
 * Defaults to "local".
 * @type {string}
 */
export const ENV = (typeof RAW_ENV === 'string' && RAW_ENV.trim() !== '')
    ? String(RAW_ENV).trim().toLowerCase()
    : 'local';

logger.info('ENV detected:', ENV);

/**
 * Whether running in production-like environment.
 * @type {boolean}
 */
export const isProd = ENV === 'prod';

/**
 * Whether running in local/development environment.
 * @type {boolean}
 */
export const isLocal = ENV === 'local';

/**
 * Resolved base API URL.
 *
 * Resolution order:
 *  1. REACT_APP_API_URL (explicit override)
 *  2. REACT_APP_API_URL_PROD or REACT_APP_API_URL_LOCAL depending on ENV
 *  3. Fallback defaults: local -> http://localhost:8080, prod -> https://api.example.com
 *
 * @type {string}
 */
let resolvedApiUrl = OVERRIDE_URL || (isProd ? PROD_URL : LOCAL_URL);

if (!resolvedApiUrl || resolvedApiUrl.trim() === '') {
    resolvedApiUrl = isProd ? 'https://api.example.com' : 'http://localhost:8080';
    logger.info('No explicit REACT_APP_API_URL found; using default for ENV=', ENV, '->', resolvedApiUrl);
}

export const API_URL = normalizeBaseUrl(resolvedApiUrl);
logger.info('API_URL set to', API_URL);

/**
 * Resolved API password (sensitive).
 *
 * Resolution order:
 *  1. REACT_APP_API_PASSWORD (global override)
 *  2. REACT_APP_API_PASSWORD_PROD or REACT_APP_API_PASSWORD_LOCAL depending on ENV
 *  3. undefined if not set
 *
 * SECURITY: do not log the value. Only log presence.
 *
 * @type {string|undefined}
 */
export const API_PASSWORD = (typeof OVERRIDE_PW === 'string' && OVERRIDE_PW.length > 0)
    ? OVERRIDE_PW
    : (isProd
        ? (typeof PROD_PW === 'string' && PROD_PW.length > 0 ? PROD_PW : undefined)
        : (typeof LOCAL_PW === 'string' && LOCAL_PW.length > 0 ? LOCAL_PW : undefined));

logger.info('API_PASSWORD present:', API_PASSWORD ? true : false);

/**
 * Build a full API URL from a relative path.
 *
 * Examples:
 *  buildApiUrl('/api/items') -> 'https://api.../api/items'
 *  buildApiUrl('https://other.example/foo') -> 'https://other.example/foo' (unchanged)
 *
 * @param {string} path - Relative path (with or without leading slash) or absolute URL.
 * @returns {string} Fully resolved URL
 */
export function buildApiUrl(path) {
    if (!path) return API_URL;
    const asStr = String(path);
    if (/^https?:\/\//i.test(asStr)) return asStr;
    const base = API_URL || '';
    return `${base.replace(/\/+$/, '')}/${asStr.replace(/^\/+/, '')}`;
}

export default {
    ENV,
    isProd,
    isLocal,
    API_URL,
    API_PASSWORD,
    buildApiUrl,
};