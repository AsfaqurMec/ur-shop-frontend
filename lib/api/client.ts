/**
 * API client for the backend. Browser: runtime `window.__DP_API_BASE__` (from `PUBLIC_API_URL`), else dev default.
 * Server: API_URL / BACKEND_URL, else PUBLIC_API_URL.
 * Attaches auth token from localStorage (key: auth_token) or cookie when present.
 * Handles 401 by clearing token and optionally redirecting to login.
 */

import { getApiBaseUrl } from './baseUrl';
import { getSafeReturnPath } from '@/lib/auth/returnPath';

const TOKEN_KEY = 'auth_token';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

/** Current access token from localStorage (client-only). */
export function getAuthToken(): string | null {
  return getToken();
}

export function setAuthToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearAuthToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface RequestConfig extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
  skipAuth?: boolean;
  /** When true, a 401 response clears the token but does not redirect to login (useful on bKash return URL). */
  skip401Redirect?: boolean;
  /**
   * Server-only: opt into time-based revalidation for public catalog reads (sitemap, SEO).
   * When unset, defaults to `no-store` for fresh user/session-sensitive data.
   */
  serverCacheSeconds?: number;
}

function buildUrl(path: string, params?: Record<string, string | number | boolean | undefined>): string {
  const base = getApiBaseUrl().replace(/\/$/, '');
  if (!base && typeof window === 'undefined') {
    console.warn('[api] Missing API_URL / BACKEND_URL / PUBLIC_API_URL; server fetches will fail.');
  }
  const url = path.startsWith('/') ? `${base}${path}` : `${base}/${path}`;
  if (!params) return url;
  const search = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== '') search.set(k, String(v));
  }
  const q = search.toString();
  return q ? `${url}?${q}` : url;
}

type HandleResponseOptions = { skip401Redirect?: boolean };

async function handleResponse<T>(
  res: Response,
  options?: HandleResponseOptions
): Promise<ApiResponse<T>> {
  const json = (await res.json().catch(() => ({}))) as ApiResponse<T>;
  if (res.status === 401) {
    clearAuthToken();
    if (typeof window !== 'undefined' && !options?.skip401Redirect) {
      const returnTo = getSafeReturnPath();
      window.location.assign('/login?redirect=' + encodeURIComponent(returnTo));
    }
  }
  if (!res.ok) {
    const j = json as unknown as Record<string, unknown> | null;
    if (j && typeof j === 'object' && j.success === false) {
      const msg =
        (typeof j.error === 'string' && j.error) ||
        (typeof j.message === 'string' && j.message) ||
        res.statusText ||
        'Request failed';
      return { ...j, success: false, error: msg } as ApiResponse<T>;
    }
    return {
      success: false,
      error: res.statusText || `HTTP ${res.status}`,
    } as ApiResponse<T>;
  }
  return json;
}

export async function api<T = unknown>(
  path: string,
  config: RequestConfig = {}
): Promise<ApiResponse<T>> {
  const { params, skipAuth, skip401Redirect, serverCacheSeconds, ...init } = config;
  const url = buildUrl(path, params);
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string>),
  };
  const token = skipAuth ? null : getToken();
  if (token) (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;

  /** Prefer `next.revalidate` alone — combining with `cache: force-cache` triggers Next.js warnings. */
  const serverFetch =
    typeof window === 'undefined'
      ? serverCacheSeconds != null && serverCacheSeconds > 0
        ? { next: { revalidate: serverCacheSeconds } }
        : { cache: 'no-store' as RequestCache, next: { revalidate: 0 } }
      : {};

  const res = await fetch(url, {
    ...init,
    headers,
    ...serverFetch,
  });
  return handleResponse<T>(res, {
    skip401Redirect: Boolean(skip401Redirect) || Boolean(skipAuth),
  });
}

export const apiGet = <T = unknown>(path: string, config?: RequestConfig) =>
  api<T>(path, { ...config, method: 'GET' });

export const apiPost = <T = unknown>(path: string, body?: unknown, config?: RequestConfig) =>
  api<T>(path, { ...config, method: 'POST', body: body ? JSON.stringify(body) : undefined });

export const apiPut = <T = unknown>(path: string, body?: unknown, config?: RequestConfig) =>
  api<T>(path, { ...config, method: 'PUT', body: body ? JSON.stringify(body) : undefined });

export const apiPatch = <T = unknown>(path: string, body?: unknown, config?: RequestConfig) =>
  api<T>(path, { ...config, method: 'PATCH', body: body ? JSON.stringify(body) : undefined });

export const apiDelete = <T = unknown>(path: string, config?: RequestConfig) =>
  api<T>(path, { ...config, method: 'DELETE' });

/** POST with FormData (e.g. file upload). Do not set Content-Type; browser sets multipart boundary. */
export async function apiPostFormData<T = unknown>(
  path: string,
  formData: FormData,
  config?: Omit<RequestConfig, 'body' | 'headers'> & { headers?: HeadersInit }
): Promise<ApiResponse<T>> {
  const { params, skipAuth, skip401Redirect, ...init } = config ?? {};
  const url = buildUrl(path, params);
  const headers: HeadersInit = { ...(init.headers as Record<string, string>) };
  const token = skipAuth ? null : getToken();
  if (token) (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  const res = await fetch(url, { ...init, method: 'POST', body: formData, headers });
  const skip401 = Boolean(skip401Redirect) || Boolean(skipAuth);
  return handleResponse<T>(res, { skip401Redirect: skip401 });
}

export async function apiPutFormData<T = unknown>(
  path: string,
  formData: FormData,
  config?: Omit<RequestConfig, 'body' | 'headers'> & { headers?: HeadersInit }
): Promise<ApiResponse<T>> {
  const { params, skipAuth, skip401Redirect, ...init } = config ?? {};
  const url = buildUrl(path, params);
  const headers: HeadersInit = { ...(init.headers as Record<string, string>) };
  const token = skipAuth ? null : getToken();
  if (token) (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  const res = await fetch(url, { ...init, method: 'PUT', body: formData, headers });
  const skip401 = Boolean(skip401Redirect) || Boolean(skipAuth);
  return handleResponse<T>(res, { skip401Redirect: skip401 });
}
