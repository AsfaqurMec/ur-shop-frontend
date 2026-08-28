import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Profile Settings',
  description: 'Manage your personal information, contact numbers, shipping addresses, and password security.',
};

export default function DashboardProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
