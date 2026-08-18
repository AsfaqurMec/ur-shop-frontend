'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { deleteOrder, getAdminRecentOrders, updateAdminOrderStatus } from '@/lib/api/admin';
import { AdminPageHeader, DataTable, Modal } from '@/components/admin';
import { Alert, AlertDescription, Button, Pagination } from '@/components/ui';
import { formatCurrency } from '@/lib/utils/format';
import type { AdminRecentOrder } from '@/lib/api/admin';
import { toast } from 'sonner';

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
  const [deleteTarget, setDeleteTarget] = useState<AdminRecentOrder | null>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);
  const [updatingStatusId, setUpdatingStatusId] = useState<number | null>(null);

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
  }, [pageFromUrl, refreshToken]);

  const setPage = (p: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (p <= 1) params.delete('page');
    else params.set('page', String(p));
    const q = params.toString();
    router.push(q ? `${pathname}?${q}` : pathname);
  };

  const closeDeleteModal = () => {
    setDeleteTarget(null);
    setDeleteError(null);
  };

  const confirmDeleteOrder = async () => {
    if (!deleteTarget) return;
    setDeleteSubmitting(true);
    setDeleteError(null);
    try {
      await deleteOrder(deleteTarget.id);
      closeDeleteModal();
      setRefreshToken((value) => value + 1);
      toast.success('Order deleted');
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete order');
    } finally {
      setDeleteSubmitting(false);
    }
  };

  const updateStatus = async (id: number, status: Parameters<typeof updateAdminOrderStatus>[1]) => {
    setUpdatingStatusId(id);
    try {
      await updateAdminOrderStatus(id, status);
      setRefreshToken((value) => value + 1);
      toast.success('Order status updated');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update status');
    } finally {
      setUpdatingStatusId(null);
    }
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
            { key: 'status', header: 'Status', render: (r) => <select value={r.status} disabled={updatingStatusId === r.id} onChange={(event) => void updateStatus(r.id, event.target.value as Parameters<typeof updateAdminOrderStatus>[1])} className="h-9 rounded-md border border-input bg-background px-2 text-sm capitalize"><option value="pending">Pending</option><option value="placed">Placed</option><option value="delivered">Delivered</option><option value="complete">Complete</option><option value="cancelled">Cancelled</option><option value="refunded">Refunded</option><option value="processing">Processing</option><option value="paid">Paid</option><option value="unpaid">Unpaid</option></select> },
            { key: 'total', header: 'Total', render: (r) => formatCurrency(r.total, r.currency) },
            {
              key: 'customer_name',
              header: 'Customer',
              render: (r) => (r.customer_name?.trim() ? r.customer_name : '—'),
            },
            {
              key: 'shipping_mobile',
              header: 'Mobile',
              render: (r) => (r.shipping_mobile?.trim() ? r.shipping_mobile : '—'),
            },
            { key: 'user_id', header: 'User ID' },
            { key: 'created_at', header: 'Date', render: (r) => new Date(r.created_at).toLocaleString() },
            {
              key: 'actions',
              header: '',
              render: (r) => (
                <div className="flex flex-wrap items-center justify-end gap-3">
                  <Link href={`/admin/orders/${r.id}`} className="rounded-md border-2 px-3 py-2 text-primary hover:underline">
                    View
                  </Link>
                  <Button size="sm" variant="destructive" type="button" onClick={() => setDeleteTarget(r)}>
                    Delete
                  </Button>
                </div>
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
      <Modal open={deleteTarget != null} onClose={closeDeleteModal} title="Delete Order">
        <div className="space-y-4">
          <p className="text-lg text-muted-foreground">
            Delete <span className="pr-3 font-semibold text-foreground">#{deleteTarget?.id}?</span> The order will be deleted permanently.
          </p>
          {deleteError ? <Alert variant="destructive"><AlertDescription>{deleteError}</AlertDescription></Alert> : null}
          <div className="flex flex-wrap gap-3 pt-1">
            <Button type="button" variant="outline" onClick={closeDeleteModal} disabled={deleteSubmitting}>Cancel</Button>
            <Button type="button" variant="destructive" onClick={confirmDeleteOrder} isLoading={deleteSubmitting}>Delete Order</Button>
          </div>
        </div>
      </Modal>
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
