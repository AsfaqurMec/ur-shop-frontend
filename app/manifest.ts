import type { MetadataRoute } from 'next';
import { SITE_NAME } from '@/lib/seo/site';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_NAME,
    short_name: SITE_NAME,
    description: 'Trusted for Premium Panjabi Collection 👔 Men’s Fashion | Lifestyle Accessories.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0f172a',
    theme_color: '#1e3a5f',
    lang: 'en',
    icons: [
      {
        src: '/icon.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}
