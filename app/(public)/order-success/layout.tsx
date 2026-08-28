import type { Metadata } from 'next';
import { SEO_NO_INDEX } from '@/lib/seo/metadata';

export const metadata: Metadata = {
  title: 'Order Confirmed',
  description: 'Thank you for your purchase! Your order has been placed successfully at UR Shop.',
  ...SEO_NO_INDEX,
};


export default function OrderSuccessLayout({ children }: { children: React.ReactNode }) {
  return children;
}
