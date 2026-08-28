import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Customer Management',
  description: 'View registered customer accounts, profiles, and order histories.',
};

export default function AdminCustomersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
