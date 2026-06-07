/**
 * Validates `?redirect=` from the URL before using it in router.push after login.
 */
export function sanitizeRedirectParam(
  value: string | null | undefined,
  defaultPath = '/dashboard'
): string {
  if (value == null || value === '') return defaultPath;
  if (!value.startsWith('/') || value.startsWith('//')) return defaultPath;
  const pathname = value.split('?')[0] ?? '';
  const authRoutes = ['/login', '/register', '/forgot-password', '/reset-password', '/verify-email'];
  if (authRoutes.some((r) => pathname === r || pathname.startsWith(`${r}/`))) {
    return defaultPath;
  }
  return value;
}

/**
 * Builds a same-origin path (+ query) safe to pass as `?redirect=` after login.
 * Avoids open redirects and auth-page loops.
 */
export function getSafeReturnPath(): string {
  if (typeof window === 'undefined') return '/dashboard';
  const pathname = window.location.pathname;
  const full = pathname + window.location.search;
  const authRoutes = ['/login', '/register', '/forgot-password', '/reset-password', '/verify-email'];
  if (authRoutes.some((r) => pathname === r || pathname.startsWith(`${r}/`))) {
    return '/dashboard';
  }
  if (!pathname.startsWith('/') || pathname.startsWith('//')) {
    return '/dashboard';
  }
  return full;
}
