import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Coupons & Discounts',
  description: 'Create and manage promotional coupon codes, discounts, and limits.',
};

export default function AdminCouponsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
