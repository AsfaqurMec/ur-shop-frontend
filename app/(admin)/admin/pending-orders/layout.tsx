import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pending Orders',
  description: 'Review and confirm newly placed customer orders.',
};

export default function AdminPendingOrdersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
