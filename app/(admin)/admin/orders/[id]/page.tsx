'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getAdminOrderDetails, processDelivery, updateAdminOrderStatus } from '@/lib/api/admin';
import type { DashboardOrderDetail } from '@/lib/api/dashboard';
import { AdminPageHeader } from '@/components/admin';
import { Button } from '@/components/ui';
import { formatCurrency } from '@/lib/utils/format';
import { toast } from 'sonner';

export default function AdminOrderDetailPage() {
  const params = useParams();
  const id = params?.id as string | undefined;
  const orderId = id ? Number(id) : NaN;

  const [order, setOrder] = useState<DashboardOrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    if (!orderId || Number.isNaN(orderId)) {
      setLoading(false);
      setError('Invalid order');
      return;
    }
    getAdminOrderDetails(orderId)
      .then(setOrder)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, [orderId]);

  const handleProcessDelivery = async () => {
    if (!orderId) return;
    setProcessing(true);
    try {
      await processDelivery(orderId);
      const o = await getAdminOrderDetails(orderId);
      setOrder(o);
      toast.success('Delivery processed');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to process delivery');
    } finally {
      setProcessing(false);
    }
  };

  const handleStatusChange = async (status: 'pending' | 'paid' | 'unpaid') => {
    if (!orderId || !order) return;
    setUpdatingStatus(true);
    try {
      await updateAdminOrderStatus(orderId, status);
      const updated = await getAdminOrderDetails(orderId);
      setOrder(updated);
      toast.success('Order status updated');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div>
        <AdminPageHeader title="Order" />
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">{error ?? 'Not found'}</div>
        <Link href="/admin/orders" className="mt-4 inline-block">
          <Button variant="outline">Back to orders</Button>
        </Link>
      </div>
    );
  }

  return (
    <div>
      <AdminPageHeader title={`Order #${order.order_number}`}>
        <Link href="/admin/orders">
          <Button variant="outline">Back to orders</Button>
        </Link>
      </AdminPageHeader>
      <div className="mb-4 flex flex-wrap gap-2">
        <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-sm font-medium capitalize">
          {order.status.replace(/_/g, ' ')}
        </span>
        <select
          value={['pending', 'paid', 'unpaid'].includes(order.status) ? order.status : ''}
          onChange={(event) => {
            const next = event.target.value as 'pending' | 'paid' | 'unpaid' | '';
            if (next) handleStatusChange(next);
          }}
          disabled={updatingStatus}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground"
        >
          <option value="" disabled>
            Change status
          </option>
          <option value="pending">Pending</option>
          <option value="paid">Paid</option>
          <option value="unpaid">Unpaid</option>
        </select>
        {order.status === 'paid' && (
          <Button size="sm" onClick={handleProcessDelivery} isLoading={processing}>
            Process delivery
          </Button>
        )}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border">
          <h3 className="border-b px-4 py-3 font-semibold">Items</h3>
          <p className="border-b px-4 py-2 text-xs text-muted-foreground">
            Variation choices and custom fields (text/email) appear under each product when present.
          </p>
          <ul className="divide-y">
            {order.items.map((item) => (
              <li key={item.id} className="flex justify-between px-4 py-3">
                <div>
                  <p className="font-medium">{item.product_name}</p>
                  <p className="text-muted-foreground text-sm">
                    {formatCurrency(item.unit_price, order.currency)} × {item.quantity}
                  </p>
                  {item.purchase_selections_summary?.length ? (
                    <ul className="mt-2 space-y-0.5 text-xs text-muted-foreground">
                      {item.purchase_selections_summary.map((row) => (
                        <li key={`${item.id}-${row.label}`}>
                          <span className="font-medium text-foreground/80">{row.label}:</span> {row.value}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
                <span className="tabular-nums">{formatCurrency(item.total_price, order.currency)}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="space-y-4">
          <div className="rounded-lg border p-4">
            <h3 className="font-semibold mb-3">Customer</h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Name</dt>
                <dd className="text-right font-medium">{order.customer_name?.trim() || '—'}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Email</dt>
                <dd className="text-right break-all">{order.customer_email || '—'}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Mobile</dt>
                <dd className="text-right">{order.shipping_mobile?.trim() || order.customer_mobile?.trim() || '—'}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground mb-1">Address</dt>
                <dd className="whitespace-pre-wrap text-foreground/90">
                  {order.shipping_address?.trim() || order.customer_address?.trim() || '—'}
                </dd>
              </div>
            </dl>
          </div>
          <div className="rounded-lg border p-4">
            <h3 className="font-semibold mb-3">Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="tabular-nums">{formatCurrency(order.subtotal, order.currency)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>−{formatCurrency(order.discount, order.currency)}</span>
                </div>
              )}
              <div className="flex justify-between border-t pt-2 font-medium">
                <span>Total</span>
                <span className="tabular-nums">{formatCurrency(order.total, order.currency)}</span>
              </div>
            </div>
          </div>
          {order.payment && (
            <div className="rounded-lg border p-4">
              <h3 className="font-semibold mb-2">Payment</h3>
              <p className="text-sm text-muted-foreground">{order.payment.gateway} · {order.payment.status}</p>
            </div>
          )}
          {order.delivery && (
            <div className="rounded-lg border p-4">
              <h3 className="font-semibold mb-2">Delivery</h3>
              <p className="text-sm text-muted-foreground">
                {order.delivery.status}
                {order.delivery.delivered_at && ` · ${new Date(order.delivery.delivered_at).toLocaleString()}`}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
