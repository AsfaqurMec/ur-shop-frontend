import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'My Orders',
  description: 'View and track your previous and active orders at UR Shop.',
};

export default function DashboardOrdersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
