import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Forgot Password',
  description: 'Reset your UR Shop account password securely with your registered email address.',
};


export default function ForgotPasswordLayout({ children }: { children: React.ReactNode }) {
  return children;
}
