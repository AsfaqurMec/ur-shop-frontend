import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Products Catalog',
  description: 'Manage store products, stock inventory, pricing, and variations.',
};

export default function AdminProductsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
