import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Featured & Trending Products',
  description: 'Curate featured and trending products for the storefront homepage.',
};

export default function AdminTrendingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
