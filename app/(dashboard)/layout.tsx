import type { Metadata } from 'next';
import { DashboardNav } from '@/components/layout/DashboardNav';
import { DashboardSidebarShell } from '@/components/layout/DashboardSidebarShell';
import { DashboardAuthGuard } from '@/components/dashboard';
import { ThemeToggle } from '@/components/theme';
import { SEO_NO_INDEX } from '@/lib/seo/metadata';

export const metadata: Metadata = {
  title: { default: 'My account', template: '%s | Account' },
  ...SEO_NO_INDEX,
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardAuthGuard>
      <DashboardSidebarShell
        mobileBarTitle="My account"
        desktopWidthClass="md:w-60"
        desktopAsideClassName="md:border-b-0 md:border-r md:shadow-sm"
        mainClassName="min-h-[calc(100vh-1px)] flex-1 bg-muted/30 p-4 md:p-8 lg:p-10"
        mainInnerClassName="mx-auto max-w-6xl"
        sidebar={
          <>
            <div className="mb-4 hidden justify-end md:flex">
              <ThemeToggle />
            </div>
            <DashboardNav />
          </>
        }
      >
        {children}
      </DashboardSidebarShell>
    </DashboardAuthGuard>
  );
}
