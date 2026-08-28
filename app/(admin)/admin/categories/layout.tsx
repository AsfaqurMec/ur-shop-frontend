import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Categories Management',
  description: 'Organize store product categories, slugs, and display order.',
};

export default function AdminCategoriesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
