import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Support Tickets',
  description: 'View customer support inquiries and tickets for your UR Shop account.',
};

export default function DashboardTicketsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
