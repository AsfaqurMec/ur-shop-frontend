import type { Metadata } from 'next';
import { SEO_NO_INDEX } from '@/lib/seo/metadata';

export const metadata: Metadata = {
  title: 'Cart',
  description: 'Your shopping cart',
  ...SEO_NO_INDEX,
};

export default function CartLayout({ children }: { children: React.ReactNode }) {
  return children;
}
