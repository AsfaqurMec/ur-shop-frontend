import type { Metadata } from 'next';
import { AdminNav } from '@/components/layout/AdminNav';
import { DashboardSidebarShell } from '@/components/layout/DashboardSidebarShell';
import { AdminAuthGuard } from '@/components/admin/AdminAuthGuard';
import { ThemeToggle } from '@/components/theme';
import { SEO_NO_INDEX } from '@/lib/seo/metadata';

export const metadata: Metadata = {
  title: { default: 'Admin', template: '%s | Admin' },
  ...SEO_NO_INDEX,
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminAuthGuard>
      <DashboardSidebarShell
        mobileBarTitle="Admin"
        desktopWidthClass="md:w-64"
        desktopAsideClassName="md:border-b-0 md:border-r md:shadow-card"
        mainClassName="min-h-[calc(100vh-1px)] flex-1 bg-muted/25 p-4 md:p-8 lg:p-10"
        mainInnerClassName="mx-auto max-w-7xl"
        sidebar={
          <>
            <div className="mb-4 hidden justify-end md:flex">
              <ThemeToggle />
            </div>
            <AdminNav />
          </>
        }
      >
        {children}
      </DashboardSidebarShell>
    </AdminAuthGuard>
  );
}
