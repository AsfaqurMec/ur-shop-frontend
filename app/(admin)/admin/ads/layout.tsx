import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Promotional Ads & Popups',
  description: 'Configure storefront marketing popup ads and promotional campaigns.',
};

export default function AdminAdsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
