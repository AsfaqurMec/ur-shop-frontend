'use client';

import { Suspense, useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { getProducts, deleteProduct, getCategories } from '@/lib/api/admin';
import { AdminPageHeader } from '@/components/admin/PageHeader';
import { DataTable } from '@/components/admin/DataTable';
import { Modal } from '@/components/admin/Modal';
import { Button, Pagination } from '@/components/ui';
import { IconEye, IconPencil, IconTrash } from '@/components/admin/admin-icons';
import { formatCurrency } from '@/lib/utils/format';
import { toast } from 'sonner';
import type { ProductListResult } from '@/lib/api/admin';

type ProductRow = ProductListResult['products'][0];

const PAGE_SIZE = 10;

function AdminProductsContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const pageFromUrl = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
  const searchFromUrl = searchParams.get('search') || '';
  const categoryFromUrl = searchParams.get('category_id') || '';

  const [result, setResult] = useState<ProductListResult | null>(null);
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [searchInput, setSearchInput] = useState(searchFromUrl);
  const [selectedCategory, setSelectedCategory] = useState(categoryFromUrl);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<ProductRow | null>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    getCategories()
      .then((r) => setCategories(r.categories.map((c) => ({ id: c.id, name: c.name }))))
      .catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getProducts({
      page: pageFromUrl,
      limit: PAGE_SIZE,
      search: searchFromUrl || undefined,
      category_id: categoryFromUrl ? parseInt(categoryFromUrl, 10) : undefined,
    })
      .then((r) => {
        if (cancelled) return;
        setResult(r);
        if (r.total > 0 && pageFromUrl > r.totalPages) {
          const p = new URLSearchParams(searchParams.toString());
          if (r.totalPages <= 1) p.delete('page');
          else p.set('page', String(r.totalPages));
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
  }, [pageFromUrl, searchFromUrl, categoryFromUrl, pathname, router, searchParams, refreshToken]);

  const bumpRefresh = () => setRefreshToken((t) => t + 1);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const p = new URLSearchParams(searchParams.toString());
    p.delete('page');
    if (searchInput.trim()) p.set('search', searchInput.trim());
    else p.delete('search');
    const q = p.toString();
    router.push(q ? `${pathname}?${q}` : pathname);
  };

  const handleCategoryFilter = (catId: string) => {
    setSelectedCategory(catId);
    const p = new URLSearchParams(searchParams.toString());
    p.delete('page');
    if (catId) p.set('category_id', catId);
    else p.delete('category_id');
    const q = p.toString();
    router.push(q ? `${pathname}?${q}` : pathname);
  };

  const handleClearFilters = () => {
    setSearchInput('');
    setSelectedCategory('');
    router.push(pathname);
  };

  const closeDeleteModal = () => {
    setDeleteTarget(null);
    setDeleteError(null);
  };

  const confirmDeleteProduct = async () => {
    if (!deleteTarget) return;
    setDeleteError(null);
    setDeleteSubmitting(true);
    try {
      await deleteProduct(deleteTarget.id);
      closeDeleteModal();
      bumpRefresh();
      toast.success('Product deleted');
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete');
    } finally {
      setDeleteSubmitting(false);
    }
  };

  const setPage = (p: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (p <= 1) params.delete('page');
    else params.set('page', String(p));
    const q = params.toString();
    router.push(q ? `${pathname}?${q}` : pathname);
  };

  const hasFilters = Boolean(searchFromUrl || categoryFromUrl);

  return (
    <div className="space-y-4">
      <AdminPageHeader title="Products" description="Manage your store products, variations, and stock levels.">
        <Link href="/admin/products/new">
          <Button>Add product</Button>
        </Link>
      </AdminPageHeader>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 rounded-xl border border-border/60 bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <form onSubmit={handleSearchSubmit} className="flex flex-1 items-center gap-2 max-w-md">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search by name or SKU..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="h-9 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <svg
              className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <Button type="submit" size="sm" variant="outline">
            Search
          </Button>
        </form>

        <div className="flex items-center gap-3">
          <select
            value={selectedCategory}
            onChange={(e) => handleCategoryFilter(e.target.value)}
            className="h-9 rounded-lg border border-input bg-background px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {hasFilters && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="text-xs text-muted-foreground hover:text-destructive hover:underline"
            >
              Reset filters
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive text-sm">
          {error}
        </div>
      )}

      <div className={loading ? 'pointer-events-none opacity-60' : ''}>
        <DataTable<ProductRow>
          columns={[
            {
              key: 'thumbnail',
              header: 'Image',
              className: 'w-16',
              render: (r) => (
                <div className="relative h-10 w-10 overflow-hidden rounded-lg border border-border/60 bg-muted/20">
                  {r.thumbnail ? (
                    <Image src={r.thumbnail} alt={r.name} fill className="object-cover" unoptimized />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[9px] text-muted-foreground">
                      No img
                    </div>
                  )}
                </div>
              ),
            },
            {
              key: 'name',
              header: 'Product Name',
              render: (r) => (
                <Link
                  href={`/admin/products/${r.id}/edit`}
                  className="font-medium text-foreground hover:text-primary transition-colors line-clamp-2"
                >
                  {r.name}
                </Link>
              ),
            },
            {
              key: 'sku',
              header: 'SKU',
              render: (r) => (
                <span className="font-mono text-xs text-muted-foreground uppercase">
                  {r.sku || '—'}
                </span>
              ),
            },
            {
              key: 'category_name',
              header: 'Category',
              render: (r) => (
                <span className="text-xs text-muted-foreground">
                  {r.category_name || 'Uncategorized'}
                </span>
              ),
            },
            {
              key: 'stock',
              header: 'Stock',
              render: (r) => {
                const variations = r.catalog_variations;
                if (variations && variations.length > 0) {
                  return (
                    <div className="space-y-1 py-1 max-w-xs">
                      {variations.map((v) => {
                        const variantLabel = Object.values(v.combination || {}).join(' / ') || `Var #${v.id}`;
                        const isOut = v.quantity != null && v.quantity <= 0;
                        return (
                          <div key={v.id} className="text-[11px] leading-tight">
                            <span className="text-muted-foreground">{variantLabel}: </span>
                            {isOut ? (
                              <span className="font-semibold text-destructive">0 (Out of stock)</span>
                            ) : v.quantity == null ? (
                              <span className="text-muted-foreground">Unlimited</span>
                            ) : (
                              <span className="font-medium text-foreground">{v.quantity} pcs</span>
                            )}
                            {v.sku ? <span className="text-[10px] text-muted-foreground/70 ml-1">({v.sku})</span> : null}
                          </div>
                        );
                      })}
                    </div>
                  );
                }

                if (r.quantity == null) {
                  return <span className="text-xs text-muted-foreground">Unlimited</span>;
                }
                if (r.quantity <= 0) {
                  return <span className="text-xs font-semibold text-destructive">0 (Out of stock)</span>;
                }
                return <span className="text-xs font-medium text-foreground">{r.quantity} pcs</span>;
              },
            },
            { key: 'price', header: 'Price', render: (r) => formatCurrency(r.price) },
            {
              key: 'is_active',
              header: 'Status',
              render: (r) => (
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${
                    r.is_active
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {r.is_active ? 'Active' : 'Draft'}
                </span>
              ),
            },
            {
              key: 'actions',
              header: '',
              className: 'w-[120px]',
              render: (r) => (
                <div className="flex items-center justify-end gap-1.5">
                  <Link
                    href={`/products/${r.slug}`}
                    target="_blank"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-black text-white hover:bg-neutral-800 transition-colors shadow-sm dark:bg-white dark:text-black dark:hover:bg-neutral-200"
                    title="View Product Page"
                    aria-label="View Product Page"
                  >
                    <IconEye className="h-4 w-4" />
                  </Link>
                  <Link
                    href={`/admin/products/${r.id}/edit`}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-input bg-background text-foreground hover:bg-muted transition-colors shadow-sm"
                    title="Edit Product"
                    aria-label="Edit Product"
                  >
                    <IconPencil className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(r)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors shadow-sm"
                    title="Delete Product"
                    aria-label="Delete Product"
                  >
                    <IconTrash className="h-4 w-4" />
                  </button>
                </div>
              ),
            },
          ]}
          data={result?.products ?? []}
          keyExtractor={(r) => r.id}
          emptyMessage="No products found matching the criteria"
        />
      </div>
      <div className="mt-6">
        <Pagination
          page={pageFromUrl}
          pageSize={PAGE_SIZE}
          totalItems={result?.total ?? 0}
          onPageChange={setPage}
          disabled={loading}
        />
      </div>

      <Modal open={deleteTarget != null} onClose={closeDeleteModal} title="Delete product">
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Delete <span className="font-semibold text-foreground">{deleteTarget?.name}</span>? The product will be
            soft-deleted and hidden from the storefront. Existing orders are unchanged.
          </p>
          {deleteError && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-destructive text-sm">
              {deleteError}
            </div>
          )}
          <div className="flex flex-wrap gap-3 pt-1">
            <Button type="button" variant="outline" onClick={closeDeleteModal} disabled={deleteSubmitting}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={confirmDeleteProduct} isLoading={deleteSubmitting}>
              Delete product
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default function AdminProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-12">
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      }
    >
      <AdminProductsContent />
    </Suspense>
  );
}
