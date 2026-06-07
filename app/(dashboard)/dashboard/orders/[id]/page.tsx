'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getOrderDetails } from '@/lib/api/dashboard';
import { listPaymentMethods } from '@/lib/api/payments';
import { PageHeader, StatusBadge } from '@/components/dashboard';
import { Button } from '@/components/ui';
import { formatCurrency } from '@/lib/utils/format';

export default function OrderDetailPage() {
  const params = useParams();
  const id = params?.id as string | undefined;
  const orderId = id ? Number(id) : NaN;

  const [order, setOrder] = useState<Awaited<ReturnType<typeof getOrderDetails>> | null>(null);
  const [bankProofGatewayKeys, setBankProofGatewayKeys] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId || Number.isNaN(orderId)) {
      setLoading(false);
      setError('Invalid order');
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const [detail, methods] = await Promise.all([getOrderDetails(orderId), listPaymentMethods()]);
        if (!cancelled) {
          setOrder(detail);
          setBankProofGatewayKeys(
            new Set(methods.filter((m) => m.manual_flow === 'bank_proof').map((m) => m.gateway))
          );
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [orderId]);

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
        <PageHeader title="Order" />
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
          {error ?? 'Order not found'}
        </div>
        <Link href="/dashboard/orders" className="mt-4 inline-block">
          <Button variant="outline">Back to orders</Button>
        </Link>
      </div>
    );
  }

  const isPending = order.status === 'pending';

  return (
    <div>
      <PageHeader title={`Order #${order.order_number}`}>
        <Link href="/dashboard/orders">
          <Button variant="outline">Back to orders</Button>
        </Link>
      </PageHeader>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-4">
          <StatusBadge status={order.status} />
          <span className="text-muted-foreground text-sm">
            Placed on {new Date(order.created_at).toLocaleString()}
          </span>
          {isPending &&
            order.payment?.gateway &&
            bankProofGatewayKeys.has(order.payment.gateway) && (
            <Link href={`/orders/${order.id}/pay`}>
              <Button size="sm">Submit payment</Button>
            </Link>
          )}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-lg border">
            <h3 className="border-b px-4 py-3 font-semibold">Items</h3>
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
              <h3 className="font-semibold mb-3">Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="tabular-nums">{formatCurrency(order.subtotal, order.currency)}</span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between text-green-600 dark:text-green-400">
                    <span>Discount</span>
                    <span className="tabular-nums">−{formatCurrency(order.discount, order.currency)}</span>
                  </div>
                )}
                {order.tax > 0 && (
                  <div className="flex justify-between">
                    <span>Tax</span>
                    <span className="tabular-nums">{formatCurrency(order.tax, order.currency)}</span>
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
                <p className="text-muted-foreground text-sm">
                  {order.payment.gateway} · {order.payment.status}
                </p>
              </div>
            )}
            {order.delivery && (
              <div className="rounded-lg border p-4">
                <h3 className="font-semibold mb-2">Delivery</h3>
                <p className="text-muted-foreground text-sm">
                  Status: {order.delivery.status}
                  {order.delivery.delivered_at && (
                    <> · Delivered {new Date(order.delivery.delivered_at).toLocaleString()}</>
                  )}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
