'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  getAdminSummary,
  getAdminSalesSummary,
  getAdminOrdersByStatus,
  getAdminRecentOrders,
  getAdminRecentPayments,
} from '@/lib/api/admin';
import { AdminPageHeader } from '@/components/admin';
import { Button } from '@/components/ui';
import { formatCurrency } from '@/lib/utils/format';

export default function AdminDashboardPage() {
  const [summary, setSummary] = useState<Awaited<ReturnType<typeof getAdminSummary>> | null>(null);
  const [sales, setSales] = useState<Awaited<ReturnType<typeof getAdminSalesSummary>> | null>(null);
  const [byStatus, setByStatus] = useState<Awaited<ReturnType<typeof getAdminOrdersByStatus>>>([]);
  const [recentOrders, setRecentOrders] = useState<Awaited<ReturnType<typeof getAdminRecentOrders>>['orders']>([]);
  const [recentPayments, setRecentPayments] = useState<Awaited<ReturnType<typeof getAdminRecentPayments>>['payments']>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      getAdminSummary(),
      getAdminSalesSummary(),
      getAdminOrdersByStatus(),
      getAdminRecentOrders({ limit: 10 }),
      getAdminRecentPayments(10),
    ])
      .then(([s, sa, status, ord, pay]) => {
        setSummary(s);
        setSales(sa);
        setByStatus(status);
        setRecentOrders(ord.orders);
        setRecentPayments(pay.payments);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load'))
      .finally(() => setLoading(false));
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
      <AdminPageHeader title="Admin Dashboard" description="Overview of your store" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 mb-8">
        <StatCard title="Total orders" value={summary?.orders_total ?? 0} href="/admin/orders" />
        <StatCard title="Paid orders" value={summary?.orders_paid ?? 0} href="/admin/orders" />
        <StatCard title="Revenue" value={formatCurrency(sales?.total_revenue ?? 0)} />
        <StatCard title="Customers" value={summary?.customers_count ?? 0} href="/admin/customers" />
        {/* <StatCard title="Pending fulfillment" value={summary?.pending_fulfillment_count ?? 0} href="/admin/fulfillment" />
        <StatCard title="Pending tickets" value={summary?.pending_tickets_count ?? 0} href="/admin/tickets" /> */}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Orders by status</h2>
          </div>
          <div className="overflow-hidden rounded-xl border border-border/80 bg-card shadow-card">
            {byStatus.map((s) => (
              <div key={s.status} className="flex justify-between border-b border-border/60 px-4 py-3 last:border-b-0">
                <span className="capitalize">{s.status.replace(/_/g, ' ')}</span>
                <span className="font-medium">{s.count}</span>
              </div>
            ))}
          </div>
        </section>
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Recent orders</h2>
            <Link href="/admin/orders">
              <Button variant="ghost" size="sm">View all</Button>
            </Link>
          </div>
          <div className="overflow-hidden rounded-xl border border-border/80 bg-card shadow-card">
            {recentOrders.slice(0, 5).map((o) => (
              <Link
                key={o.id}
                href={`/admin/orders/${o.id}`}
                className="flex justify-between border-b border-border/60 px-4 py-3 last:border-b-0 transition-colors hover:bg-muted/40"
              >
                <span>#{o.order_number}</span>
                <span className="text-muted-foreground">{formatCurrency(o.total, o.currency)}</span>
              </Link>
            ))}
          </div>
        </section>
      </div>
      <section className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recent payments</h2>
          <Link href="/admin/payment-reviews">
            <Button variant="ghost" size="sm">Payment reviews</Button>
          </Link>
        </div>
        <div className="overflow-hidden rounded-xl border border-border/80 bg-card shadow-card">
          {recentPayments.slice(0, 5).map((p) => (
            <div
              key={p.id}
              className="flex flex-col gap-1 border-b border-border/60 px-4 py-3 last:border-b-0 sm:flex-row sm:items-center sm:justify-between sm:gap-3"
            >
              <span className="min-w-0 font-medium">Order #{p.order_number}</span>
              <span className="min-w-0 shrink-0 text-sm text-muted-foreground sm:text-right">
                {formatCurrency(p.amount, p.currency)} · {p.status}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function StatCard({
  title,
  value,
  href,
}: {
  title: string;
  value: number | string;
  href?: string;
}) {
  const content = (
    <div className="rounded-xl border border-border/80 bg-card p-4 shadow-card transition hover:border-primary/15 hover:shadow-card-hover">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</p>
      <p className="mt-2 text-xl font-bold tabular-nums text-foreground">{value}</p>
    </div>
  );
  if (href) {
    return (
      <Link href={href} className="block rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
        {content}
      </Link>
    );
  }
  return content;
}
