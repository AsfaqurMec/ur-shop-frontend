'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { getAdminReviewsList, getCategories, setReviewHidden } from '@/lib/api/admin';
import type { CategoryItem } from '@/lib/api/admin';
import { AdminPageHeader } from '@/components/admin/PageHeader';
import { DataTable } from '@/components/admin/DataTable';
import { Button, Pagination } from '@/components/ui';
import type { ProductReviewAdminTableRow } from '@/types/review';
import { toast } from 'sonner';

const PAGE_SIZE = 10;

function parseCategoryId(searchParams: URLSearchParams): number | undefined {
  const raw = searchParams.get('category_id');
  if (raw === null || raw === '') return undefined;
  const n = Number(raw);
  return Number.isInteger(n) && n >= 0 ? n : undefined;
}

function AdminReviewsContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const pageFromUrl = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
  const categoryId = parseCategoryId(searchParams);

  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [reviews, setReviews] = useState<ProductReviewAdminTableRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  useEffect(() => {
    getCategories()
      .then((r) => setCategories(r.categories))
      .catch(() => setCategories([]));
  }, []);

  const fetchPage = useCallback(async () => {
    const offset = (pageFromUrl - 1) * PAGE_SIZE;
    return getAdminReviewsList({
      limit: PAGE_SIZE,
      offset,
      ...(categoryId !== undefined ? { category_id: categoryId } : {}),
    });
  }, [pageFromUrl, categoryId]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchPage()
      .then((r) => {
        if (cancelled) return;
        setReviews(r.reviews);
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
  }, [fetchPage, pageFromUrl, pathname, router, searchParams]);

  const setPage = (p: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (p <= 1) params.delete('page');
    else params.set('page', String(p));
    const q = params.toString();
    router.push(q ? `${pathname}?${q}` : pathname);
  };

  const setCategoryFilter = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('page');
    if (value === 'all') params.delete('category_id');
    else params.set('category_id', value);
    const q = params.toString();
    router.push(q ? `${pathname}?${q}` : pathname);
  };

  const toggleHidden = async (row: ProductReviewAdminTableRow) => {
    setBusyId(row.id);
    setError(null);
    try {
      await setReviewHidden(row.id, !row.is_hidden);
      const r = await fetchPage();
      setReviews(r.reviews);
      setTotal(r.total);
      toast.success(row.is_hidden ? 'Review is visible again' : 'Review hidden');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Update failed';
      setError(msg);
      toast.error(msg);
    } finally {
      setBusyId(null);
    }
  };

  const categorySelectValue =
    categoryId === undefined ? 'all' : String(categoryId);

  const truncate = (text: string | null, max: number) => {
    if (!text) return '—';
    const t = text.trim();
    if (t.length <= max) return t;
    return `${t.slice(0, max)}…`;
  };

  return (
    <div>
      <AdminPageHeader
        title="Reviews"
        description="Customer reviews publish immediately. Hide inappropriate reviews here. Filter by product category."
      />

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor="reviews-category" className="mb-1 block text-sm font-medium">
            Category
          </label>
          <select
            id="reviews-category"
            value={categorySelectValue}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="flex h-10 min-w-[200px] rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="all">All categories</option>
            <option value="0">Uncategorized</option>
            {categories.map((c) => (
              <option key={c.id} value={String(c.id)}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <>
          <DataTable<ProductReviewAdminTableRow>
            striped
            keyExtractor={(row) => row.id}
            emptyMessage="No reviews match this filter."
            data={reviews}
            columns={[
              {
                key: 'product',
                header: 'Product',
                render: (row) => (
                  <Link
                    href={`/products/${row.product_slug}`}
                    className="font-medium text-primary underline-offset-4 hover:underline"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {row.product_name}
                  </Link>
                ),
              },
              {
                key: 'category',
                header: 'Category',
                render: (row) => row.category_name ?? <span className="text-muted-foreground">Uncategorized</span>,
              },
              {
                key: 'rating',
                header: 'Rating',
                className: 'whitespace-nowrap tabular-nums',
                render: (row) => `${row.rating}/5`,
              },
              {
                key: 'excerpt',
                header: 'Review',
                render: (row) => (
                  <span title={row.body ?? row.title ?? ''}>
                    {truncate(row.title ?? row.body, 80)}
                  </span>
                ),
              },
              {
                key: 'flags',
                header: 'Flags',
                render: (row) => (
                  <span className="flex flex-wrap gap-1">
                    {row.is_hidden && (
                      <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase">Hidden</span>
                    )}
                    {row.is_verified_purchase && (
                      <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                        Verified
                      </span>
                    )}
                  </span>
                ),
              },
              {
                key: 'date',
                header: 'Date',
                className: 'whitespace-nowrap text-muted-foreground',
                render: (row) =>
                  new Date(row.created_at).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  }),
              },
              {
                key: 'actions',
                header: '',
                className: 'whitespace-nowrap',
                render: (row) => (
                  <Button
                    type="button"
                    variant={row.is_hidden ? 'primary' : 'outline'}
                    size="sm"
                    disabled={busyId === row.id}
                    isLoading={busyId === row.id}
                    onClick={() => void toggleHidden(row)}
                  >
                    {row.is_hidden ? 'Show' : 'Hide'}
                  </Button>
                ),
              },
            ]}
          />
          <Pagination
            className="mt-6"
            page={pageFromUrl}
            pageSize={PAGE_SIZE}
            totalItems={total}
            onPageChange={setPage}
            ariaLabel="Reviews pagination"
          />
        </>
      )}
    </div>
  );
}

export default function AdminReviewsPage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Loading…</p>}>
      <AdminReviewsContent />
    </Suspense>
  );
}
