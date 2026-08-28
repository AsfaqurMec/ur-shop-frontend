import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Hero Banners',
  description: 'Manage homepage hero slider banners and promotional visuals.',
};

export default function AdminBannersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
