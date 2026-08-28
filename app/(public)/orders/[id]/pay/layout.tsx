import type { Metadata } from 'next';
import { SEO_NO_INDEX } from '@/lib/seo/metadata';

export const metadata: Metadata = {
  title: 'Submit Order Payment',
  description: 'Upload payment transaction details and proof for your UR Shop order.',
  ...SEO_NO_INDEX,
};


export default function OrderPayLayout({ children }: { children: React.ReactNode }) {
  return children;
}
