import type { Metadata } from 'next';
import { SEO_NO_INDEX } from '@/lib/seo/metadata';

export const metadata: Metadata = {
  title: 'Submit payment',
  description: 'Upload your payment proof',
  ...SEO_NO_INDEX,
};

export default function OrderPayLayout({ children }: { children: React.ReactNode }) {
  return children;
}
