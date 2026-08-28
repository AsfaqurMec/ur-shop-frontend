import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Support Tickets',
  description: 'Manage customer support requests, tickets, and inquiries.',
};

export default function AdminTicketsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
