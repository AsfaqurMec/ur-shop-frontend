import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Customer Reviews',
  description: 'Moderate customer ratings, product feedback, and store reviews.',
};

export default function AdminReviewsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
