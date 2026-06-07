import type { Metadata } from 'next';
import { SEO_NO_INDEX } from '@/lib/seo/metadata';

export const metadata: Metadata = {
  title: 'Checkout',
  description: 'Complete your order',
  ...SEO_NO_INDEX,
};

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
