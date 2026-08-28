import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Create Account',
  description: 'Create an account with UR Shop for quick checkout, order history, and exclusive member offers.',
};


export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return children;
}
