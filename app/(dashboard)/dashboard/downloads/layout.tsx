import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'My Downloads',
  description: 'Access and download files, invoices, and documents for your UR Shop purchases.',
};

export default function DashboardDownloadsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
