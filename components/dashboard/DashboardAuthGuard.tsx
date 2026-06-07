'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAccessTokenRole } from '@/lib/auth/token';
import { getSafeReturnPath } from '@/lib/auth/returnPath';

const TOKEN_KEY = 'auth_token';

function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function DashboardAuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const token = getAuthToken();
    if (!token) {
      router.replace('/login?redirect=' + encodeURIComponent(getSafeReturnPath()));
      return;
    }
    if (getAccessTokenRole(token) === 'admin') {
      router.replace('/admin');
    }
  }, [mounted, router]);

  if (!mounted) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return <>{children}</>;
}
