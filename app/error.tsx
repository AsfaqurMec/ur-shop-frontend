'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui';

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6">
      <div className="w-full max-w-md rounded-2xl border border-border/80 bg-card p-8 text-center shadow-card">
        <h1 className="text-xl font-bold text-foreground">Something went wrong</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          An unexpected error occurred. You can try again or return to the home page.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button variant="outline" onClick={() => (window.location.href = '/')}>
            Go home
          </Button>
          <Button onClick={reset}>Try again</Button>
        </div>
      </div>
    </div>
  );
}
