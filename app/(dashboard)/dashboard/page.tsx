'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  getDashboardSummary,
  getMyOrders,
  getMyDeliveredItems,
} from '@/lib/api/dashboard';
import { PageHeader, StatCard, EmptyState } from '@/components/dashboard';
import { Button } from '@/components/ui';
import { StatusBadge } from '@/components/dashboard';
import { formatCurrency } from '@/lib/utils/format';

export default function DashboardHomePage() {
  const [summary, setSummary] = useState<Awaited<ReturnType<typeof getDashboardSummary>> | null>(null);
  const [orders, setOrders] = useState<Awaited<ReturnType<typeof getMyOrders>>['orders']>([]);
  const [delivered, setDelivered] = useState<Awaited<ReturnType<typeof getMyDeliveredItems>>['items']>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [summaryRes, ordersRes, deliveredRes] = await Promise.all([
          getDashboardSummary(),
          getMyOrders({ limit: 5 }),
          getMyDeliveredItems(),
        ]);
        if (!cancelled) {
          setSummary(summaryRes);
          setOrders(ordersRes.orders);
          setDelivered(deliveredRes.items.slice(0, 5));
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load dashboard');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
        {error}
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Overview of your orders and digital products"
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard
          title="Total orders"
          value={summary?.orders_total ?? 0}
          href="/dashboard/orders"
        />
        <StatCard
          title="Pending payment"
          value={summary?.orders_pending ?? 0}
          href="/dashboard/orders"
          description="Awaiting payment"
        />
        <StatCard
          title="Paid orders"
          value={summary?.orders_paid ?? 0}
          href="/dashboard/orders"
        />
        <StatCard
          title="Delivered items"
          value={summary?.delivered_count ?? 0}
          href="/dashboard/downloads"
          description="Downloads, licenses, subscriptions"
        />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Recent orders</h2>
            <Link href="/dashboard/orders">
              <Button variant="ghost" size="sm">View all</Button>
            </Link>
          </div>
          {orders.length === 0 ? (
            <EmptyState title="No orders yet" description="Your orders will appear here" />
          ) : (
            <div className="overflow-hidden rounded-xl border border-border/80 bg-card shadow-card">
              {orders.map((order) => (
                <Link
                  key={order.id}
                  href={`/dashboard/orders/${order.id}`}
                  className="flex items-center justify-between border-b border-border/60 p-4 transition-colors last:border-b-0 hover:bg-muted/40"
                >
                  <div>
                    <p className="font-medium">#{order.order_number}</p>
                    <p className="text-muted-foreground text-sm">
                      {formatCurrency(order.total, order.currency)}
                    </p>
                  </div>
                  <StatusBadge status={order.status} />
                </Link>
              ))}
            </div>
          )}
        </section>
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Recent deliveries</h2>
            <Link href="/dashboard/downloads">
              <Button variant="ghost" size="sm">View all</Button>
            </Link>
          </div>
          {delivered.length === 0 ? (
            <EmptyState title="No deliveries yet" description="Your downloads and licenses will appear here" />
          ) : (
            <div className="overflow-hidden rounded-xl border border-border/80 bg-card shadow-card">
              {delivered.map((item, i) => (
                <div
                  key={`${item.type}-${item.order_id}-${item.product_id}-${i}`}
                  className="flex items-center justify-between border-b border-border/60 p-4 last:border-b-0"
                >
                  <div>
                    <p className="font-medium">{item.product_name}</p>
                    <p className="text-muted-foreground text-sm capitalize">{item.type}</p>
                  </div>
                  <span className="text-muted-foreground text-xs">
                    Order #{item.order_number}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
