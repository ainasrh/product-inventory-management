/**
 * Axios instance
 * - baseURL from config
 * - attaches Bearer token on every request
 * - all responses are wrapped by backend: { status, message, data }
 *   interceptor unwraps .data so callers get the payload directly
 */
import axios from 'axios';
import { apiConfig } from './config/apiConfig';
import { STORAGE_KEYS } from './constants/apiConstants';

const api = axios.create({
  baseURL: apiConfig.baseURL,
  timeout: apiConfig.timeout,
});

// ── Request: attach JWT ───────────────────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ── Response: unwrap backend envelope  { status, message, data } ─────────
// On success axios gives us the full { status, message, data } body.
// We unwrap it so callers just get `data` directly.
// On error we keep the original error so getErrorMessage() can read it.
api.interceptors.response.use(
  (response) => {
    // Backend wraps successful responses: { status: 'success', message, data }
    // For paginated list responses DRF returns: { count, next, previous, results }
    // Those are NOT wrapped, so we handle both shapes.
    const body = response.data;
    if (body && body.status === 'success' && 'data' in body) {
      // Unwrap envelope → return just the payload
      response.data = body.data;
    }
    return response;
  },
  (error) => Promise.reject(error),
);

export default api;
