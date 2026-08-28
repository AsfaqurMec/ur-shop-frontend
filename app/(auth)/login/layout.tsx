import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign In',
  description: 'Sign in to your UR Shop account to view orders, track delivery status, and manage your profile.',
};


export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
