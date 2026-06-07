'use client';

import { useEffect, useState } from 'react';
import {
  getAdminPaymentOptions,
  createAdminPaymentOption,
  updateAdminPaymentOption,
  deleteAdminPaymentOption,
  type AdminPaymentOption,
} from '@/lib/api/admin';
import { AdminPageHeader } from '@/components/admin/PageHeader';
import { DataTable } from '@/components/admin/DataTable';
import { Modal } from '@/components/admin/Modal';
import { Button } from '@/components/ui';
import { toast } from 'sonner';

type ModalMode = 'create' | 'edit' | null;

const emptyBank = {
  bank_name: '',
  account_holder_name: '',
  account_number: '',
  routing_number: '',
  iban: '',
  swift_bic: '',
  payment_reference_hint: '',
};

export default function AdminPaymentOptionsPage() {
  const [rows, setRows] = useState<AdminPaymentOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [editing, setEditing] = useState<AdminPaymentOption | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminPaymentOption | null>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  const [createKind, setCreateKind] = useState<'manual' | 'merchant'>('manual');
  const [gatewayKey, setGatewayKey] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [sortOrder, setSortOrder] = useState('0');
  const [isEnabled, setIsEnabled] = useState(true);
  const [manualFlow, setManualFlow] = useState<'mfs_reference' | 'bank_proof'>('mfs_reference');
  const [uiBrand, setUiBrand] = useState<'generic' | 'bkash' | 'nagad' | 'rocket'>('generic');
  const [bank, setBank] = useState(emptyBank);
  const [bkUser, setBkUser] = useState('');
  const [bkPass, setBkPass] = useState('');
  const [bkAppKey, setBkAppKey] = useState('');
  const [bkAppSecret, setBkAppSecret] = useState('');
  const [bkAgreement, setBkAgreement] = useState('');
  const [bkBaseUrl, setBkBaseUrl] = useState('');
  const [bkCallback, setBkCallback] = useState('');

  const load = () => {
    getAdminPaymentOptions()
      .then((r) => setRows(r.payment_options))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const resetForm = () => {
    setCreateKind('manual');
    setGatewayKey('');
    setName('');
    setDescription('');
    setSortOrder('0');
    setIsEnabled(true);
    setManualFlow('mfs_reference');
    setUiBrand('generic');
    setBank(emptyBank);
    setBkUser('');
    setBkPass('');
    setBkAppKey('');
    setBkAppSecret('');
    setBkAgreement('');
    setBkBaseUrl('');
    setBkCallback('');
    setFormError(null);
  };

  const openCreate = () => {
    resetForm();
    setEditing(null);
    setModalMode('create');
  };

  const openEdit = (r: AdminPaymentOption) => {
    resetForm();
    setEditing(r);
    setName(r.name);
    setDescription(r.description ?? '');
    setSortOrder(String(r.sort_order));
    setIsEnabled(r.is_enabled);
    setManualFlow((r.manual_flow as 'mfs_reference' | 'bank_proof') ?? 'mfs_reference');
    setUiBrand((r.ui_brand as typeof uiBrand) ?? 'generic');
    if (r.bank_details) {
      setBank({
        bank_name: r.bank_details.bank_name ?? '',
        account_holder_name: r.bank_details.account_holder_name ?? '',
        account_number: r.bank_details.account_number ?? '',
        routing_number: r.bank_details.routing_number ?? '',
        iban: r.bank_details.iban ?? '',
        swift_bic: r.bank_details.swift_bic ?? '',
        payment_reference_hint: r.bank_details.payment_reference_hint ?? '',
      });
    }
    const masked = r.merchant_credentials_masked;
    if (masked) {
      setBkUser(masked.username);
      setBkAppKey(masked.app_key);
      setBkAgreement(masked.agreement_id);
      setBkBaseUrl(masked.base_url);
      setBkCallback(masked.callback_base_url);
    }
    setModalMode('edit');
  };

  const closeModal = () => {
    setModalMode(null);
    setEditing(null);
    resetForm();
  };

  const buildBankDetails = () => ({
    bank_name: bank.bank_name.trim(),
    account_holder_name: bank.account_holder_name.trim(),
    account_number: bank.account_number.trim(),
    ...(bank.routing_number.trim() ? { routing_number: bank.routing_number.trim() } : {}),
    ...(bank.iban.trim() ? { iban: bank.iban.trim() } : {}),
    ...(bank.swift_bic.trim() ? { swift_bic: bank.swift_bic.trim() } : {}),
    ...(bank.payment_reference_hint.trim() ? { payment_reference_hint: bank.payment_reference_hint.trim() } : {}),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!name.trim()) {
      setFormError('Name is required');
      return;
    }
    const sort = parseInt(sortOrder, 10);
    if (Number.isNaN(sort) || sort < 0) {
      setFormError('Sort order must be a non-negative integer');
      return;
    }

    if (modalMode === 'create' && createKind === 'manual' && !gatewayKey.trim()) {
      setFormError('Gateway key is required');
      return;
    }

    setSubmitting(true);
    try {
      if (modalMode === 'create') {
        if (createKind === 'manual') {
          const bd = buildBankDetails();
          if (!bd.bank_name || !bd.account_holder_name || !bd.account_number) {
            setFormError('Bank name, account holder, and account number are required');
            return;
          }
          await createAdminPaymentOption({
            kind: 'manual',
            gateway_key: gatewayKey.trim().toLowerCase(),
            name: name.trim(),
            description: description.trim() || null,
            is_enabled: isEnabled,
            sort_order: sort,
            manual_flow: manualFlow,
            bank_details: bd,
            ui_brand: uiBrand,
          });
        } else {
          await createAdminPaymentOption({
            kind: 'merchant',
            gateway_key: 'bkash',
            name: name.trim(),
            description: description.trim() || null,
            is_enabled: isEnabled,
            sort_order: sort,
            merchant_credentials: {
              username: bkUser.trim(),
              ...(bkPass.trim() ? { password: bkPass.trim() } : {}),
              app_key: bkAppKey.trim(),
              ...(bkAppSecret.trim() ? { app_secret: bkAppSecret.trim() } : {}),
              agreement_id: bkAgreement.trim(),
              ...(bkBaseUrl.trim() ? { base_url: bkBaseUrl.trim() } : {}),
              ...(bkCallback.trim() ? { callback_base_url: bkCallback.trim() } : {}),
            },
            ui_brand: 'bkash',
          });
        }
        toast.success('Payment option created');
      } else if (modalMode === 'edit' && editing) {
        if (editing.kind === 'manual') {
          const bd = buildBankDetails();
          if (!bd.bank_name || !bd.account_holder_name || !bd.account_number) {
            setFormError('Bank name, account holder, and account number are required');
            return;
          }
          await updateAdminPaymentOption(editing.payment_option_id, {
            name: name.trim(),
            description: description.trim() || null,
            is_enabled: isEnabled,
            sort_order: sort,
            manual_flow: manualFlow,
            bank_details: bd,
            ui_brand: uiBrand,
          });
        } else {
          const cred: Record<string, string> = {
            username: bkUser.trim(),
            app_key: bkAppKey.trim(),
            agreement_id: bkAgreement.trim(),
          };
          if (bkPass.trim()) cred.password = bkPass.trim();
          if (bkAppSecret.trim()) cred.app_secret = bkAppSecret.trim();
          if (bkBaseUrl.trim()) cred.base_url = bkBaseUrl.trim();
          if (bkCallback.trim()) cred.callback_base_url = bkCallback.trim();

          await updateAdminPaymentOption(editing.payment_option_id, {
            name: name.trim(),
            description: description.trim() || null,
            is_enabled: isEnabled,
            sort_order: sort,
            merchant_credentials: cred,
          });
        }
        toast.success('Payment option updated');
      }
      closeModal();
      load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleEnabled = async (r: AdminPaymentOption) => {
    try {
      await updateAdminPaymentOption(r.payment_option_id, { is_enabled: !r.is_enabled });
      load();
      toast.success(r.is_enabled ? 'Payment option disabled' : 'Payment option enabled');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update');
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteSubmitting(true);
    try {
      await deleteAdminPaymentOption(deleteTarget.payment_option_id);
      setDeleteTarget(null);
      load();
      toast.success('Payment option deleted');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete');
    } finally {
      setDeleteSubmitting(false);
    }
  };

  const merchantCount = rows.filter((r) => r.kind === 'merchant').length;
  const canAddMerchant = merchantCount === 0;

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div>
      <AdminPageHeader
        title="Payment options"
        description="Configure manual (wallet / bank) and bKash merchant checkout. Customers only see enabled methods."
      >
        <Button onClick={openCreate}>Add payment option</Button>
      </AdminPageHeader>
      {error && (
        <div className="mb-4 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive text-sm">
          {error}
        </div>
      )}
      <DataTable<AdminPaymentOption>
        columns={[
          { key: 'gateway', header: 'Gateway' },
          { key: 'name', header: 'Name' },
          {
            key: 'kind',
            header: 'Type',
            render: (r) => (r.kind === 'merchant' ? 'Merchant (bKash)' : 'Manual'),
          },
          {
            key: 'manual_flow',
            header: 'Flow',
            render: (r) => r.manual_flow ?? '—',
          },
          {
            key: 'sort_order',
            header: 'Sort',
            render: (r) => r.sort_order,
          },
          {
            key: 'is_enabled',
            header: 'Enabled',
            render: (r) => (r.is_enabled ? 'Yes' : 'No'),
          },
          {
            key: 'actions',
            header: '',
            className: 'min-w-[14rem]',
            render: (r) => (
              <div className="flex flex-wrap items-center justify-end gap-2">
                <Button size="sm" variant="outline" onClick={() => openEdit(r)}>
                  Edit
                </Button>
                <Button size="sm" variant="outline" onClick={() => toggleEnabled(r)}>
                  {r.is_enabled ? 'Disable' : 'Enable'}
                </Button>
                <Button size="sm" variant="destructive" onClick={() => setDeleteTarget(r)}>
                  Delete
                </Button>
              </div>
            ),
          },
        ]}
        data={rows}
        keyExtractor={(r) => r.payment_option_id}
        emptyMessage="No payment options"
      />

      <Modal
        open={modalMode != null}
        onClose={closeModal}
        title={modalMode === 'create' ? 'Add payment option' : 'Edit payment option'}
        wide
      >
        <form onSubmit={handleSubmit} className="max-h-[70vh] space-y-5 overflow-y-auto pr-1">
          {formError && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-2 text-destructive text-sm">
              {formError}
            </div>
          )}

          <div className="grid gap-4 lg:grid-cols-2">
            {modalMode === 'create' && (
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Kind</label>
                <select
                  value={createKind}
                  onChange={(e) => setCreateKind(e.target.value as 'manual' | 'merchant')}
                  className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="manual">Manual (wallet or bank transfer)</option>
                  {canAddMerchant ? <option value="merchant">Merchant (bKash redirect)</option> : null}
                </select>
                {!canAddMerchant && (
                  <p className="text-xs text-muted-foreground">
                    Only one bKash merchant option is allowed. Edit the existing row or delete it first.
                  </p>
                )}
              </div>
            )}

            {modalMode === 'create' && createKind === 'manual' && (
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Gateway key *</label>
                <p className="text-xs text-muted-foreground">Unique ID stored on orders, e.g. manual_upay</p>
                <input
                  value={gatewayKey}
                  onChange={(e) => setGatewayKey(e.target.value.toLowerCase())}
                  className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono"
                  placeholder="manual_mywallet"
                  required
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Display name *</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Sort order</label>
              <input
                type="number"
                min={0}
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>

            <div className="lg:col-span-2 space-y-1.5">
              <label className="text-sm font-medium">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>

            <div className="lg:col-span-2 flex items-center gap-2 pb-1">
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input type="checkbox" checked={isEnabled} onChange={(e) => setIsEnabled(e.target.checked)} />
                Enabled
              </label>
            </div>
          </div>

          {(modalMode === 'create' && createKind === 'manual') ||
          (modalMode === 'edit' && editing?.kind === 'manual') ? (
            <>
              <div>
                <label className="text-sm font-medium">Manual flow</label>
                <select
                  value={manualFlow}
                  onChange={(e) => setManualFlow(e.target.value as 'mfs_reference' | 'bank_proof')}
                  className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="mfs_reference">Wallet — customer enters TrxID at checkout</option>
                  <option value="bank_proof">Bank — customer uploads proof on pay page</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Logo / channel style</label>
                <select
                  value={uiBrand}
                  onChange={(e) => setUiBrand(e.target.value as typeof uiBrand)}
                  className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="generic">Generic</option>
                  <option value="bkash">bKash colors</option>
                  <option value="nagad">Nagad colors</option>
                  <option value="rocket">Rocket colors</option>
                </select>
              </div>
              <p className="text-xs font-medium text-muted-foreground">Pay-to / bank details (shown to customers)</p>
              <div className="grid gap-2 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-medium">Bank / wallet label</label>
                  <input
                    value={bank.bank_name}
                    onChange={(e) => setBank((b) => ({ ...b, bank_name: e.target.value }))}
                    className="mt-0.5 flex h-9 w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium">Account holder</label>
                  <input
                    value={bank.account_holder_name}
                    onChange={(e) => setBank((b) => ({ ...b, account_holder_name: e.target.value }))}
                    className="mt-0.5 flex h-9 w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-medium">Account / wallet number</label>
                  <input
                    value={bank.account_number}
                    onChange={(e) => setBank((b) => ({ ...b, account_number: e.target.value }))}
                    className="mt-0.5 flex h-9 w-full rounded-md border border-input bg-background px-2 py-1 text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium">Routing (optional)</label>
                  <input
                    value={bank.routing_number}
                    onChange={(e) => setBank((b) => ({ ...b, routing_number: e.target.value }))}
                    className="mt-0.5 flex h-9 w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium">IBAN (optional)</label>
                  <input
                    value={bank.iban}
                    onChange={(e) => setBank((b) => ({ ...b, iban: e.target.value }))}
                    className="mt-0.5 flex h-9 w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium">SWIFT (optional)</label>
                  <input
                    value={bank.swift_bic}
                    onChange={(e) => setBank((b) => ({ ...b, swift_bic: e.target.value }))}
                    className="mt-0.5 flex h-9 w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-medium">Customer instructions (optional)</label>
                  <textarea
                    value={bank.payment_reference_hint}
                    onChange={(e) => setBank((b) => ({ ...b, payment_reference_hint: e.target.value }))}
                    rows={2}
                    className="mt-0.5 w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
                  />
                </div>
              </div>
            </>
          ) : null}

          {(modalMode === 'create' && createKind === 'merchant') ||
          (modalMode === 'edit' && editing?.kind === 'merchant') ? (
            <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-3">
              <p className="text-sm font-medium">bKash API (Tokenized Checkout)</p>
              <p className="text-xs text-muted-foreground">
                Values merge with backend <span className="font-mono">BKASH_*</span> environment variables when left
                empty in the database. Set secrets here to manage everything from the admin UI.
              </p>
              <div>
                <label className="text-xs font-medium">Username</label>
                <input
                  value={bkUser}
                  onChange={(e) => setBkUser(e.target.value)}
                  className="mt-0.5 flex h-9 w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
                  autoComplete="off"
                />
              </div>
              <div>
                <label className="text-xs font-medium">Password</label>
                <input
                  type="password"
                  value={bkPass}
                  onChange={(e) => setBkPass(e.target.value)}
                  placeholder={modalMode === 'edit' ? 'Leave blank to keep current' : ''}
                  className="mt-0.5 flex h-9 w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
                  autoComplete="new-password"
                />
              </div>
              <div>
                <label className="text-xs font-medium">App key</label>
                <input
                  value={bkAppKey}
                  onChange={(e) => setBkAppKey(e.target.value)}
                  className="mt-0.5 flex h-9 w-full rounded-md border border-input bg-background px-2 py-1 text-sm font-mono"
                />
              </div>
              <div>
                <label className="text-xs font-medium">App secret</label>
                <input
                  type="password"
                  value={bkAppSecret}
                  onChange={(e) => setBkAppSecret(e.target.value)}
                  placeholder={modalMode === 'edit' ? 'Leave blank to keep current' : ''}
                  className="mt-0.5 flex h-9 w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-medium">Agreement ID</label>
                <input
                  value={bkAgreement}
                  onChange={(e) => setBkAgreement(e.target.value)}
                  className="mt-0.5 flex h-9 w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-medium">API base URL (optional)</label>
                <input
                  value={bkBaseUrl}
                  onChange={(e) => setBkBaseUrl(e.target.value)}
                  placeholder="https://tokenized.sandbox.bka.sh/v1.2.0-beta"
                  className="mt-0.5 flex h-9 w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-medium">Callback base URL (optional)</label>
                <input
                  value={bkCallback}
                  onChange={(e) => setBkCallback(e.target.value)}
                  placeholder="https://your-store.com/checkout/bkash-callback"
                  className="mt-0.5 flex h-9 w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
                />
              </div>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2 pt-2">
            <Button type="submit" isLoading={submitting}>
              {modalMode === 'create' ? 'Create' : 'Save'}
            </Button>
            <Button type="button" variant="outline" onClick={closeModal}>
              Cancel
            </Button>
          </div>
        </form>
      </Modal>

      <Modal open={deleteTarget != null} onClose={() => setDeleteTarget(null)} title="Delete payment option">
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Remove <span className="font-semibold text-foreground">{deleteTarget?.name}</span> (
            {deleteTarget?.gateway})? Existing orders keep their recorded gateway; new checkouts will not offer this
            method.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button type="button" variant="outline" onClick={() => setDeleteTarget(null)} disabled={deleteSubmitting}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={confirmDelete} isLoading={deleteSubmitting}>
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
