'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { getMyOrders } from '@/lib/api/dashboard';
import { PageHeader, EmptyState, StatusBadge } from '@/components/dashboard';
import { Pagination } from '@/components/ui';
import { formatCurrency } from '@/lib/utils/format';

const PAGE_SIZE = 10;

function DashboardOrdersContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const pageFromUrl = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);

  const [orders, setOrders] = useState<Awaited<ReturnType<typeof getMyOrders>>['orders']>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const offset = (pageFromUrl - 1) * PAGE_SIZE;
    let cancelled = false;
    setLoading(true);
    setError(null);
    getMyOrders({ limit: PAGE_SIZE, offset })
      .then((r) => {
        if (cancelled) return;
        setOrders(r.orders);
        setTotal(r.total);
        const totalPages = Math.max(1, Math.ceil(r.total / PAGE_SIZE) || 1);
        if (r.total > 0 && pageFromUrl > totalPages) {
          const p = new URLSearchParams(searchParams.toString());
          if (totalPages <= 1) p.delete('page');
          else p.set('page', String(totalPages));
          router.replace(p.toString() ? `${pathname}?${p}` : pathname);
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [pageFromUrl, pathname, router, searchParams]);

  const setPage = (p: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (p <= 1) params.delete('page');
    else params.set('page', String(p));
    const q = params.toString();
    router.push(q ? `${pathname}?${q}` : pathname);
  };

  if (loading && orders.length === 0) {
    return (
      <div className="flex justify-center py-12">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="My orders" description="View your order history" />
      {error && (
        <div className="mb-4 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive text-sm">
          {error}
        </div>
      )}
      {orders.length === 0 && total === 0 ? (
        <EmptyState
          title="No orders yet"
          description="When you place an order, it will appear here."
          action={
            <Link href="/shop">
              <span className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                Browse shop
              </span>
            </Link>
          }
        />
      ) : (
        <>
          <div className={`overflow-x-auto rounded-lg border ${loading ? 'pointer-events-none opacity-60' : ''}`}>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium">Order</th>
                  <th className="px-4 py-3 text-left font-medium">Date</th>
                  <th className="px-4 py-3 text-right font-medium">Total</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-b last:border-b-0 hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">#{order.order_number}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(order.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {formatCurrency(order.total, order.currency)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/dashboard/orders/${order.id}`}
                        className="text-primary hover:underline"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-6">
            <Pagination
              page={pageFromUrl}
              pageSize={PAGE_SIZE}
              totalItems={total}
              onPageChange={setPage}
              disabled={loading}
              ariaLabel="Orders pagination"
            />
          </div>
        </>
      )}
    </div>
  );
}

export default function DashboardOrdersPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-12">
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      }
    >
      <DashboardOrdersContent />
    </Suspense>
  );
}
