import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Support Ticket Discussion',
  description: 'View customer support ticket discussion and replies.',
};

export default function DashboardTicketDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
