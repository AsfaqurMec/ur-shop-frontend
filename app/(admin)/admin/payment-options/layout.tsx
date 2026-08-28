import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Payment Options',
  description: 'Configure payment methods, bKash credentials, and manual bank transfer instructions.',
};

export default function AdminPaymentOptionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
