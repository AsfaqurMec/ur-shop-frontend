import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Order Details',
  description: 'View order invoice, purchased items, delivery progress, and payment status at UR Shop.',
};

export default function DashboardOrderDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
