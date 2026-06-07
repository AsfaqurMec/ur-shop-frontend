'use client';

import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  addProductLicenseKeys,
  deleteProductLicenseKey,
  getProductLicenseInventory,
  getProductLicenseKeys,
  type AdminProductLicenseKey,
} from '@/lib/api/admin';
import { Alert, AlertDescription, Button, Pagination } from '@/components/ui';
import { toast } from 'sonner';
import type { Product, ProductCatalogVariation } from '@/types/product';

export interface ProductLicenseKeysSectionProps {
  productId: number;
  /** When the product has catalog variations, each key must belong to one variation. */
  product: Product | null;
}

const PAGE_SIZE = 10;

export function ProductLicenseKeysSection({ productId, product }: ProductLicenseKeysSectionProps) {
  const enabledVariations = useMemo(() => {
    const list = product?.catalog_variations?.filter((x) => x.enabled) ?? [];
    return [...list].sort((a, b) => a.sort_order - b.sort_order || a.id - b.id);
  }, [product?.catalog_variations]);
  const needsVariation = enabledVariations.length > 0;

  const [inventory, setInventory] = useState<{ total: number; available: number } | null>(null);
  const [keys, setKeys] = useState<AdminProductLicenseKey[]>([]);
  const [keysTotal, setKeysTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<'all' | 'available' | 'used'>('all');
  const [variationFilter, setVariationFilter] = useState<string>('all');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [keysText, setKeysText] = useState('');
  const [addVariationId, setAddVariationId] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [keysLoading, setKeysLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AdminProductLicenseKey | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitBanner, setSubmitBanner] = useState<string | null>(null);

  const invalidId = !Number.isFinite(productId) || productId < 1;

  useEffect(() => {
    if (enabledVariations.length > 0) {
      setAddVariationId((prev) => {
        if (prev && enabledVariations.some((v) => String(v.id) === prev)) return prev;
        return String(enabledVariations[0].id);
      });
    } else {
      setAddVariationId('');
    }
  }, [enabledVariations]);

  const variationLabelByVariationId = useMemo(() => {
    const attrNameByKey = new Map<string, string>();
    const valueLabelByAttrAndValue = new Map<string, string>();
    for (const attr of product?.catalog_attributes ?? []) {
      attrNameByKey.set(attr.attr_key, attr.name);
      for (const value of attr.values ?? []) {
        valueLabelByAttrAndValue.set(`${attr.attr_key}:${value.value_key}`, value.label);
      }
    }

    const buildVariationLabel = (v: ProductCatalogVariation): string => {
      const entries = Object.entries(v.combination ?? {});
      if (entries.length === 0) return `Option #${v.id}`;
      return entries
        .map(([attrKey, valueKey]) => {
          const attrLabel = attrNameByKey.get(attrKey) ?? attrKey;
          const valueLabel = valueLabelByAttrAndValue.get(`${attrKey}:${valueKey}`) ?? valueKey;
          return `${attrLabel}: ${valueLabel}`;
        })
        .join(' · ');
    };

    const map = new Map<number, string>();
    for (const v of product?.catalog_variations ?? []) {
      map.set(v.id, buildVariationLabel(v));
    }
    return map;
  }, [product?.catalog_attributes, product?.catalog_variations]);

  const variationOptionLabel = useCallback(
    (v: ProductCatalogVariation) => variationLabelByVariationId.get(v.id) ?? `Option #${v.id}`,
    [variationLabelByVariationId]
  );

  const variationLabelById = useCallback(
    (vid: number | null) => {
      if (vid == null) return '—';
      return variationLabelByVariationId.get(vid) ?? `#${vid}`;
    },
    [variationLabelByVariationId]
  );

  const refreshInventory = useCallback(async () => {
    if (invalidId) return;
    try {
      const inv = await getProductLicenseInventory(productId);
      setInventory(inv);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Failed to load license inventory');
    }
  }, [productId, invalidId]);

  const refreshKeys = useCallback(async () => {
    if (invalidId) return;
    setKeysLoading(true);
    setLoadError(null);
    try {
      const offset = (page - 1) * PAGE_SIZE;
      const data = await getProductLicenseKeys(productId, {
        limit: PAGE_SIZE,
        offset,
        status: statusFilter,
        ...(variationFilter !== 'all' ? { product_variation_id: Number(variationFilter) } : {}),
      });
      setKeys(
        data.keys.map((row) => ({
          ...row,
          product_variation_id:
            row.product_variation_id == null ? null : Number.isFinite(Number(row.product_variation_id)) ? Number(row.product_variation_id) : null,
        }))
      );
      setKeysTotal(data.total);
      if (data.total > 0 && offset >= data.total && page > 1) {
        setPage((p) => Math.max(1, p - 1));
      }
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Failed to load license keys');
    } finally {
      setKeysLoading(false);
    }
  }, [invalidId, page, productId, statusFilter, variationFilter]);

  const refreshAll = useCallback(async () => {
    await Promise.all([refreshInventory(), refreshKeys()]);
  }, [refreshInventory, refreshKeys]);

  useEffect(() => {
    void refreshInventory();
  }, [refreshInventory]);

  useEffect(() => {
    void refreshKeys();
  }, [refreshKeys]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, variationFilter]);

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault();
    if (invalidId) return;
    const keysLines = keysText
      .split(/\r?\n/)
      .map((k) => k.trim())
      .filter(Boolean);
    if (keysLines.length === 0) {
      setSubmitError('Enter at least one license key (one per line).');
      return;
    }
    if (needsVariation) {
      const vid = Number(addVariationId);
      if (!Number.isFinite(vid) || vid < 1) {
        setSubmitError('Select a variation for these keys.');
        return;
      }
    }
    setSubmitError(null);
    setSubmitBanner(null);
    setSubmitting(true);
    try {
      const vid = needsVariation ? Number(addVariationId) : undefined;
      const { added } = await addProductLicenseKeys(productId, keysLines, vid);
      setKeysText('');
      setSubmitBanner(
        added === keysLines.length
          ? `Added ${added} key(s).`
          : `Added ${added} of ${keysLines.length} key(s) (duplicates may be skipped).`
      );
      toast.success(added === keysLines.length ? `Added ${added} key(s)` : `Added ${added} of ${keysLines.length} key(s)`);
      setPage(1);
      await refreshAll();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to add keys';
      setSubmitError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeletingId(deleteTarget.id);
    try {
      await deleteProductLicenseKey(productId, deleteTarget.id);
      toast.success('License key deleted');
      setDeleteTarget(null);
      await refreshAll();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to delete license key';
      toast.error(msg);
    } finally {
      setDeletingId(null);
    }
  };

  if (invalidId) return null;

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold">License keys (inventory)</h2>
      <p className="text-sm text-muted-foreground">
        {needsVariation ? (
          <>
            This product uses variations — each key belongs to one option. Stock for that option matches the number
            of unused keys in its pool. Keys are only sold when customers pick that variation at checkout.
          </>
        ) : (
          <>
            Stock for license products is the number of unused keys in the pool. Add keys below so customers can
            purchase this product.
          </>
        )}
      </p>
      {loadError && (
        <Alert variant="destructive">
          <AlertDescription>{loadError}</AlertDescription>
        </Alert>
      )}
      {inventory && !loadError && (
        <p className="text-sm">
          <span className="font-medium text-foreground">{inventory.available}</span> available for sale
          <span className="text-muted-foreground"> · {inventory.total} total in pool (including sold)</span>
        </p>
      )}
      {needsVariation && enabledVariations.length === 0 ? (
        <Alert variant="destructive">
          <AlertDescription>
            Add at least one enabled variation under Purchase catalog before stocking license keys.
          </AlertDescription>
        </Alert>
      ) : null}
      {submitBanner && (
        <Alert>
          <AlertDescription>{submitBanner}</AlertDescription>
        </Alert>
      )}
      <form onSubmit={handleAdd} className="space-y-2">
        {submitError && (
          <Alert variant="destructive">
            <AlertDescription>{submitError}</AlertDescription>
          </Alert>
        )}
        {needsVariation ? (
          <div>
            <label htmlFor={`license-variation-${productId}`} className="text-sm font-medium">
              Variation for these keys *
            </label>
            <select
              id={`license-variation-${productId}`}
              value={addVariationId}
              onChange={(e) => setAddVariationId(e.target.value)}
              disabled={submitting || enabledVariations.length === 0}
              className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {enabledVariations.map((v) => (
                <option key={v.id} value={v.id}>
                  {variationOptionLabel(v)}
                  {v.quantity != null ? ` (${v.quantity} in stock)` : ''}
                </option>
              ))}
            </select>
          </div>
        ) : null}
        <label className="text-sm font-medium">Add keys (one per line)</label>
        <textarea
          value={keysText}
          onChange={(e) => setKeysText(e.target.value)}
          placeholder="XXXX-XXXX-XXXX&#10;YYYY-YYYY-YYYY"
          className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm"
          disabled={submitting || (needsVariation && enabledVariations.length === 0)}
        />
        <Button
          type="submit"
          isLoading={submitting}
          disabled={submitting || (needsVariation && enabledVariations.length === 0)}
        >
          Add keys to inventory
        </Button>
      </form>

      <div className="space-y-2 rounded-md border border-border p-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold">Available and used keys</h3>
          {keysLoading ? <span className="text-xs text-muted-foreground">Loading...</span> : null}
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Filter by status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'available' | 'used')}
              className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
            >
              <option value="all">All statuses</option>
              <option value="available">Available</option>
              <option value="used">Used</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Filter by variation</label>
            <select
              value={variationFilter}
              onChange={(e) => setVariationFilter(e.target.value)}
              className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
              disabled={!needsVariation}
            >
              <option value="all">All variations</option>
              {enabledVariations.map((v) => (
                <option key={v.id} value={v.id}>
                  {variationOptionLabel(v)}
                </option>
              ))}
            </select>
          </div>
        </div>
        {keys.length === 0 ? (
          <p className="text-sm text-muted-foreground">No keys found for this product yet.</p>
        ) : (
          <ul className="divide-y divide-border rounded-md border border-border">
            {keys.map((item) => {
              const isBusy = deletingId === item.id;
              return (
                <li key={item.id} className="space-y-2 px-3 py-2">
                  {needsVariation ? (
                    <div className="text-xs text-muted-foreground">
                      Variation:{' '}
                      <span className="font-medium text-foreground">{variationLabelById(item.product_variation_id)}</span>
                      {item.product_variation_id == null ? (
                        <span className="text-amber-600 dark:text-amber-400"> — unassigned legacy key</span>
                      ) : null}
                    </div>
                  ) : null}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-mono text-sm">{item.license_key}</span>
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs ${
                          item.is_available
                            ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {item.is_available ? 'Available' : 'Used'}
                      </span>
                      {item.is_available ? (
                        <>
                          <Button
                            type="button"
                            size="sm"
                            variant="destructive"
                            disabled={isBusy}
                            onClick={() => setDeleteTarget(item)}
                          >
                            Delete
                          </Button>
                        </>
                      ) : null}
                    </div>
                  </div>
                  {!item.is_available && (
                    <p className="text-xs text-muted-foreground">
                      Already assigned to order item #{item.order_item_id ?? 'unknown'}.
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        )}
        <Pagination
          page={page}
          pageSize={PAGE_SIZE}
          totalItems={keysTotal}
          onPageChange={setPage}
          disabled={keysLoading}
        />
      </div>

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg border border-border bg-background p-4 shadow-lg">
            <h4 className="text-base font-semibold">Delete license key?</h4>
            <p className="mt-2 text-sm text-muted-foreground">
              This action cannot be undone. Key:{' '}
              <span className="font-mono text-foreground">{deleteTarget.license_key}</span>
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDeleteTarget(null)}
                disabled={deletingId === deleteTarget.id}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={() => void confirmDelete()}
                isLoading={deletingId === deleteTarget.id}
              >
                Delete key
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
