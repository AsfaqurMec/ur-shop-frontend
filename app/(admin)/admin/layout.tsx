import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard Overview',
  description: 'Real-time store performance, sales analytics, and order tracking.',
};

export default function AdminOverviewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
