'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  getAdminCustomers,
  updateAdminCustomer,
  deleteAdminCustomer,
} from '@/lib/api/admin';
import { AdminPageHeader } from '@/components/admin/PageHeader';
import { DataTable } from '@/components/admin/DataTable';
import { Modal } from '@/components/admin/Modal';
import { Button, Pagination } from '@/components/ui';
import type { AdminCustomerListItem } from '@/lib/api/admin';
import { toast } from 'sonner';

const PAGE_SIZE = 10;

function AdminCustomersContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const pageFromUrl = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);

  const [customers, setCustomers] = useState<AdminCustomerListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<AdminCustomerListItem | null>(null);
  const [editEmail, setEditEmail] = useState('');
  const [editName, setEditName] = useState('');
  const [editMobile, setEditMobile] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
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
    <div>
      <AdminPageHeader title="Customers" description="Customers who have placed orders" />
      <div className="mb-6 rounded-lg border p-6">
        <p className="text-muted-foreground text-sm">Total customers</p>
        <p className="text-2xl font-semibold tabular-nums">{total}</p>
      </div>
      {error && (
        <div className="mb-4 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive text-sm">
          {error}
        </div>
      )}
      <div className={loading ? 'pointer-events-none opacity-60' : ''}>
        <DataTable<AdminCustomerListItem>
          columns={[
            { key: 'email', header: 'Email' },
            {
              key: 'name',
              header: 'Name',
              render: (r) => (r.name?.trim() ? r.name : '—'),
            },
            {
              key: 'mobile',
              header: 'Mobile',
              render: (r) => (r.mobile?.trim() ? r.mobile : '—'),
            },
            {
              key: 'address',
              header: 'Address',
              render: (r) => (r.address?.trim() ? r.address : '—'),
            },
            { key: 'order_count', header: 'Orders', render: (r) => r.order_count },
            {
              key: 'last_order_at',
              header: 'Last order',
              render: (r) => new Date(r.last_order_at).toLocaleString(),
            },
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
          data={customers}
          keyExtractor={(r) => r.user_id}
          emptyMessage="No customers with orders yet"
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
            <label className="text-sm font-medium">Email *</label>
            <input
              type="email"
              value={editEmail}
              onChange={(e) => setEditEmail(e.target.value)}
              className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium">Name</label>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              maxLength={255}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Mobile</label>
            <input
              type="tel"
              value={editMobile}
              onChange={(e) => setEditMobile(e.target.value)}
              className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              maxLength={32}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Address</label>
            <textarea
              value={editAddress}
              onChange={(e) => setEditAddress(e.target.value)}
              className="mt-1 flex min-h-[5.5rem] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              maxLength={1000}
              rows={3}
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <Button type="submit" isLoading={editSubmitting}>
              Save
            </Button>
            <Button type="button" variant="outline" onClick={closeEdit}>
              Cancel
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
          <div className="flex flex-wrap gap-3 pt-1">
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
