'use client';

import { useEffect, useState } from 'react';
import {
  getCoupons,
  setCouponActive,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  type CouponItem,
} from '@/lib/api/admin';
import { AdminPageHeader } from '@/components/admin/PageHeader';
import { DataTable } from '@/components/admin/DataTable';
import { Modal } from '@/components/admin/Modal';
import { Button } from '@/components/ui';
import { formatCurrency } from '@/lib/utils/format';
import { toast } from 'sonner';

function isoToDateInput(iso: string | null): string {
  if (!iso) return '';
  const d = iso.slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : '';
}

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<CouponItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  /** null = create, number = edit */
  const [editingId, setEditingId] = useState<number | null>(null);
  const [code, setCode] = useState('');
  const [type, setType] = useState<'percentage' | 'fixed_amount'>('percentage');
  const [value, setValue] = useState('');
  /** Empty = no expiry; YYYY-MM-DD from date input */
  const [validUntil, setValidUntil] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CouponItem | null>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const load = () => {
    getCoupons()
      .then((r) => setCoupons(r.coupons))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setCode('');
    setType('percentage');
    setValue('');
    setValidUntil('');
    setFormError(null);
  };

  const openCreate = () => {
    resetForm();
    setModalOpen(true);
  };

  const openEdit = (c: CouponItem) => {
    setEditingId(c.id);
    setCode(c.code);
    setType(c.type === 'fixed_amount' ? 'fixed_amount' : 'percentage');
    setValue(String(c.value));
    setValidUntil(isoToDateInput(c.valid_until));
    setFormError(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const valueNum = parseFloat(value);
    if (!code.trim() || isNaN(valueNum) || valueNum <= 0) {
      setFormError('Code and a valid value are required');
      return;
    }
    const valid_until = validUntil.trim()
      ? `${validUntil.trim()}T23:59:59.999Z`
      : null;

    setSubmitting(true);
    try {
      if (editingId != null) {
        await updateCoupon(editingId, {
          code: code.trim(),
          type,
          value: valueNum,
          valid_until,
        });
      } else {
        await createCoupon({
          code: code.trim(),
          type,
          value: valueNum,
          ...(valid_until ? { valid_until } : {}),
        });
      }
      closeModal();
      load();
      toast.success(editingId != null ? 'Coupon updated' : 'Coupon created');
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleActive = async (c: CouponItem) => {
    try {
      await setCouponActive(c.id, !c.is_active);
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed');
    }
  };

  const closeDeleteModal = () => {
    setDeleteTarget(null);
    setDeleteError(null);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteError(null);
    setDeleteSubmitting(true);
    try {
      await deleteCoupon(deleteTarget.id);
      closeDeleteModal();
      load();
      toast.success('Coupon deleted');
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete');
    } finally {
      setDeleteSubmitting(false);
    }
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
      <AdminPageHeader title="Coupons" description="Manage discount coupons">
        <Button onClick={openCreate}>Add coupon</Button>
      </AdminPageHeader>
      {error && (
        <div className="mb-4 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive text-sm">
          {error}
        </div>
      )}
      <DataTable<CouponItem>
        columns={[
          { key: 'code', header: 'Code' },
          {
            key: 'type',
            header: 'Type',
            render: (r) => (r.type === 'percentage' ? `${r.value}%` : formatCurrency(Number(r.value))),
          },
          { key: 'used_count', header: 'Used' },
          { key: 'is_active', header: 'Active', render: (r) => (r.is_active ? 'Yes' : 'No') },
          { key: 'valid_until', header: 'Valid until', render: (r) => r.valid_until ? new Date(r.valid_until).toLocaleDateString() : '—' },
          {
            key: 'actions',
            header: '',
            className: 'min-w-[16rem]',
            render: (r) => (
              <div className="flex flex-wrap items-center justify-end gap-3">
                <Button size="sm" variant="outline" onClick={() => openEdit(r)}>
                  Edit
                </Button>
                <Button size="sm" variant="destructive" onClick={() => setDeleteTarget(r)}>
                  Delete
                </Button>
                <Button size="sm" variant="outline" onClick={() => toggleActive(r)}>
                  {r.is_active ? 'Deactivate' : 'Activate'}
                </Button>
              </div>
            ),
          },
        ]}
        data={coupons}
        keyExtractor={(r) => r.id}
        emptyMessage="No coupons"
      />
      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editingId != null ? 'Edit coupon' : 'Add coupon'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-2 text-destructive text-sm">
              {formError}
            </div>
          )}
          <div>
            <label className="text-sm font-medium">Code *</label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium">Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as 'percentage' | 'fixed_amount')}
              className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="percentage">Percentage</option>
              <option value="fixed_amount">Fixed amount</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">Value *</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium">Valid until</label>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Optional. Clear the date to remove an expiry. End of selected day (UTC).
            </p>
            <input
              type="date"
              value={validUntil}
              onChange={(e) => setValidUntil(e.target.value)}
              className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="submit" isLoading={submitting}>
              {editingId != null ? 'Save changes' : 'Create coupon'}
            </Button>
            <Button type="button" variant="outline" onClick={closeModal}>
              Cancel
            </Button>
          </div>
        </form>
      </Modal>

      <Modal open={deleteTarget != null} onClose={closeDeleteModal} title="Delete coupon">
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Delete coupon <span className="font-semibold text-foreground">{deleteTarget?.code}</span>? This removes it
            from the store; existing orders are unchanged.
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
            <Button type="button" variant="destructive" onClick={confirmDelete} isLoading={deleteSubmitting}>
              Delete coupon
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
