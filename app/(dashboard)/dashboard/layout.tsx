import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Your account dashboard',
};

export default function DashboardSectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
