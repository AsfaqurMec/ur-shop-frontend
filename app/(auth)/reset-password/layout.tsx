import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Reset Password',
  description: 'Set a new secure password for your UR Shop account.',
};


export default function ResetPasswordLayout({ children }: { children: React.ReactNode }) {
  return children;
}
