'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getAdminOrderDetails, updateAdminOrderStatus, updateAdminOrderPaymentStatus, downloadAdminOrderInvoice } from '@/lib/api/admin';
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
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [updatingPaymentStatus, setUpdatingPaymentStatus] = useState(false);
  const [downloadingInvoice, setDownloadingInvoice] = useState(false);

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

  const handleStatusChange = async (status: 'pending' | 'placed' | 'delivered' | 'complete' | 'completed' | 'cancelled' | 'refunded' | 'processing') => {
    if (!orderId || !order) return;
    setUpdatingStatus(true);
    try {
      await updateAdminOrderStatus(orderId, status);
      const updated = await getAdminOrderDetails(orderId);
      setOrder(updated);
      toast.success('Order status updated');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update order status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handlePaymentStatusChange = async (paymentStatus: 'paid' | 'unpaid') => {
    if (!orderId || !order) return;
    setUpdatingPaymentStatus(true);
    try {
      await updateAdminOrderPaymentStatus(orderId, paymentStatus);
      const updated = await getAdminOrderDetails(orderId);
      setOrder(updated);
      toast.success(`Payment status updated to ${paymentStatus}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update payment status');
    } finally {
      setUpdatingPaymentStatus(false);
    }
  };

  const handleInvoiceDownload = async () => {
    if (!orderId) return;
    setDownloadingInvoice(true);
    try {
      await downloadAdminOrderInvoice(orderId);
      toast.success('Invoice downloaded');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not download invoice');
    } finally {
      setDownloadingInvoice(false);
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

  const currentPaymentStatus = order.payment_status || (order.payment?.status === 'completed' || order.payment?.status === 'paid' ? 'paid' : 'unpaid');

  return (
    <div className="space-y-6">
      <AdminPageHeader title={`Order #${order.order_number}`}>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleInvoiceDownload} isLoading={downloadingInvoice}>
            <svg className="mr-1.5 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Download Invoice
          </Button>
          <Link href="/admin/orders">
            <Button variant="outline">Back to orders</Button>
          </Link>
        </div>
      </AdminPageHeader>

      <div className="flex flex-wrap items-center gap-4 rounded-xl border bg-card p-4 shadow-sm">
        {/* Order Status Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-muted-foreground">Order Status:</span>
          <select
            value={order.status === 'complete' ? 'completed' : order.status}
            onChange={(event) => {
              const next = event.target.value as 'pending' | 'placed' | 'delivered' | 'complete' | 'completed' | 'cancelled' | 'refunded' | 'processing';
              if (next) handleStatusChange(next);
            }}
            disabled={updatingStatus}
            className="h-9 rounded-md border border-input bg-background px-3 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 capitalize"
          >
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="refunded">Refunded</option>
          </select>
        </div>

        {/* Payment Status Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-muted-foreground">Payment Status:</span>
          <select
            value={currentPaymentStatus}
            onChange={(event) => {
              const next = event.target.value as 'paid' | 'unpaid';
              if (next) handlePaymentStatusChange(next);
            }}
            disabled={updatingPaymentStatus}
            className={`h-9 rounded-md border border-input bg-background px-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 capitalize ${
              currentPaymentStatus === 'paid'
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-amber-600 dark:text-amber-400'
            }`}
          >
            <option value="unpaid">Unpaid</option>
            <option value="paid">Paid (Add to Revenue)</option>
          </select>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border bg-card shadow-sm">
          <div className="border-b px-4 py-3">
            <h3 className="font-semibold text-sm">Order Items</h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Items included in this order with SKUs and variation details
            </p>
          </div>
          <ul className="divide-y divide-border/60">
            {order.items.map((item) => (
              <li key={item.id} className="flex justify-between p-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-foreground text-sm">{item.product_name}</p>
                    {item.sku ? (
                      <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground uppercase">
                        SKU: {item.sku}
                      </span>
                    ) : null}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatCurrency(item.unit_price, order.currency)} × {item.quantity}
                  </p>
                  {item.purchase_selections_summary?.length ? (
                    <div className="mt-2 space-y-1 rounded-md bg-muted/40 p-2 text-xs">
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
                        Variation Details:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {item.purchase_selections_summary.map((row) => (
                          <span
                            key={`${item.id}-${row.label}`}
                            className="inline-flex items-center rounded border border-border/80 bg-background px-2 py-0.5 text-[11px]"
                          >
                            <span className="font-medium text-muted-foreground mr-1">{row.label}:</span> {row.value}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
                <span className="font-semibold text-foreground tabular-nums text-sm">
                  {formatCurrency(item.total_price, order.currency)}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border bg-card p-4 shadow-sm">
            <h3 className="font-semibold text-sm mb-3">Customer Information</h3>
            <dl className="space-y-2.5 text-xs">
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Name</dt>
                <dd className="text-right font-medium">{order.customer_name?.trim() || '—'}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Email</dt>
                <dd className="text-right break-all font-medium">{order.customer_email || '—'}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Mobile</dt>
                <dd className="text-right font-medium">{order.shipping_mobile?.trim() || order.customer_mobile?.trim() || '—'}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground mb-1">Full Shipping Address</dt>
                <dd className="whitespace-pre-wrap rounded-md bg-muted/30 p-2 text-foreground/90 font-medium leading-relaxed">
                  {[
                    order.shipping_address?.trim(),
                    order.shipping_address_line2?.trim(),
                    order.shipping_postal_code?.trim(),
                  ]
                    .filter(Boolean)
                    .join('\n') ||
                    order.customer_address?.trim() ||
                    '—'}
                </dd>
              </div>
              {order.shipping_method_title ? (
                <div className="flex justify-between gap-4 pt-1">
                  <dt className="text-muted-foreground">Shipping Method</dt>
                  <dd className="text-right font-medium">
                    {order.shipping_method_title}
                    {order.shipping_fee > 0 ? ` (+${formatCurrency(order.shipping_fee, order.currency)})` : ' (Free)'}
                  </dd>
                </div>
              ) : null}
            </dl>
          </div>

          <div className="rounded-xl border bg-card p-4 shadow-sm">
            <h3 className="font-semibold text-sm mb-3">Order Summary</h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium tabular-nums">{formatCurrency(order.subtotal, order.currency)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                  <span>
                    Discount {order.coupon_code || order.coupon_name ? `(Coupon: ${order.coupon_code || order.coupon_name})` : ''}
                  </span>
                  <span className="font-semibold tabular-nums">−{formatCurrency(order.discount, order.currency)}</span>
                </div>
              )}
              {order.shipping_fee > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping Fee</span>
                  <span className="font-medium tabular-nums">{formatCurrency(order.shipping_fee, order.currency)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-border pt-2 text-sm font-bold">
                <span>Total Amount</span>
                <span className="tabular-nums text-primary">{formatCurrency(order.total, order.currency)}</span>
              </div>
            </div>
          </div>

          {order.payment && (
            <div className="rounded-xl border bg-card p-4 shadow-sm">
              <h3 className="font-semibold text-sm mb-2">Payment Details</h3>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Method / Status:</span>
                <span className="font-medium capitalize">
                  {order.payment.gateway.replace(/_/g, ' ')} · <span className="text-primary font-semibold">{order.payment.status}</span>
                </span>
              </div>
            </div>
          )}

          {order.delivery && (
            <div className="rounded-xl border bg-card p-4 shadow-sm">
              <h3 className="font-semibold text-sm mb-2">Delivery Status</h3>
              <p className="text-xs text-muted-foreground">
                <span className="font-medium capitalize text-foreground">{order.delivery.status}</span>
                {order.delivery.delivered_at && ` · ${new Date(order.delivery.delivered_at).toLocaleString()}`}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
