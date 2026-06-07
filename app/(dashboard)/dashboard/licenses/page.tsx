'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { getMyLicenses } from '@/lib/api/dashboard';
import { PageHeader, EmptyState } from '@/components/dashboard';
import { Button } from '@/components/ui';
import { toast } from 'sonner';

async function copyLicenseKey(licenseKey: string) {
  try {
    await navigator.clipboard.writeText(licenseKey);
    toast.success('License key copied');
  } catch (err) {
    toast.error(err instanceof Error ? err.message : 'Could not copy license key');
  }
}

export default function DashboardLicensesPage() {
  const [items, setItems] = useState<Awaited<ReturnType<typeof getMyLicenses>>['items']>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<number>>(() => new Set());
  const groupedByOrder = useMemo(() => {
    const byOrder = new Map<number, typeof items>();
    for (const item of items) {
      const existing = byOrder.get(item.order_id);
      if (existing) {
        existing.push(item);
      } else {
        byOrder.set(item.order_id, [item]);
      }
    }

    return Array.from(byOrder.entries())
      .map(([orderId, orderItems]) => ({
        orderId,
        items: orderItems.sort(
          (a, b) => new Date(b.assigned_at).getTime() - new Date(a.assigned_at).getTime(),
        ),
      }))
      .sort((a, b) => {
        const aLatest = a.items[0]?.assigned_at ?? '';
        const bLatest = b.items[0]?.assigned_at ?? '';
        return new Date(bLatest).getTime() - new Date(aLatest).getTime();
      });
  }, [items]);
  const groupedByOrderAndProduct = useMemo(
    () =>
      groupedByOrder.map((group) => {
        const byProduct = new Map<string, typeof group.items>();
        for (const item of group.items) {
          const existing = byProduct.get(item.product_name);
          if (existing) existing.push(item);
          else byProduct.set(item.product_name, [item]);
        }
        return {
          ...group,
          products: Array.from(byProduct.entries()).map(([productName, productItems]) => ({
            productName,
            items: productItems,
          })),
        };
      }),
    [groupedByOrder],
  );
  const toggleGroup = (orderId: number) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(orderId)) next.delete(orderId);
      else next.add(orderId);
      return next;
    });
  };

  useEffect(() => {
    getMyLicenses()
      .then((r) => setItems(r.items))
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
      <PageHeader title="My licenses" description="License keys for your purchased products" />
      {error && (
        <div className="mb-4 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive text-sm">
          {error}
        </div>
      )}
      {items.length === 0 ? (
        <EmptyState
          title="No licenses"
          description="License keys from your orders will appear here."
        />
      ) : (
        <div className="space-y-3">
          {groupedByOrderAndProduct.map((group) => (
            <div key={group.orderId} className="overflow-hidden rounded-lg border">
              <button
                type="button"
                onClick={() => toggleGroup(group.orderId)}
                aria-expanded={expandedGroups.has(group.orderId)}
                className="flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-muted/40"
              >
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border bg-muted/50 text-muted-foreground"
                  aria-hidden
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={`transition-transform ${expandedGroups.has(group.orderId) ? 'rotate-180' : ''}`}
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium">Order #{group.orderId}</p>
                  <p className="truncate text-muted-foreground text-sm">
                    {group.products[0]?.productName}
                    {group.products.length > 1 ? ` +${group.products.length - 1} more` : ''}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {group.items.length} key{group.items.length > 1 ? 's' : ''}
                  </p>
                </div>
              </button>
              {expandedGroups.has(group.orderId) && (
                <div className="space-y-0 border-t border-border/80 bg-muted/20 p-4 sm:pl-14">
                  {group.products.map((product) => (
                    <div key={product.productName} className="mb-3 last:mb-0">
                      <p className="text-muted-foreground text-sm">{product.productName}</p>
                      {product.items.map((item) => (
                        <div
                          key={item.id}
                          className="mt-2 flex flex-col gap-2 border-b border-border/40 pb-3 last:border-b-0 last:pb-0 sm:flex-row sm:items-start sm:justify-between sm:gap-3"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="break-all font-mono text-sm font-medium">{item.license_key}</p>
                            <p className="text-muted-foreground text-xs">
                              Assigned {new Date(item.assigned_at).toLocaleDateString()}
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="shrink-0 self-start"
                            onClick={() => copyLicenseKey(item.license_key)}
                            aria-label="Copy license key"
                          >
                            Copy
                          </Button>
                        </div>
                      ))}
                    </div>
                  ))}
                  <div className="mt-3">
                    <Link href={`/dashboard/orders/${group.orderId}`}>
                      <Button variant="outline" size="sm">View order</Button>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
