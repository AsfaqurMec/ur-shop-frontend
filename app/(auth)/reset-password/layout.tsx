import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Reset password',
  description: 'Set your new password.',
};

export default function ResetPasswordLayout({ children }: { children: React.ReactNode }) {
  return children;
}
