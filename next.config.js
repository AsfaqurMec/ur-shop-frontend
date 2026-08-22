/** @type {import('next').NextConfig} */
/**
 * Legacy URLs below often come from an old WordPress site still present in Google’s index.
 * 301 → /shop consolidates signals to a real page; update Search Console after deploy.
 */
const legacyArchiveRedirects = [
  ['/editing-bundle', '/shop'],
  ['/editing-bundle/:path*', '/shop'],
  ['/plugin', '/shop'],
  ['/plugin/:path*', '/shop'],
  ['/business-tool', '/shop'],
  ['/business-tool/:path*', '/shop'],
  ['/category/editing-bundle', '/shop'],
  ['/category/editing-bundle/:path*', '/shop'],
  ['/category/plugin', '/shop'],
  ['/category/plugin/:path*', '/shop'],
  ['/category/business-tool', '/shop'],
  ['/category/business-tool/:path*', '/shop'],
];

const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  compress: true,
  poweredByHeader: false,
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days image cache
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: '**.onrender.com' },
      { protocol: 'http', hostname: 'localhost' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },
  async redirects() {
    return legacyArchiveRedirects.map(([source, destination]) => ({
      source,
      destination,
      permanent: true,
    }));
  },
  /**
   * Google Search and many crawlers request `/favicon.ico` by convention.
   * We ship the mark as `public/icon.png`; this serves it at that path too.
   */
  async rewrites() {
    return [{ source: '/favicon.ico', destination: '/icon.png' }];
  },
};

module.exports = nextConfig;
