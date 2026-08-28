import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Edit Product',
  description: 'Update product information, variations, images, and pricing.',
};

export default function AdminEditProductLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
