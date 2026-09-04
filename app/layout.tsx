import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import { Plus_Jakarta_Sans, Hind_Siliguri } from 'next/font/google';
import { ThemeProvider, THEME_INIT_SCRIPT } from '@/components/theme';
import { AddedToCartModalProvider } from '@/components/storefront/AddedToCartModalProvider';
import { AppToaster } from '@/components/ui/AppToaster';
import { buildRootMetadata } from '@/lib/seo/metadata';
import './globals.css';

const fontSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const fontBengali = Hind_Siliguri({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['bengali', 'latin'],
  variable: '--font-bengali',
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
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pixelId = process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID;

  return (
    <html lang="en" className={`${fontSans.variable} ${fontBengali.variable}`} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://res.cloudinary.com" crossOrigin="" />
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      </head>
      <body className="min-h-screen font-sans">
        <Script
          id="dp-theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }}
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

              fbq('init', '${pixelId.replace(/[^0-9a-zA-Z_-]/g, '')}');
              fbq('track', 'PageView');
            `}
          </Script>
        )}
      </body>
    </html>
  );
}
