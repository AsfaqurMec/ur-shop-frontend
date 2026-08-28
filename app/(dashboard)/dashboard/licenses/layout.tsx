import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'My Licenses',
  description: 'View and manage purchased product license keys at UR Shop.',
};

export default function DashboardLicensesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
