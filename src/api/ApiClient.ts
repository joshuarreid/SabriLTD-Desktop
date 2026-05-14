/**
 * Generic API client base class built on axios.
 *
 * - Single axios instance per ApiClient instance
 * - Resolves BASE_URL from env.js (API_URL), never directly from environment variables
 * - Centralizes generation and propagation of X-Transaction-ID header for every request
 * - Fetch-like makeRequest mapped to axios
 * - Thin HTTP helpers: get/post/put/patch/delete
 * - Centralized validation helpers (validateRequired, validateId)
 *
 * Important:
 *  - ApiClient will always resolve application's base URL from env.js (API_URL).
 *    This keeps resource clients, hooks, and UI free of any references to env/base URL config.
 *  - X-Transaction-ID is generated and attached by this client. Higher layers must NOT accept or pass transaction IDs.
 *
 * @module ApiClient
 */

import axios from 'axios';
import { API_URL } from "../config/env";

/**
 * Standardized logger for debugging and traceability.
 * Never log sensitive values.
 *
 * @constant
 * @type {{info: Function, error: Function}}
 */
const logger: { info: (...args: any[]) => void; error: (...args: any[]) => void } = {
    info: (...args: any[]) => console.log('[ApiClient]', ...args),
    error: (...args: any[]) => console.error('[ApiClient]', ...args),
};

/**
 * Generate a stable, reasonably unique transaction id.
 * Uses crypto.randomUUID when available; falls back to timestamp+random string.
 *
 * @private
 * @returns {string}
 */
