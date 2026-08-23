'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getProfile } from '@/lib/api/auth';
import { getSafeReturnPath } from '@/lib/auth/returnPath';

export function DashboardAuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;
    getProfile()
      .then((data) => {
        if (!active) return;
        if (data.user?.role === 'admin') {
          setAuthorized(false);
          router.replace('/admin');
        } else {
          setAuthorized(true);
        }
      })
      .catch(() => {
        if (!active) return;
        setAuthorized(false);
        router.replace('/login?redirect=' + encodeURIComponent(getSafeReturnPath()));
      });

    return () => {
      active = false;
    };
  }, [router]);

  if (authorized !== true) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return <>{children}</>;
}
