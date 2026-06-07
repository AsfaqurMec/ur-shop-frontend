import { NextRequest, NextResponse } from 'next/server';
import { getApiBaseUrl } from '@/lib/api/baseUrl';

export const dynamic = 'force-dynamic';

/**
 * Same-origin proxy for product images. The browser loads /api/media/products/images/... from
 * Next; this handler fetches the file from the Express backend (reads env on the server).
 * Fixes storefront images when direct links to localhost:API_PORT fail from the browser.
 */
function getBackendOrigin(): string | null {
  const upload = process.env.NEXT_PUBLIC_UPLOAD_BASE?.trim();
  if (upload) return upload.replace(/\/$/, '');
  const api = getApiBaseUrl();
  const origin = api.replace(/\/api\/?$/i, '').replace(/\/$/, '');
  return origin || null;
}

export async function GET(
  _req: NextRequest,
  context: { params: { path: string[] } }
): Promise<NextResponse> {
  const raw = context.params.path;
  if (!raw?.length) {
    return new NextResponse('Not found', { status: 404 });
  }

  const segments = raw.map((s) => {
    try {
      return decodeURIComponent(s);
    } catch {
      return s;
    }
  });

  if (segments.some((s) => s === '..' || s === '.' || s.includes('\0'))) {
    return new NextResponse('Not found', { status: 404 });
  }

  const rel = segments.join('/');
  const lower = rel.toLowerCase();
  if (!lower.startsWith('products/images/')) {
    return new NextResponse('Not found', { status: 404 });
  }

  const origin = getBackendOrigin();
  if (!origin) {
    return new NextResponse('Missing PUBLIC_API_URL or NEXT_PUBLIC_UPLOAD_BASE', { status: 500 });
  }

  const upstreamUrl = `${origin}/${rel.split('/').map(encodeURIComponent).join('/')}`;

  let upstream: Response;
  try {
    upstream = await fetch(upstreamUrl, {
      cache: 'no-store',
      headers: { Accept: 'image/*,*/*;q=0.8' },
    });
  } catch {
    return new NextResponse('Bad gateway', { status: 502 });
  }

  if (!upstream.ok) {
    return new NextResponse(null, { status: upstream.status === 404 ? 404 : 502 });
  }

  const contentType = upstream.headers.get('content-type') || 'application/octet-stream';
  const buf = await upstream.arrayBuffer();

  return new NextResponse(buf, {
    status: 200,
    headers: {
      'Content-Type': contentType,
      // Avoid stale pixels when the same URL is reused; catalog JSON is also no-store.
      'Cache-Control': 'private, max-age=0, must-revalidate',
    },
  });
}
