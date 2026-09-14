import axios from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

// WebSocket URL — configurable via VITE_WS_URL, falls back to same host as API
export const WS_URL = import.meta.env.VITE_WS_URL || null;

export function resolveWsUrl() {
  if (WS_URL) return WS_URL;
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.hostname || 'localhost';
  return `${protocol}//${host}:8000/ws`;
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// ─── Request Interceptor ─────────────────────────────────────────────────────
// Automatically attach the active user role and name to every API request so the
// backend RoleChecker and audit log middleware can validate and trace access.
apiClient.interceptors.request.use((config) => {
  const role =
    localStorage.getItem('ripepulse_user_role') ||
    localStorage.getItem('harvestiq_user_role') ||
    'WAREHOUSE_MANAGER';
  const name =
    localStorage.getItem('ripepulse_user_name') ||
    localStorage.getItem('harvestiq_user_name') ||
    '';
  config.headers['X-User-Role'] = role.toUpperCase();
  if (name) {
    config.headers['X-User-Name'] = name;
  }
  return config;
});

// ─── Response Interceptor ────────────────────────────────────────────────────
// Normalise errors into human-readable messages before they reach components.
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      return Promise.reject(new Error('Request timed out. The backend may be slow or unreachable.'));
    }
    if (!error.response) {
      // Network error — backend completely unreachable
      return Promise.reject(new Error('Cannot reach the RipePulse backend. Ensure it is running on port 8000.'));
    }
    const status = error.response.status;
    const detail = error.response.data?.detail || error.response.data?.message;

    if (status === 400) {
      return Promise.reject(new Error(detail || 'Invalid request data.'));
    }
    if (status === 401) {
      return Promise.reject(new Error(detail || 'Authentication required for this operation.'));
    }
    if (status === 403) {
      return Promise.reject(new Error(detail || 'Permission denied. Your active role is not authorized for this action.'));
    }
    if (status === 404) {
      return Promise.reject(new Error(detail || 'Resource not found on the backend.'));
    }
    if (status === 409) {
      return Promise.reject(new Error(detail || 'Conflict: Record already exists or has been locked.'));
    }
    if (status === 422) {
      // FastAPI validation error — pull the first message
      const errors = error.response.data?.detail;
      if (Array.isArray(errors) && errors.length > 0) {
        const first = errors[0];
        const field = Array.isArray(first.loc) ? first.loc.join('.') : '';
        return Promise.reject(new Error(`Validation error${field ? ` on ${field}` : ''}: ${first.msg}`));
      }
      return Promise.reject(new Error(detail || 'Invalid request data.'));
    }
    if (status === 500) {
      return Promise.reject(new Error(detail || 'Backend internal server error. Check server logs.'));
    }
    if (status === 503) {
      return Promise.reject(new Error('Backend service unavailable.'));
    }
    return Promise.reject(new Error(detail || `Unexpected error (HTTP ${status}).`));
  }
);

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function unwrapList(data) {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.items)) return data.items;
  if (data && Array.isArray(data.results)) return data.results;
  return [];
}

export async function checkApiHealth() {
  const { data } = await apiClient.get('/health');
  return data;
}
