import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import { Plus_Jakarta_Sans } from 'next/font/google';
import { ThemeProvider, THEME_INIT_SCRIPT } from '@/components/theme';
import { AddedToCartModalProvider } from '@/components/storefront/AddedToCartModalProvider';
import { AppToaster } from '@/components/ui/AppToaster';
import { getRuntimePublicApiBase } from '@/lib/api/baseUrl';
import { buildRootMetadata } from '@/lib/seo/metadata';
import './globals.css';

const fontSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = buildRootMetadata();

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'hsl(220 20% 98%)' },
    { media: '(prefers-color-scheme: dark)', color: 'hsl(222 47% 6%)' },
  ],
};

const API_BASE_INIT = (base: string) =>
  base
    ? `window.__DP_API_BASE__=${JSON.stringify(base)};`
    : '/* __DP_API_BASE__ unset: set PUBLIC_API_URL on the server or use dev default in getApiBaseUrl */';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const runtimeApiBase = getRuntimePublicApiBase();
  const pixelId = process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID;

  return (
    <html lang="en" className={fontSans.variable} suppressHydrationWarning>
      <body className="min-h-screen font-sans">
        <Script
          id="dp-theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }}
        />

        <Script
          id="dp-api-base"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: API_BASE_INIT(runtimeApiBase) }}
        />

        <ThemeProvider>
          <AddedToCartModalProvider>{children}</AddedToCartModalProvider>
          <AppToaster />
        </ThemeProvider>

        {/* Facebook Pixel */}
        {pixelId && (
          <Script id="facebook-pixel" strategy="afterInteractive">
            {`
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;
              n.push=n;
              n.loaded=!0;
              n.version='2.0';
              n.queue=[];
              t=b.createElement(e);
              t.async=!0;
              t.src=v;
              s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s);
              }(window, document, 'script',
              'https://connect.facebook.net/en_US/fbevents.js');

              fbq('init', '${pixelId}');
              fbq('track', 'PageView');
            `}
          </Script>
        )}
      </body>
    </html>
  );
}