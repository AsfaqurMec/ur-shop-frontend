'use client';

import { Suspense, useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { getCategories, createCategory, updateCategory, deleteCategory } from '@/lib/api/admin';
import type { CategoriesListResponse, CategoryItem } from '@/lib/api/admin';
import { AdminPageHeader, DataTable, Modal } from '@/components/admin';
import { Button, Pagination } from '@/components/ui';
import { Alert, AlertDescription } from '@/components/ui';
import { toast } from 'sonner';

const PAGE_SIZE = 10;

function isPaginatedCategories(r: CategoriesListResponse): r is Extract<CategoriesListResponse, { total: number }> {
  return 'total' in r;
}

function AdminCategoriesContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const pageFromUrl = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);

  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CategoryItem | null>(null);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CategoryItem | null>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getCategories({ page: pageFromUrl, limit: PAGE_SIZE })
      .then((r) => {
        if (cancelled) return;
        setCategories(r.categories);
        if (isPaginatedCategories(r)) {
          setTotal(r.total);
          if (r.total > 0 && pageFromUrl > r.totalPages) {
            const p = new URLSearchParams(searchParams.toString());
            if (r.totalPages <= 1) p.delete('page');
            else p.set('page', String(r.totalPages));
            router.replace(p.toString() ? `${pathname}?${p}` : pathname);
          }
        } else {
          setTotal(r.categories.length);
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

  const setPage = (p: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (p <= 1) params.delete('page');
    else params.set('page', String(p));
    const q = params.toString();
    router.push(q ? `${pathname}?${q}` : pathname);
  };

  const bumpRefresh = () => setRefreshToken((t) => t + 1);

  const openCreate = () => {
    setEditing(null);
    setName('');
    setSlug('');
    setDescription('');
    setFormError(null);
    setModalOpen(true);
  };

  const openEdit = (c: CategoryItem) => {
    setEditing(c);
    setName(c.name);
    setSlug(c.slug);
    setDescription(c.description ?? '');
    setFormError(null);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!name.trim()) {
      setFormError('Name is required');
      return;
    }
    setSubmitting(true);
    try {
      if (editing) {
        await updateCategory(editing.id, {
          name: name.trim(),
          slug: slug.trim() || undefined,
          description: description.trim() || null,
        });
      } else {
        await createCategory({
          name: name.trim(),
          slug: slug.trim() || undefined,
          description: description.trim() || null,
        });
      }
      setModalOpen(false);
      bumpRefresh();
      toast.success(editing ? 'Category updated' : 'Category created');
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSubmitting(false);
    }
  };

  const closeDeleteModal = () => {
    setDeleteTarget(null);
    setDeleteError(null);
  };

  const confirmDeleteCategory = async () => {
    if (!deleteTarget) return;
    setDeleteError(null);
    setDeleteSubmitting(true);
    try {
      await deleteCategory(deleteTarget.id);
      closeDeleteModal();
      bumpRefresh();
      toast.success('Category deleted');
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete');
    } finally {
      setDeleteSubmitting(false);
    }
  };

  if (loading && categories.length === 0) {
    return (
      <div className="flex justify-center py-12">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div>
      <AdminPageHeader title="Categories" description="Manage categories">
        <Button onClick={openCreate}>Add category</Button>
      </AdminPageHeader>
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <div className={loading ? 'pointer-events-none opacity-60' : ''}>
        <DataTable<CategoryItem>
          columns={[
            { key: 'name', header: 'Name' },
            { key: 'slug', header: 'Slug' },
            { key: 'sort_order', header: 'Sort' },
            {
              key: 'actions',
              header: '',
              className: 'min-w-[10rem]',
              render: (r) => (
                <div className="flex flex-wrap items-center justify-end gap-3">
                  <Button size="sm" variant="outline" type="button" onClick={() => openEdit(r)}>
                    Edit
                  </Button>
                  <Button size="sm" variant="destructive" type="button" onClick={() => setDeleteTarget(r)}>
                    Delete
                  </Button>
                </div>
              ),
            },
          ]}
          data={categories}
          keyExtractor={(r) => r.id}
          emptyMessage="No categories"
        />
      </div>
      <div className="mt-6">
        <Pagination
          page={pageFromUrl}
          pageSize={PAGE_SIZE}
          totalItems={total}
          onPageChange={setPage}
          disabled={loading}
        />
      </div>
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit category' : 'Add category'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <Alert variant="destructive">
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          )}
          <div>
            <label className="text-sm font-medium">Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium">Slug</label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <Button type="submit" isLoading={submitting}>
              {editing ? 'Save' : 'Create'}
            </Button>
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </Modal>

      <Modal open={deleteTarget != null} onClose={closeDeleteModal} title="Delete category">
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Delete <span className="font-semibold text-foreground">{deleteTarget?.name}</span>? The category will be
            soft-deleted and hidden from admin lists and the storefront.
          </p>
          {deleteError && (
            <Alert variant="destructive">
              <AlertDescription>{deleteError}</AlertDescription>
            </Alert>
          )}
          <div className="flex flex-wrap gap-3 pt-1">
            <Button type="button" variant="outline" onClick={closeDeleteModal} disabled={deleteSubmitting}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={confirmDeleteCategory}
              isLoading={deleteSubmitting}
            >
              Delete category
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default function AdminCategoriesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-12">
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      }
    >
      <AdminCategoriesContent />
    </Suspense>
  );
}
