'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { getProducts, deleteProduct } from '@/lib/api/admin';
import { AdminPageHeader } from '@/components/admin/PageHeader';
import { DataTable } from '@/components/admin/DataTable';
import { Modal } from '@/components/admin/Modal';
import { Button, Pagination } from '@/components/ui';
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

  const [result, setResult] = useState<ProductListResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<ProductRow | null>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getProducts({ page: pageFromUrl, limit: PAGE_SIZE })
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
  }, [pageFromUrl, pathname, router, searchParams, refreshToken]);

  const bumpRefresh = () => setRefreshToken((t) => t + 1);

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

  if (loading && !result) {
    return (
      <div className="flex justify-center py-12">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div>
      <AdminPageHeader title="Products" description="Manage products">
        <Link href="/admin/products/new">
          <Button>Add product</Button>
        </Link>
      </AdminPageHeader>
      {error && (
        <div className="mb-4 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive text-sm">
          {error}
        </div>
      )}
      <div className={loading ? 'pointer-events-none opacity-60' : ''}>
        <DataTable<ProductRow>
          columns={[
            { key: 'name', header: 'Name' },
            { key: 'slug', header: 'Slug' },
            // {
            //   key: 'product_type',
            //   header: 'Type',
            //   render: (r) => <span className="capitalize">{r.product_type.replace(/_/g, ' ')}</span>,
            // },
            { key: 'price', header: 'Price', render: (r) => formatCurrency(r.price) },
            { key: 'is_active', header: 'Active', render: (r) => (r.is_active ? 'Yes' : 'No') },
            {
              key: 'actions',
              header: '',
              className: 'min-w-[11rem]',
              render: (r) => (
                <div className="flex flex-wrap items-center justify-end gap-3">
                  <Button
                    size="sm"
                    variant="outline"
                    type="button"
                    onClick={() => router.push(`/admin/products/${r.id}/edit`)}
                  >
                    Edit
                  </Button>
                  <Button size="sm" variant="destructive" type="button" onClick={() => setDeleteTarget(r)}>
                    Delete
                  </Button>
                </div>
              ),
            },
          ]}
          data={result?.products ?? []}
          keyExtractor={(r) => r.id}
          emptyMessage="No products"
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
