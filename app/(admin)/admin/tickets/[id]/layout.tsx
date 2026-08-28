import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Support Ticket Details',
  description: 'Review customer message thread and manage ticket resolution.',
};

export default function AdminTicketDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
