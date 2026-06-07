'use client';

import { Button } from '@/components/ui';

export default function ProductsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="rounded-lg border bg-card p-6 text-center">
        <h2 className="text-lg font-semibold mb-2">Failed to load products</h2>
        <p className="text-muted-foreground text-sm mb-4">{error.message}</p>
        <Button variant="outline" onClick={reset}>
          Try again
        </Button>
      </div>
    </div>
  );
}
