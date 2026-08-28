import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Email Templates & Logs',
  description: 'Configure automated notification emails and monitor mail delivery history.',
};

export default function AdminEmailsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
