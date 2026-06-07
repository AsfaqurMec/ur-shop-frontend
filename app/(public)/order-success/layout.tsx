import type { Metadata } from 'next';
import { SEO_NO_INDEX } from '@/lib/seo/metadata';

export const metadata: Metadata = {
  title: 'Order placed',
  description: 'Your order was placed successfully',
  ...SEO_NO_INDEX,
};

export default function OrderSuccessLayout({ children }: { children: React.ReactNode }) {
  return children;
}
