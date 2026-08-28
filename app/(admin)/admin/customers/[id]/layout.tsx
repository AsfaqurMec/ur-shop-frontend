import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Customer Profile',
  description: 'Detailed customer account information, purchase history, and spending analytics.',
};

export default function AdminCustomerDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
