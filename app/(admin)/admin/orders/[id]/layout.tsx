import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Order Details',
  description: 'Inspect order items, customer details, payment status, and fulfillment updates.',
};

export default function AdminOrderDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
