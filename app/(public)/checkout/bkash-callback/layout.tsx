import type { Metadata } from 'next';
import { SEO_NO_INDEX } from '@/lib/seo/metadata';

export const metadata: Metadata = {
  title: 'bKash Payment Verification',
  description: 'Verifying your bKash payment transaction with UR Shop.',
  ...SEO_NO_INDEX,
};

export default function BkashCallbackLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
