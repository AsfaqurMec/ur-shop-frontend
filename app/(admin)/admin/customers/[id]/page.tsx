'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  getAdminCustomerDetails,
  updateAdminCustomer,
  deleteAdminCustomer,
  type AdminCustomerDetailResponse,
} from '@/lib/api/admin';
import { AdminPageHeader, Modal } from '@/components/admin';
import { Button, Input } from '@/components/ui';
import { formatCurrency } from '@/lib/utils/format';
import { toast } from 'sonner';

export default function AdminCustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string | undefined;
  const userId = id ? Number(id) : NaN;

  const [data, setData] = useState<AdminCustomerDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit Modal State
  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editMobile, setEditMobile] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [saving, setSaving] = useState(false);

  // Delete State
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const loadData = async () => {
    if (!userId || Number.isNaN(userId)) {
      setLoading(false);
      setError('Invalid customer ID');
      return;
    }
    try {
      const res = await getAdminCustomerDetails(userId);
      setData(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load customer details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [userId]);

  const openEditModal = () => {
    if (!data) return;
    setEditName(data.customer.name || '');
    setEditEmail(data.customer.email || '');
    setEditMobile(data.customer.mobile || '');
    setEditAddress(data.customer.address || '');
    setEditOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    setSaving(true);
    try {
      await updateAdminCustomer(userId, {
        name: editName.trim(),
        email: editEmail.trim(),
        mobile: editMobile.trim() || null,
        address: editAddress.trim() || null,
      });
      toast.success('Customer updated successfully');
      setEditOpen(false);
      await loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update customer');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCustomer = async () => {
    if (!userId) return;
    setDeleting(true);
    try {
      await deleteAdminCustomer(userId);
      toast.success('Customer deleted successfully');
      router.push('/admin/customers');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete customer');
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-4">
        <AdminPageHeader title="Customer Details" />
        <div className="rounded-xl border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          {error ?? 'Customer not found'}
        </div>
        <Link href="/admin/customers">
          <Button variant="outline">Back to Customers</Button>
        </Link>
      </div>
    );
  }

  const { customer, orders } = data;

  return (
    <div className="space-y-6">
      <AdminPageHeader title={`Customer: ${customer.name || customer.email}`}>
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/admin/customers">
            <Button variant="outline">
              <svg className="mr-1.5 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Customers
            </Button>
          </Link>
          <Button variant="outline" onClick={openEditModal}>
            <svg className="mr-1.5 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit Customer
          </Button>
          <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
            <svg className="mr-1.5 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete
          </Button>
        </div>
      </AdminPageHeader>

      {/* Metrics Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <p className="text-xs font-medium text-muted-foreground">Total Orders</p>
          <p className="mt-1.5 text-2xl font-bold text-foreground">{customer.order_count}</p>
        </div>
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <p className="text-xs font-medium text-muted-foreground">Total Spend (Paid)</p>
          <p className="mt-1.5 text-2xl font-bold text-primary tabular-nums">
            {formatCurrency(customer.total_spent ?? 0, 'BDT')}
          </p>
        </div>
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <p className="text-xs font-medium text-muted-foreground">Last Order Date</p>
          <p className="mt-1.5 text-sm font-semibold text-foreground">
            {customer.last_order_at
              ? new Date(customer.last_order_at).toLocaleDateString('en-GB', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })
              : 'Never'}
          </p>
        </div>
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <p className="text-xs font-medium text-muted-foreground">Customer Since</p>
          <p className="mt-1.5 text-sm font-semibold text-foreground">
            {customer.created_at
              ? new Date(customer.created_at).toLocaleDateString('en-GB', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })
              : '—'}
          </p>
        </div>
      </div>

      {/* Customer Information Card */}
      <div className="rounded-xl border bg-card p-5 shadow-sm">
        <h2 className="text-base font-semibold text-foreground mb-4">Customer Information</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-3 text-sm">
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">Full Name:</span>
              <span className="font-medium text-foreground">{customer.name || '—'}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">Email Address:</span>
              <a
                href={`mailto:${customer.email}`}
                className="font-medium text-primary hover:underline break-all"
              >
                {customer.email}
              </a>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">Mobile Phone:</span>
              {customer.mobile ? (
                <a href={`tel:${customer.mobile}`} className="font-medium text-primary hover:underline">
                  {customer.mobile}
                </a>
              ) : (
                <span className="font-medium text-muted-foreground">—</span>
              )}
            </div>
            <div className="flex justify-between pb-1">
              <span className="text-muted-foreground">User ID:</span>
              <span className="font-mono text-xs text-muted-foreground">#{customer.user_id}</span>
            </div>
          </div>

          <div>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
              Full Address
            </span>
            <div className="rounded-lg bg-muted/40 p-3 text-xs leading-relaxed font-medium text-foreground whitespace-pre-wrap min-h-[90px]">
              {customer.address?.trim() || 'No address provided on profile.'}
            </div>
          </div>
        </div>
      </div>

      {/* Order History */}
      <div className="rounded-xl border bg-card shadow-sm">
        <div className="border-b px-5 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-foreground">Order History</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Complete list of all orders placed by this customer ({orders.length})
            </p>
          </div>
        </div>

        {orders.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            No orders placed by this customer yet.
          </div>
        ) : (
          <div className="divide-y divide-border/60">
            {orders.map((ord) => (
              <div key={ord.id} className="p-4 sm:p-5 hover:bg-muted/10 transition-colors">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <Link
                      href={`/admin/orders/${ord.id}`}
                      className="font-bold text-primary text-sm hover:underline"
                    >
                      #{ord.order_number}
                    </Link>
                    <span className="text-xs text-muted-foreground">
                      {new Date(ord.created_at).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium capitalize">
                      {ord.status.replace(/_/g, ' ')}
                    </span>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
                        ord.payment_status === 'paid'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                      }`}
                    >
                      {ord.payment_status}
                    </span>
                    <Link href={`/admin/orders/${ord.id}`}>
                      <Button size="sm" variant="outline" className="h-7 text-xs px-2.5">
                        View Order
                      </Button>
                    </Link>
                  </div>
                </div>

                <div className="grid gap-2 sm:grid-cols-2 text-xs">
                  <div className="space-y-1">
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
                      Ordered Products ({ord.items_count}):
                    </span>
                    <ul className="space-y-1">
                      {ord.items.map((it) => (
                        <li key={it.id} className="text-foreground flex flex-wrap items-center gap-1.5">
                          <span className="font-medium">• {it.product_name}</span>
                          {it.sku && (
                            <span className="rounded bg-muted px-1.5 py-0.2 text-[10px] font-mono text-muted-foreground">
                              [{it.sku}]
                            </span>
                          )}
                          <span className="text-muted-foreground">
                            × {it.quantity} ({formatCurrency(it.unit_price, ord.currency)})
                          </span>
                          {it.purchase_selections_summary?.length ? (
                            <span className="text-muted-foreground text-[11px]">
                              ({it.purchase_selections_summary.map((s) => `${s.label}: ${s.value}`).join(', ')})
                            </span>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="sm:text-right space-y-1 flex flex-col justify-end">
                    <div className="text-xs text-muted-foreground">
                      Subtotal: {formatCurrency(ord.subtotal, ord.currency)}
                      {ord.discount > 0 && ` | Discount: −${formatCurrency(ord.discount, ord.currency)}`}
                    </div>
                    <div className="text-sm font-bold text-foreground">
                      Total: {formatCurrency(ord.total, ord.currency)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Customer Modal */}
      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit Customer Details">
        <form onSubmit={handleSaveEdit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1">Name</label>
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="Customer Name"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1">Email</label>
            <Input
              type="email"
              value={editEmail}
              onChange={(e) => setEditEmail(e.target.value)}
              placeholder="customer@example.com"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1">Mobile</label>
            <Input
              value={editMobile}
              onChange={(e) => setEditMobile(e.target.value)}
              placeholder="+8801..."
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1">Address</label>
            <textarea
              value={editAddress}
              onChange={(e) => setEditAddress(e.target.value)}
              rows={3}
              className="w-full rounded-md border border-input bg-background p-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="Shipping address..."
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" type="button" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={saving}>
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)} title="Delete Customer">
        <div className="space-y-4 text-sm">
          <p className="text-muted-foreground">
            Are you sure you want to delete <strong className="text-foreground">{customer.name || customer.email}</strong>? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" type="button" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" type="button" onClick={handleDeleteCustomer} isLoading={deleting}>
              Delete Customer
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
