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

function AdminOrdersContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const pageFromUrl = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
  const statusFromUrl = searchParams.get('status') || '';

  const [orders, setOrders] = useState<AdminRecentOrder[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const offset = (pageFromUrl - 1) * PAGE_SIZE;
    let cancelled = false;
    setLoading(true);
    setError(null);
    getAdminRecentOrders({ limit: PAGE_SIZE, offset, status: statusFromUrl || undefined })
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
  }, [pageFromUrl, pathname, router, searchParams, statusFromUrl]);

  const setPage = (p: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (p <= 1) params.delete('page');
    else params.set('page', String(p));
    const q = params.toString();
    router.push(q ? `${pathname}?${q}` : pathname);
  };

  const setStatus = (status: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('page');
    if (status) params.set('status', status);
    else params.delete('status');
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
      <AdminPageHeader title="Orders" description="All orders" />
      <div className="mb-4 flex flex-col gap-2 rounded-lg border border-border bg-card/40 p-3 sm:flex-row sm:items-center sm:justify-between">
        <label htmlFor="status-filter" className="text-sm font-medium text-foreground">
          Filter by status
        </label>
        <select
          id="status-filter"
          value={statusFromUrl}
          onChange={(event) => setStatus(event.target.value)}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground"
        >
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="paid">Paid</option>
          <option value="unpaid">Unpaid</option>
          <option value="processing">Processing</option>
          <option value="completed">Completed</option>
          <option value="refunded">Refunded</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>
      {error && (
        <div className="mb-4 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive text-sm">
          {error}
        </div>
      )}
      <div className={loading ? 'pointer-events-none opacity-60' : ''}>
        <DataTable<AdminRecentOrder>
          columns={[
            { key: 'order_number', header: 'Order', render: (r) => `#${r.order_number}` },
            {
              key: 'status',
              header: 'Status',
              render: (r) => <span className="capitalize">{r.status.replace(/_/g, ' ')}</span>,
            },
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
          emptyMessage="No orders"
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

export default function AdminOrdersPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-12">
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      }
    >
      <AdminOrdersContent />
    </Suspense>
  );
}
