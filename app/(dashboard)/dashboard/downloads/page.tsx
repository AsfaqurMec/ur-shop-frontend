'use client';

import { useEffect, useMemo, useState } from 'react';
import { listDownloadables, createDownloadToken } from '@/lib/api/downloads';
import type { DownloadableItem } from '@/lib/api/dashboard';
import { PageHeader, EmptyState } from '@/components/dashboard';
import { Button } from '@/components/ui';

import { getApiBaseUrl } from '@/lib/api/baseUrl';
import { toast } from 'sonner';

const getBaseUrl = () => getApiBaseUrl().replace(/\/$/, '');

function groupKey(item: DownloadableItem) {
  return `${item.order_id}`;
}

export default function DashboardDownloadsPage() {
  const [items, setItems] = useState<DownloadableItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(() => new Set());

  const groups = useMemo(() => {
    const map = new Map<string, DownloadableItem[]>();
    for (const item of items) {
      const k = groupKey(item);
      const list = map.get(k) ?? [];
      list.push(item);
      map.set(k, list);
    }
    map.forEach((list) => {
      list.sort((a, b) => a.file_name.localeCompare(b.file_name));
    });
    return Array.from(map.entries()).sort(([, a], [, b]) => {
      const ta = Math.max(...a.map((i) => new Date(i.created_at).getTime()));
      const tb = Math.max(...b.map((i) => new Date(i.created_at).getTime()));
      return tb - ta;
    });
  }, [items]);

  const toggleGroup = (key: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const load = async () => {
    try {
      const res = await listDownloadables();
      setItems(res.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleDownload = async (entitlementId: number) => {
    setDownloadingId(entitlementId);
    try {
      const { url } = await createDownloadToken(entitlementId);
      const fullUrl = url.startsWith('http') ? url : `${getBaseUrl()}${url.startsWith('/') ? '' : '/'}${url}`;
      window.open(fullUrl, '_blank');
      toast.success('Download started');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Download failed');
    } finally {
      setDownloadingId(null);
    }
  };

  const formatBytes = (bytes: number | null) => {
    if (bytes == null) return '—';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="My downloads" description="Download your purchased files" />
      {error && (
        <div className="mb-4 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive text-sm">
          {error}
        </div>
      )}
      {items.length === 0 ? (
        <EmptyState
          title="No downloads"
          description="Downloadable files from your orders will appear here."
        />
      ) : (
        <div className="space-y-3">
          {groups.map(([key, groupItems]) => {
            const representative = groupItems[0];
            const open = expandedGroups.has(key);
            const fileLabel = groupItems.length === 1 ? '1 file' : `${groupItems.length} files`;
            const productTitles = Array.from(new Set(groupItems.map((item) => item.product_name)));
            const productLabel =
              productTitles.length === 1
                ? productTitles[0]
                : `${productTitles[0]} +${productTitles.length - 1} more`;

            return (
              <div key={key} className="overflow-hidden rounded-lg border">
                <button
                  type="button"
                  onClick={() => toggleGroup(key)}
                  aria-expanded={open}
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
                      className={`transition-transform ${open ? 'rotate-180' : ''}`}
                    >
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">Order #{representative.order_number}</p>
                    <p className="truncate text-muted-foreground text-sm">{productLabel}</p>
                    <p className="text-muted-foreground text-xs">{fileLabel}</p>
                  </div>
                </button>
                {open && (
                  <div className="space-y-0 border-t border-border/80 bg-muted/20">
                    {groupItems.map((item) => {
                      const limitReached =
                        item.download_limit != null && item.download_count >= item.download_limit;
                      const expired = item.expires_at && new Date(item.expires_at) <= new Date();
                      const canDownload = !limitReached && !expired;

                      return (
                        <div
                          key={item.entitlement_id}
                          className="flex flex-col gap-2 border-b border-border/60 p-4 last:border-b-0 sm:flex-row sm:items-center sm:justify-between sm:pl-14"
                        >
                          <div className="min-w-0">
                            <p className="font-medium">{item.file_name}</p>
                            <p className="text-muted-foreground text-xs">{item.product_name}</p>
                            <p className="text-muted-foreground text-xs">
                              {formatBytes(item.file_size)}
                              {item.download_limit != null &&
                                ` · ${item.download_count}/${item.download_limit} downloads`}
                              {expired && ' · Expired'}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            disabled={!canDownload || downloadingId === item.entitlement_id}
                            isLoading={downloadingId === item.entitlement_id}
                            onClick={() => handleDownload(item.entitlement_id)}
                          >
                            {limitReached ? 'Limit reached' : expired ? 'Expired' : 'Download'}
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
