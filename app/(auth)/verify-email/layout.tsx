import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Verify Email',
  description: 'Verify your email address to complete your UR Shop account registration.',
};


export default function VerifyEmailLayout({ children }: { children: React.ReactNode }) {
  return children;
}
