import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Account Overview',
  description: 'Manage your UR Shop account profile, view recent orders, and track active deliveries.',
};


export default function DashboardSectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
