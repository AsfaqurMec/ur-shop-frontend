import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'My Subscriptions',
  description: 'Manage active subscriptions, renewals, and recurring memberships at UR Shop.',
};

export default function DashboardSubscriptionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
