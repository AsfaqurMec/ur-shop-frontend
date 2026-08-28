import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Payment Verification & Reviews',
  description: 'Review and verify customer manual payment receipts and transactions.',
};

export default function AdminPaymentReviewsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
