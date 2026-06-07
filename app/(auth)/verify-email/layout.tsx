import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Verify email',
  description: 'Verify your email address.',
};

export default function VerifyEmailLayout({ children }: { children: React.ReactNode }) {
  return children;
}
