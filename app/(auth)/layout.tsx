import type { Metadata } from 'next';
import { ThemeToggle } from '@/components/theme';
import { SEO_NO_INDEX } from '@/lib/seo/metadata';

export const metadata: Metadata = {
  ...SEO_NO_INDEX,
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-dvh overflow-x-hidden">
      {/* Clip gradients/blur so translated or filtered decoration does not widen/tall the page scrollbox */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="absolute inset-0 bg-gradient-to-br from-accent/50 via-background to-background" />
        <div className="absolute right-0 top-0 h-96 w-96 translate-x-1/3 -translate-y-1/3 rounded-full bg-primary/10 blur-3xl" />
      </div>
      <div className="relative flex min-h-dvh flex-col items-center justify-center p-4 sm:p-6">
        <div className="absolute right-3 top-3 z-10 sm:right-5 sm:top-5">
          <ThemeToggle />
        </div>
        <div className="relative w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
