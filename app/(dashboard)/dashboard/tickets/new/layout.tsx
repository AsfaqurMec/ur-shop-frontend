import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Open Support Ticket',
  description: 'Submit a new customer support ticket to the UR Shop support team.',
};

export default function DashboardNewTicketLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
