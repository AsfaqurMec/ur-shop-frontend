/**
 * API base URL including `/api` path segment, no trailing slash.
 *
 * Server: `API_URL` / `BACKEND_URL` (internal), then `PUBLIC_API_URL`.
 *
 * Browser: `window.__DP_API_BASE__` from the root layout. That value is chosen so it matches how
 * SSR talks to the API: if `PUBLIC_API_URL` is still localhost in production but `API_URL` points
 * at your real HTTPS API, we inject the latter so login/cart (client) work like the shop (SSR).
 */
const strip = (s: string) => s.trim().replace(/\/$/, '');

/**
 * Hostnames the visitor's browser can resolve (not localhost, not bare Docker/K8s service names).
 */
function isProbablyBrowserReachable(url: string): boolean {
  try {
    const u = new URL(url);
    const host = u.hostname.toLowerCase();
    if (host === 'localhost' || host === '127.0.0.1') return false;
    const isIpv4 = /^\d{1,3}(\.\d{1,3}){3}$/.test(host);
    if (!host.includes('.') && !isIpv4) return false;
    return true;
  } catch {
    return false;
  }
}

/**
 * Value injected into the page for `getApiBaseUrl()` in the browser. Read only on the server.
 */
export function getRuntimePublicApiBase(): string {
  const pub = strip(process.env.PUBLIC_API_URL ?? '');
  const internal = strip(process.env.API_URL ?? process.env.BACKEND_URL ?? '');

  const pubOk = pub && isProbablyBrowserReachable(pub);
  const internalOk = internal && isProbablyBrowserReachable(internal);

  if (pubOk) return pub;
  if (internalOk) return internal;

  if (process.env.NODE_ENV !== 'production') {
    if (pub) return pub;
    if (internal) return internal;
  }

  return '';
}

function getInjectedBrowserApiBase(): string {
  if (typeof window === 'undefined') return '';
  const v = (window as unknown as { __DP_API_BASE__?: string }).__DP_API_BASE__;
  return typeof v === 'string' && v.trim() ? strip(v) : '';
}

let warnedProductionLocalhost = false;

function maybeWarnProductionLocalhost(): void {
  if (warnedProductionLocalhost) return;
  if (process.env.NODE_ENV !== 'production') return;
  const pub = process.env.PUBLIC_API_URL?.trim() ?? '';
  if (!pub) return;
  const lower = pub.toLowerCase();
  if (!lower.includes('localhost') && !lower.includes('127.0.0.1')) return;
  if (process.env.API_URL?.trim() || process.env.BACKEND_URL?.trim()) return;
  warnedProductionLocalhost = true;
  console.warn(
    '[getApiBaseUrl] PUBLIC_API_URL points to localhost in production but API_URL / BACKEND_URL are unset; server-side fetches to a remote backend may fail. Set API_URL or BACKEND_URL to your internal API base if applicable.'
  );
}

export function getApiBaseUrl(): string {
  if (typeof window === 'undefined') {
    const internalRaw = process.env.API_URL ?? process.env.BACKEND_URL;
    const internal = internalRaw?.trim();
    if (internal) return strip(internal);

    const publicRuntime = process.env.PUBLIC_API_URL?.trim();
    if (publicRuntime) {
      maybeWarnProductionLocalhost();
      return strip(publicRuntime);
    }

    if (process.env.NODE_ENV === 'development') {
      return strip('http://localhost:5001/api');
    }

    return '';
  }

  const injected = getInjectedBrowserApiBase();
  if (injected) return injected;

  if (process.env.NODE_ENV === 'development') {
    return strip('http://localhost:5001/api');
  }

  return '';
}
