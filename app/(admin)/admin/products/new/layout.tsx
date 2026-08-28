import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Add New Product',
  description: 'Create a new product listing in UR Shop.',
};

export default function AdminNewProductLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
