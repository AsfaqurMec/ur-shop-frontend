import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Store Settings',
  description: 'Manage store name, branding, contact info, social links, and storefront policies.',
};

export default function AdminSettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
