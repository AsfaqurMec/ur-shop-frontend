'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { getAdminRecentOrders } from '@/lib/api/admin';
import { AdminPageHeader, DataTable } from '@/components/admin';
import { Pagination } from '@/components/ui';
import { formatCurrency } from '@/lib/utils/format';
import type { AdminRecentOrder } from '@/lib/api/admin';

const PAGE_SIZE = 10;

function PendingOrdersContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const pageFromUrl = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);

  const [orders, setOrders] = useState<AdminRecentOrder[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const offset = (pageFromUrl - 1) * PAGE_SIZE;
    let cancelled = false;
    setLoading(true);
    setError(null);
    getAdminRecentOrders({ limit: PAGE_SIZE, offset, status: 'pending' })
      .then((r) => {
        if (cancelled) return;
        setOrders(r.orders);
        setTotal(r.total);
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
  }, [pageFromUrl]);

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
      <AdminPageHeader title="Pending orders" description="Orders waiting for admin review" />
      {error && (
        <div className="mb-4 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}
      <div className={loading ? 'pointer-events-none opacity-60' : ''}>
        <DataTable<AdminRecentOrder>
          columns={[
            { key: 'id', header: 'ID', render: (r) => `#${r.id}` },
            { key: 'order_number', header: 'Order', render: (r) => `#${r.order_number}` },
            { key: 'status', header: 'Status', render: (r) => <span className="capitalize">{r.status}</span> },
            { key: 'total', header: 'Total', render: (r) => formatCurrency(r.total, r.currency) },
            { key: 'user_id', header: 'User ID' },
            { key: 'created_at', header: 'Date', render: (r) => new Date(r.created_at).toLocaleString() },
            {
              key: 'actions',
              header: '',
              render: (r) => (
                <Link href={`/admin/orders/${r.id}`} className="text-primary hover:underline">
                  View
                </Link>
              ),
            },
          ]}
          data={orders}
          keyExtractor={(r) => r.id}
          emptyMessage="No pending orders"
        />
      </div>
      <div className="mt-6">
        <Pagination
          page={pageFromUrl}
          pageSize={PAGE_SIZE}
          totalItems={total}
          onPageChange={setPage}
          disabled={loading}
        />
      </div>
    </div>
  );
}

export default function PendingOrdersPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-12">
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      }
    >
      <PendingOrdersContent />
    </Suspense>
  );
}
