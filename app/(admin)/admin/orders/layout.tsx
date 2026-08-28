import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Orders Management',
  description: 'Track, filter, and manage customer orders across all statuses.',
};

export default function AdminOrdersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
