import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Order Fulfillment',
  description: 'Manage shipping parcels, delivery assignments, and fulfillment queue.',
};

export default function AdminFulfillmentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
