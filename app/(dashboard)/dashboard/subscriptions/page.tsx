'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getMyPendingSubscriptions, getMySubscriptions } from '@/lib/api/dashboard';
import type { DashboardPendingSubscriptionItem, DashboardSubscriptionItem } from '@/lib/api/dashboard';
import { PageHeader, EmptyState, StatusBadge } from '@/components/dashboard';
import { Button } from '@/components/ui';

function renewProductHref(item: DashboardSubscriptionItem): string {
  const q = new URLSearchParams({ renew: '1' });
  if (item.product_variation_id != null && item.product_variation_id >= 1) {
    q.set('variationId', String(item.product_variation_id));
  }
  return `/products/${item.product_slug}?${q.toString()}`;
}

function daysUntil(isoEnd: string): number {
  const end = new Date(isoEnd).getTime();
  if (Number.isNaN(end)) return NaN;
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const endDay = new Date(end);
  endDay.setHours(0, 0, 0, 0);
  return Math.round((endDay.getTime() - startOfToday.getTime()) / (24 * 60 * 60 * 1000));
}

export default function DashboardSubscriptionsPage() {
  const [items, setItems] = useState<DashboardSubscriptionItem[]>([]);
  const [pendingItems, setPendingItems] = useState<DashboardPendingSubscriptionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getMySubscriptions(), getMyPendingSubscriptions()])
      .then(([subscriptions, pending]) => {
        setItems(subscriptions.items);
        setPendingItems(pending.items);
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

  return (
    <div>
      <PageHeader
        title="My subscriptions"
        description="Renew before your period ends to avoid losing access."
      />
      {error && (
        <div className="mb-4 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive text-sm">
          {error}
        </div>
      )}
      {pendingItems.length > 0 && (
        <div className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
          <p className="text-sm font-medium">Pending activation</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Payment is approved. These subscriptions are waiting for manual activation by the team.
          </p>
          <div className="mt-3 space-y-2">
            {pendingItems.map((item) => (
              <div key={item.queue_id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <span>{item.product_name}</span>
                <div className="flex items-center gap-2">
                  <StatusBadge status={item.status} />
                  <Link href={`/dashboard/orders/${item.order_id}`}>
                    <Button size="sm" variant="outline">View order</Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {items.length === 0 && pendingItems.length === 0 ? (
        <EmptyState
          title="No subscriptions"
          description="Subscriptions from your orders will appear here."
        />
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const dLeft = daysUntil(item.current_period_end);
            const showRenewSoon =
              item.status === 'active' && Number.isFinite(dLeft) && dLeft >= 0 && dLeft <= 7;
            return (
              <div
                key={item.id}
                className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="font-medium">{item.product_name}</p>
                  <p className="text-muted-foreground text-sm">
                    {new Date(item.current_period_start).toLocaleDateString()} –{' '}
                    {new Date(item.current_period_end).toLocaleDateString()}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <StatusBadge status={item.status} />
                    {showRenewSoon ? (
                      <span className="text-xs text-amber-700 dark:text-amber-300">
                        {dLeft === 0
                          ? 'Ends today'
                          : dLeft === 1
                            ? 'Ends tomorrow'
                            : `${dLeft} days left`}
                      </span>
                    ) : null}
                  </div>
                </div>
                <div className="flex flex-shrink-0 flex-wrap gap-2">
                  <Link href={renewProductHref(item)}>
                    <Button size="sm">Renew</Button>
                  </Link>
                  <Link href={`/dashboard/orders/${item.order_id}`}>
                    <Button variant="outline" size="sm">
                      View order
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
