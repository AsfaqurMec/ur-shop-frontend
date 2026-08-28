import type { Metadata } from 'next';
import { SEO_NO_INDEX } from '@/lib/seo/metadata';

export const metadata: Metadata = {
  title: 'Shopping Cart',
  description: 'Review your selected Panjabis, clothing items, and accessories in your cart before checkout at UR Shop.',
  ...SEO_NO_INDEX,
};


export default function CartLayout({ children }: { children: React.ReactNode }) {
  return children;
}
