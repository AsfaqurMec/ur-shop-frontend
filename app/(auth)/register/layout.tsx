import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Create account',
  description: 'Register for an account.',
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return children;
}
