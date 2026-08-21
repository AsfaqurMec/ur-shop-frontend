'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  getAdminCustomers,
  updateAdminCustomer,
  deleteAdminCustomer,
} from '@/lib/api/admin';
import { AdminPageHeader } from '@/components/admin/PageHeader';
import { DataTable } from '@/components/admin/DataTable';
import { Modal } from '@/components/admin/Modal';
import { Button, Pagination, Input } from '@/components/ui';
import { IconEye, IconPencil, IconTrash } from '@/components/admin/admin-icons';
import type { AdminCustomerListItem } from '@/lib/api/admin';
import { toast } from 'sonner';

const PAGE_SIZE = 10;

function truncateWords(text: string | null | undefined, maxWords = 20): string {
  if (!text || !text.trim()) return '—';
  const words = text.trim().split(/\s+/);
  if (words.length <= maxWords) return text.trim();
  return words.slice(0, maxWords).join(' ') + '...';
}

function AdminCustomersContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const pageFromUrl = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);

  const [customers, setCustomers] = useState<AdminCustomerListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit Customer state
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<AdminCustomerListItem | null>(null);
  const [editEmail, setEditEmail] = useState('');
  const [editName, setEditName] = useState('');
  const [editMobile, setEditMobile] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Delete Customer state
  const [deleteTarget, setDeleteTarget] = useState<AdminCustomerListItem | null>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const fetchPage = useCallback(async () => {
    const offset = (pageFromUrl - 1) * PAGE_SIZE;
    return getAdminCustomers({ limit: PAGE_SIZE, offset });
  }, [pageFromUrl]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchPage()
      .then((r) => {
        if (cancelled) return;
        setCustomers(r.customers);
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

  const refreshList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetchPage();
      setCustomers(r.customers);
      setTotal(r.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [fetchPage]);

  const setPage = (p: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (p <= 1) params.delete('page');
    else params.set('page', String(p));
    const q = params.toString();
    router.push(q ? `${pathname}?${q}` : pathname);
  };

  const openEdit = (c: AdminCustomerListItem) => {
    setEditing(c);
    setEditEmail(c.email);
    setEditName(c.name ?? '');
    setEditMobile(c.mobile ?? '');
    setEditAddress(c.address ?? '');
    setEditError(null);
    setEditOpen(true);
  };

  const closeEdit = () => {
    setEditOpen(false);
    setEditing(null);
    setEditError(null);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setEditError(null);
    setEditSubmitting(true);
    try {
      await updateAdminCustomer(editing.user_id, {
        email: editEmail.trim(),
        name: editName.trim(),
        mobile: editMobile.trim() || null,
        address: editAddress.trim() || null,
      });
      closeEdit();
      await refreshList();
      toast.success('Customer updated');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update';
      setEditError(msg);
      toast.error(msg);
    } finally {
      setEditSubmitting(false);
    }
  };

  const closeDeleteModal = () => {
    setDeleteTarget(null);
    setDeleteError(null);
  };

  const confirmDeleteCustomer = async () => {
    if (!deleteTarget) return;
    setDeleteError(null);
    setDeleteSubmitting(true);
    try {
      await deleteAdminCustomer(deleteTarget.user_id);
      closeDeleteModal();
      await refreshList();
      toast.success('Customer deleted');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to delete';
      setDeleteError(msg);
      toast.error(msg);
    } finally {
      setDeleteSubmitting(false);
    }
  };

  if (loading && customers.length === 0) {
    return (
      <div className="flex justify-center py-12">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Customers" description="Manage customer accounts and view order history" />
      <div className="rounded-xl border bg-card p-5 shadow-sm">
        <p className="text-xs font-medium text-muted-foreground">Total registered customers</p>
        <p className="mt-1 text-2xl font-bold text-foreground tabular-nums">{total}</p>
      </div>
      {error && (
        <div className="rounded-xl border border-destructive/50 bg-destructive/10 p-4 text-destructive text-sm">
          {error}
        </div>
      )}
      <div className={loading ? 'pointer-events-none opacity-60' : ''}>
        <DataTable<AdminCustomerListItem>
          columns={[
            {
              key: 'name',
              header: 'Customer Name',
              render: (r) => (
                <div>
                  <Link
                    href={`/admin/customers/${r.user_id}`}
                    className="font-medium text-foreground hover:text-primary transition-colors text-left inline-block"
                  >
                    {r.name?.trim() ? r.name : 'Guest Customer'}
                  </Link>
                  <div className="text-[11px] text-muted-foreground">{r.mobile || 'No mobile'}</div>
                </div>
              ),
            },
            {
              key: 'mobile',
              header: 'Mobile',
              render: (r) => (r.mobile?.trim() ? r.mobile : '—'),
            },
            {
              key: 'address',
              header: 'Address',
              render: (r) => (
                <span className="text-xs text-muted-foreground max-w-xs block leading-relaxed" title={r.address || ''}>
                  {truncateWords(r.address, 20)}
                </span>
              ),
            },
            { key: 'order_count', header: 'Orders', render: (r) => `${r.order_count} orders` },
            {
              key: 'last_order_at',
              header: 'Last order',
              render: (r) => (r.last_order_at ? new Date(r.last_order_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'),
            },
            {
              key: 'actions',
              header: '',
              className: 'w-[120px]',
              render: (r) => (
                <div className="flex items-center justify-end gap-1.5">
                  <Link
                    href={`/admin/customers/${r.user_id}`}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-black text-white hover:bg-neutral-800 transition-colors shadow-sm dark:bg-white dark:text-black dark:hover:bg-neutral-200"
                    title="View Customer Details"
                    aria-label="View Customer Details"
                  >
                    <IconEye className="h-4 w-4" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => openEdit(r)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-input bg-background text-foreground hover:bg-muted transition-colors shadow-sm"
                    title="Edit Customer"
                    aria-label="Edit Customer"
                  >
                    <IconPencil className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(r)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors shadow-sm"
                    title="Delete Customer"
                    aria-label="Delete Customer"
                  >
                    <IconTrash className="h-4 w-4" />
                  </button>
                </div>
              ),
            },
          ]}
          data={customers}
          keyExtractor={(r) => r.user_id}
          emptyMessage="No customers found"
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

      <Modal open={editOpen} onClose={closeEdit} title="Edit customer">
        <form onSubmit={handleEditSubmit} className="space-y-4">
          {editError && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-2 text-destructive text-sm">
              {editError}
            </div>
          )}
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1">Email *</label>
            <Input
              type="email"
              value={editEmail}
              onChange={(e) => setEditEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1">Name</label>
            <Input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              maxLength={255}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1">Mobile</label>
            <Input
              type="tel"
              value={editMobile}
              onChange={(e) => setEditMobile(e.target.value)}
              maxLength={32}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1">Address</label>
            <textarea
              value={editAddress}
              onChange={(e) => setEditAddress(e.target.value)}
              className="mt-1 flex min-h-[5.5rem] w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              maxLength={1000}
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={closeEdit}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={editSubmitting}>
              Save
            </Button>
          </div>
        </form>
      </Modal>

      <Modal open={deleteTarget != null} onClose={closeDeleteModal} title="Remove customer">
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Remove <span className="font-semibold text-foreground">{deleteTarget?.email}</span>? Their account will be
            soft-deleted, they will be signed out, and order history is kept.
          </p>
          {deleteError && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-2 text-destructive text-sm">
              {deleteError}
            </div>
          )}
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={closeDeleteModal} disabled={deleteSubmitting}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={confirmDeleteCustomer} isLoading={deleteSubmitting}>
              Remove customer
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default function AdminCustomersPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-12">
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      }
    >
      <AdminCustomersContent />
    </Suspense>
  );
}
