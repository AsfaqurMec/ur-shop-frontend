/** JWT payload shape from the backend access token (UI-only decode; API verifies). */
export interface AccessTokenPayload {
  id?: number;
  email?: string;
  role?: string;
}

/**
 * Read JWT payload without verifying signature (UI routing only; API enforces auth).
 */
export function decodeAccessTokenPayload(token: string | null): AccessTokenPayload | null {
  if (!token) return null;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    let b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    while (b64.length % 4) b64 += '=';
    const json = decodeURIComponent(
      atob(b64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(json) as AccessTokenPayload;
  } catch {
    return null;
  }
}

export function getAccessTokenUserId(token: string | null): number | null {
  const p = decodeAccessTokenPayload(token);
  return typeof p?.id === 'number' ? p.id : null;
}

export function getAccessTokenRole(token: string | null): 'user' | 'admin' | null {
  const p = decodeAccessTokenPayload(token);
  if (!p?.role) return null;
  return p.role === 'admin' ? 'admin' : 'user';
}
