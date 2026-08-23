/**
 * API base URL.
 *
 * Browser: Always uses relative `/api` on the current domain.
 * Next.js server-side rewrites proxy `/api/*` to the backend without exposing the backend URL to the client.
 *
 * Server (SSR): Uses private server environment variables (`BACKEND_URL` / `API_URL`).
 */
const strip = (s: string) => s.trim().replace(/\/$/, '');

/**
 * Kept for root layout compatibility; returns empty string so no backend URL is exposed in client DOM.
 */
export function getRuntimePublicApiBase(): string {
  return '';
}

export function getApiBaseUrl(): string {
  if (typeof window === 'undefined') {
    const internalRaw =
      process.env.INTERNAL_BACKEND_URL ||
      process.env.BACKEND_URL ||
      process.env.API_URL ||
      process.env.PUBLIC_API_URL;
    const internal = internalRaw?.trim();
    if (internal) {
      const base = strip(internal);
      return base.endsWith('/api') ? base : `${base}/api`;
    }

    return 'http://localhost:5001/api';
  }

  // In the browser, all API calls go to the same-origin Next.js proxy route /api
  return '/api';
}
