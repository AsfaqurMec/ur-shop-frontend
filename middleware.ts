import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getAccessTokenRole, isTokenExpired } from './lib/auth/token';

function getBackendApiUrl(): string {
  const raw =
    process.env.INTERNAL_BACKEND_URL ||
    process.env.BACKEND_URL ||
    process.env.API_URL ||
    process.env.PUBLIC_API_URL ||
    'http://localhost:5001';
  const base = raw.trim().replace(/\/$/, '');
  return base.endsWith('/api') ? base : `${base}/api`;
}

interface RefreshResult {
  accessToken: string;
  refreshToken: string;
  role: 'user' | 'admin';
}

async function tryRefreshAtEdge(refreshToken: string): Promise<RefreshResult | null> {
  try {
    const apiUrl = getBackendApiUrl();
    const res = await fetch(`${apiUrl}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `refresh_token=${refreshToken}`,
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) return null;
    const json = await res.json().catch(() => null);
    if (!json?.success || !json.data?.accessToken) return null;

    return {
      accessToken: json.data.accessToken as string,
      refreshToken: (json.data.refreshToken as string) || refreshToken,
      role: json.data.user?.role === 'admin' ? 'admin' : 'user',
    };
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const isProtectedAdmin = pathname.startsWith('/admin');
  const isProtectedDashboard = pathname.startsWith('/dashboard');
  const isAuthRoute = pathname === '/login' || pathname === '/register';

  let authToken = request.cookies.get('auth_token')?.value;
  const refreshToken = request.cookies.get('refresh_token')?.value;
  let refreshedTokens: RefreshResult | null = null;

  // If accessing a protected route or auth route and auth_token is missing or expired, attempt seamless token refresh
  if ((isProtectedAdmin || isProtectedDashboard || isAuthRoute) && (!authToken || isTokenExpired(authToken)) && refreshToken) {
    refreshedTokens = await tryRefreshAtEdge(refreshToken);
    if (refreshedTokens) {
      authToken = refreshedTokens.accessToken;
    }
  }

  const effectiveRole = authToken && !isTokenExpired(authToken) ? getAccessTokenRole(authToken) : null;

  // 1. Protected Admin routes
  if (isProtectedAdmin) {
    if (effectiveRole !== 'admin') {
      const returnUrl = encodeURIComponent(`${pathname}${search}`);
      // If authenticated as a customer, send them to /dashboard; otherwise to /login
      const targetUrl = effectiveRole === 'user' ? '/dashboard' : `/login?redirect=${returnUrl}`;
      const redirectResponse = NextResponse.redirect(new URL(targetUrl, request.url));
      if (!effectiveRole) {
        redirectResponse.cookies.delete('auth_token');
      }
      return redirectResponse;
    }
  }

  // 2. Protected Customer Dashboard routes
  if (isProtectedDashboard) {
    if (!effectiveRole) {
      const returnUrl = encodeURIComponent(`${pathname}${search}`);
      const loginUrl = new URL(`/login?redirect=${returnUrl}`, request.url);
      const redirectResponse = NextResponse.redirect(loginUrl);
      redirectResponse.cookies.delete('auth_token');
      return redirectResponse;
    }
  }

  // 3. Prevent already-authenticated users from seeing the login/register forms
  if (isAuthRoute && effectiveRole) {
    const redirectParam = request.nextUrl.searchParams.get('redirect');
    const target =
      redirectParam && redirectParam.startsWith('/') && !redirectParam.startsWith('//')
        ? redirectParam
        : effectiveRole === 'admin'
        ? '/admin'
        : '/dashboard';
    const redirectResponse = NextResponse.redirect(new URL(target, request.url));
    if (refreshedTokens) {
      const isProd = process.env.NODE_ENV === 'production';
      const cookieOpts = {
        httpOnly: true,
        secure: isProd,
        sameSite: 'lax' as const,
        path: '/',
      };
      redirectResponse.cookies.set('auth_token', refreshedTokens.accessToken, {
        ...cookieOpts,
        maxAge: 15 * 60,
      });
      redirectResponse.cookies.set('refresh_token', refreshedTokens.refreshToken, {
        ...cookieOpts,
        maxAge: 7 * 24 * 60 * 60,
      });
    }
    return redirectResponse;
  }

  // Forward refreshed tokens in request headers so downstream Server Components receive them
  if (refreshedTokens) {
    request.cookies.set('auth_token', refreshedTokens.accessToken);
    request.cookies.set('refresh_token', refreshedTokens.refreshToken);
  }

  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // If tokens were refreshed, persist the fresh cookies back to the browser
  if (refreshedTokens) {
    const isProd = process.env.NODE_ENV === 'production';
    const cookieOpts = {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax' as const,
      path: '/',
    };
    response.cookies.set('auth_token', refreshedTokens.accessToken, {
      ...cookieOpts,
      maxAge: 15 * 60,
    });
    response.cookies.set('refresh_token', refreshedTokens.refreshToken, {
      ...cookieOpts,
      maxAge: 7 * 24 * 60 * 60,
    });
  }

  // Defense-in-depth security headers
  response.headers.set('X-DNS-Prefetch-Control', 'on');
  response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  return response;
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/dashboard/:path*',
    '/login',
    '/register',
    '/((?!_next/static|_next/image|favicon.ico|icon.png|manifest.webmanifest|robots.txt|sitemap.xml).*)',
  ],
};