function generateTransactionId(): string {
    try {
        if (typeof crypto !== 'undefined' && typeof (crypto as any).randomUUID === 'function') {
            return (crypto as any).randomUUID();
        }
    } catch (e) {
        // ignore and fall back
    }
    // fallback
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Resolve the base URL for API requests from env.js (API_URL).
 *
 * @private
 * @returns {string|null} base URL string or null if not found
 */
function resolveBaseUrlFromEnvFile() {
    if (API_URL && typeof API_URL === 'string' && API_URL.trim() !== '') {
        return API_URL.trim();
    }
    logger.error('resolveBaseUrlFromEnvFile', 'API_URL could not be resolved from env.js');
    return null;
}

/**
 * ApiClient
 * - Centralized API client, always using env.js (API_URL) for baseURL resolution.
 * - Never directly sources environment variables.
 *
 * @class
 */
export default class ApiClient {
    /**
     * Creates an instance of ApiClient.
     *
     * If baseURL is not provided, constructor resolves from env.js (API_URL). Resource clients should construct ApiClient without passing baseURL to defer resolution.
     *
     * @param {Object} options
     * @param {string} [options.baseURL] - Base URL for the API (optional; resolved from env.js when omitted)
     * @param {number} [options.timeout=10000] - Default request timeout in milliseconds
     * @param {string} [options.apiPath=''] - Base API path that will prefix resource paths (e.g. '/api')
     * @throws {Error} if baseURL cannot be resolved from options or env.js
     */
    constructor({ baseURL, timeout = 10000, apiPath = '' } = {}) {
        logger.info('constructor called', { baseURLProvided: !!baseURL, timeout, apiPath });

        // Use provided baseURL or always resolve from env.js (API_URL)
        const resolvedBaseUrl = baseURL || resolveBaseUrlFromEnvFile();

        if (!resolvedBaseUrl || typeof resolvedBaseUrl !== 'string') {
            throw new Error(
                'ApiClient: baseURL must be provided or set in env.js (API_URL export)'
            );
        }

        this.baseURL = String(resolvedBaseUrl).replace(/\/+$/, '');
        this.apiPath = String(apiPath || '').replace(/^\/+|\/+$/g, '');

        this._defaultTransactionId = null; // optional: can be set for testing
        this.axios = axios.create({
            baseURL: this.baseURL,
            timeout,
            headers: { Accept: 'application/json' },
            withCredentials: true,
        });

        this._attachInterceptors();
    }

    /**
     * Attach basic interceptors. Subclasses can override _onRequest/_onResponse/_onError.
     *
     * @private
     * @returns {void}
     */
    _attachInterceptors() {
        this.axios.interceptors.request.use(
            (config) => this._onRequest(config),
            (err) => this._onError(err)
        );
        this.axios.interceptors.response.use(
            (res) => this._onResponse(res),
            (err) => this._onError(err)
        );
    }

    /**
     * Default request interceptor.
     * - Ensures Accept header
     * - Ensures X-Transaction-ID header is present (generated here)
     *
     * @protected
     * @param {import('axios').InternalAxiosRequestConfig} config
     * @returns {import('axios').InternalAxiosRequestConfig}
     */
    _onRequest(config) {
        config.headers = config.headers || {};
        config.headers.Accept = config.headers.Accept || 'application/json';

        // If a caller set X-Transaction-ID explicitly in headers, respect it.
        // But typical usage should NOT set it; ApiClient will generate one.
        if (!config.headers['X-Transaction-ID'] && !config.headers['x-transaction-id']) {
            const tx = this._defaultTransactionId || generateTransactionId();
            config.headers['X-Transaction-ID'] = tx;
            config.headers['x-transaction-id'] = tx;
        }
        logger.info('_onRequest', config.method?.toUpperCase(), config.url, 'payload:', config.data || config.params);
        return config;
    }

    /**
     * Default response interceptor.
     * Logs the full response object.
     *
     * @protected
     * @param {import('axios').AxiosResponse} response
     * @returns {import('axios').AxiosResponse}
     */
    _onResponse(response) {
        logger.info('_onResponse', response.config?.method?.toUpperCase(), response.config?.url, 'response:', response);
        return response;
    }

    /**
     * Default error interceptor: normalize and rethrow.
     *
     * @protected
     * @param {any} error
     * @throws {{message:string,status:number|null,data:any,originalError:any}}
     */
    _onError(error) {
        const normalized = this._normalizeError(error);
        logger.error('_onError', normalized.message, { status: normalized.status });
        throw normalized;
    }

    /**
     * Normalize axios or generic errors into a predictable shape.
     *
     * @private
     * @param {any} error
     * @returns {{ message: string, status: number|null, data: any, originalError: any }}
     */
    _normalizeError(error) {
        if (error && error.isAxiosError) {
            const status = error.response?.status ?? null;
            const data = error.response?.data ?? null;
            const message =
                (error.response && (error.response.data?.message || error.response.statusText)) ||
                error.message ||
                'Request failed';
            return { message, status, data, originalError: error };
        }
        if (error && error.name === 'AbortError') {
            return { message: 'Request was aborted', status: null, data: null, originalError: error };
        }
        return { message: error?.message || String(error), status: null, data: null, originalError: error };
    }

    /**
     * Build an endpoint combining the configured apiPath with a resource path and an optional relative path.
     *
     * @param {string} resourcePath - resource root (e.g. 'transactions')
     * @param {string} [relativePath=''] - path under the resource (e.g. '123' or 'upload')
     * @returns {string} joined endpoint (no leading slash)
     */
    resourceEndpoint(resourcePath, relativePath = '') {
        const r = String(resourcePath || '').replace(/^\/+|\/+$/g, '');
        const rel = String(relativePath || '').replace(/^\/+|\/+$/g, '');
        if (!r && !rel) return '';
        return rel ? `${r}/${rel}` : r;
    }

    /**
     * Internal helper to build final URL that axios will use (prefixes apiPath).
     *
     * @private
     * @param {string} endpoint - endpoint built via resourceEndpoint or raw endpoint (may include query)
     * @returns {string} path relative to baseURL passed to axios (starts with '/' unless empty)
     */
    _buildUrl(endpoint = '') {
        // --------- FIX: Add special handling for query-only endpoints ---------
        if (!endpoint) {
            return this.apiPath ? `/${this.apiPath}` : '/';
        }
        if (endpoint.startsWith('?')) {
            // Attach query directly to path, with NO slash at the end
            return (this.apiPath ? `/${this.apiPath}` : '/') + endpoint;
        }
        if (/^https?:\/\//i.test(endpoint)) return endpoint;
        const cleanEndpoint = String(endpoint).replace(/^\/+/, '');
        const prefix = this.apiPath ? `/${this.apiPath}` : '';
        return `${prefix}/${cleanEndpoint}`.replace(/\/+/g, '/').replace(/\/$/, '') || '/';
    }

    /**
     * Set a default X-Transaction-ID to be attached to all requests from this instance.
     * Useful for testing. Production callers typically won't use this.
     *
     * @param {string|null} txId - transaction id to force, or null to clear
     */
    setDefaultTransactionId(txId) {
        this._defaultTransactionId = txId ? String(txId) : null;
        logger.info('setDefaultTransactionId called', this._defaultTransactionId ? '[set]' : '[cleared]');
    }

    /**
     * Generic request executor. Accepts fetch-like options and converts to axios config.
     *
     * @async
     * @param {string} endpoint - endpoint returned by resourceEndpoint (no leading slash) or absolute URL
     * @param {Object} [options={}] - fetch-like options
     * @param {string} [options.method='GET']
     * @param {Object} [options.headers]
     * @param {Object} [options.params] - query params (axios will serialize)
     * @param {any} [options.body] - fetch-like body
     * @param {any} [options.data] - alias for body
     * @param {number} [options.timeout] - per-request timeout
     * @param {AbortSignal} [options.signal] - abort signal
     * @param {string} [options.responseType] - axios responseType
     * @param {boolean} [options.rawResponse=false] - return full axios response instead of response.data
     * @returns {Promise<any>} resolves with response.data (unless rawResponse true)
     */
    async makeRequest(endpoint, options = {}) {
        const {
            method = 'GET',
            headers = {},
            params = undefined,
            body = undefined,
            data = undefined,
            timeout = undefined,
            signal = undefined,
            responseType = undefined,
            rawResponse = false,
        } = options;

        const url = this._buildUrl(endpoint);
        logger.info('makeRequest', method?.toUpperCase(), url);

        const mergedHeaders = { ...(headers || {}) };

        // Ensure transaction id present on per-request headers (allow explicit override)
        if (!mergedHeaders['X-Transaction-ID'] && !mergedHeaders['x-transaction-id']) {
            const tx = this._defaultTransactionId || generateTransactionId();
            mergedHeaders['X-Transaction-ID'] = tx;
            mergedHeaders['x-transaction-id'] = tx;
        }

        let payload = data !== undefined ? data : body;
        const hasContentType = Object.keys(mergedHeaders).some((h) => h.toLowerCase() === 'content-type');
        const isFormData = typeof FormData !== 'undefined' && payload instanceof FormData;
        if (payload !== undefined && payload !== null && !hasContentType && !isFormData) {
            mergedHeaders['Content-Type'] = 'application/json';
        }

        const config = {
            url,
            method: String(method).toLowerCase(),
            headers: mergedHeaders,
            params,
            data: payload,
            timeout: typeof timeout === 'number' ? timeout : undefined,
            responseType,
        };
        if (signal) config.signal = signal;

        try {
            const response = await this.axios.request(config);
            const serverTx = response.headers && (response.headers['x-transaction-id'] || response.headers['X-Transaction-ID']);
            if (serverTx) {
                logger.info('makeRequest', 'Server transaction ID:', serverTx);
            }
            return rawResponse ? response : response.data;
        } catch (error) {
            throw this._onError(error);
        }
    }

    /**
     * Thin HTTP helpers for convenience (get/post/put/patch/delete)
     */
    get(endpoint, params = {}, config = {}) {
        return this.makeRequest(endpoint, { ...config, method: 'GET', params });
    }
    post(endpoint, data = {}, config = {}) {
        return this.makeRequest(endpoint, { ...config, method: 'POST', data });
    }
    put(endpoint, data = {}, config = {}) {
        return this.makeRequest(endpoint, { ...config, method: 'PUT', data });
    }
    patch(endpoint, data = {}, config = {}) {
        return this.makeRequest(endpoint, { ...config, method: 'PATCH', data });
    }
    delete(endpoint, data = {}, config = {}) {
        // Some APIs expect data in DELETE, some don't
        return this.makeRequest(endpoint, { ...config, method: 'DELETE', data });
    }

    /**
     * POST with multipart/form-data (for file uploads)
     * @param {string} endpoint
     * @param {FormData} formData
     * @param {Object} config
     * @returns {Promise<any>}
     */
    postMultipart(endpoint, formData, config = {}) {
        const headers = { ...(config.headers || {}), 'Content-Type': 'multipart/form-data' };
        return this.makeRequest(endpoint, { ...config, method: 'POST', data: formData, headers });
    }
}
