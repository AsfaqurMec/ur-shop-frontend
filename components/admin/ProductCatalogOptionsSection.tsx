'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Product, ProductCatalogAttribute } from '@/types/product';
import {
  updateProduct,
  putProductCatalogAttributes,
  putProductCatalogVariations,
  postGenerateProductVariations,
  type AdminCatalogAttributeInput,
} from '@/lib/api/admin';
import { Button } from '@/components/ui';
import { Alert, AlertDescription } from '@/components/ui';
import { formatCurrency } from '@/lib/utils/format';
import { AdminAccordionSection } from '@/components/admin/AdminAccordionSection';
import { IconPackage, IconSliders, IconLayers } from '@/components/admin/admin-icons';
import { toast } from 'sonner';

/** Normalize API / MySQL JSON combo into string map (handles string JSON, numbers, key casing). */
function normalizeCombo(raw: unknown): Record<string, string> {
  let obj: Record<string, unknown> = {};
  if (raw == null) return {};
  if (typeof raw === 'string') {
    try {
      const p = JSON.parse(raw) as unknown;
      if (p && typeof p === 'object' && !Array.isArray(p)) obj = p as Record<string, unknown>;
    } catch {
      return {};
    }
  } else if (typeof raw === 'object' && !Array.isArray(raw)) {
    obj = raw as Record<string, unknown>;
  } else return {};
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v == null) continue;
    const s = typeof v === 'string' ? v : String(v);
    if (s.length > 0) out[String(k)] = s;
  }
  return out;
}

function getComboValue(combo: Record<string, string>, attrKey: string): string {
  if (combo[attrKey] != null && combo[attrKey] !== '') return combo[attrKey];
  const lk = attrKey.toLowerCase();
  const key = Object.keys(combo).find((k) => k.toLowerCase() === lk);
  return key ? combo[key] : '';
}

function variationDimensions(attrs: ProductCatalogAttribute[]) {
  return attrs
    .filter((a) => a.used_for_variations && a.kind === 'select')
    .sort((a, b) => a.sort_order - b.sort_order);
}

function resolveValueLabel(at: ProductCatalogAttribute, valueKey: string): string {
  if (!valueKey) return '—';
  const byKey = at.values.find((x) => x.value_key === valueKey);
  if (byKey) return byKey.label;
  const byLabel = at.values.find((x) => x.label === valueKey);
  if (byLabel) return byLabel.label;
  return valueKey;
}

function summarizeVariationRow(
  combo: Record<string, string>,
  attrs: ProductCatalogAttribute[]
): { title: string; badges: Array<{ attr: string; label: string }> } {
  const dims = variationDimensions(attrs);
  const badges = dims.map((at) => {
    const vk = getComboValue(combo, at.attr_key);
    return { attr: at.name, label: resolveValueLabel(at, vk) };
  });
  const title = badges.map((b) => `${b.attr}: ${b.label}`).join(' · ');
  return { title: title || 'Combination', badges };
}

function toAdminInput(attrs: ProductCatalogAttribute[]): AdminCatalogAttributeInput[] {
  return attrs.map((a, idx) => ({
    attr_key: a.attr_key.trim(),
    name: a.name.trim(),
    kind: a.kind,
    visible_on_page: a.visible_on_page,
    used_for_variations: a.used_for_variations,
    sort_order: a.sort_order ?? idx,
    values: (a.values ?? []).map((v, j) => ({
      value_key: v.value_key.trim(),
      label: v.label.trim(),
      sort_order: v.sort_order ?? j,
    })),
  }));
}

function emptyAttribute(kind: ProductCatalogAttribute['kind'], sort: number): ProductCatalogAttribute {
  const key = `attr_${kind}_${sort}_${Math.random().toString(36).slice(2, 7)}`;
  if (kind === 'select') {
    return {
      attr_key: key,
      name: 'New option',
      kind: 'select',
      visible_on_page: true,
      used_for_variations: true,
      sort_order: sort,
      values: [
        { value_key: 'a', label: 'Option A', sort_order: 0 },
        { value_key: 'b', label: 'Option B', sort_order: 1 },
      ],
    };
  }
  return {
    attr_key: key,
    name: kind === 'email' ? 'Email' : 'Details',
    kind,
    visible_on_page: true,
    used_for_variations: false,
    sort_order: sort,
    values: [],
  };
}

type VariationForm = {
  /** Server row id — required for default option + stable UI. */
  id: number;
  combination: Record<string, string>;
  sku: string | null;
  quantity: number | null;
  price: number;
  compare_at_price: number | null;
  enabled: boolean;
};

export interface ProductCatalogOptionsSectionProps {
  productId: number;
  product: Product;
  onProductUpdated: (p: Product) => void;
  /** Notifies parent when variation dimensions exist (for price labels, etc.). */
  onVariationDimensionsChange?: (usesVariations: boolean) => void;
}

export function ProductCatalogOptionsSection({
  productId,
  product,
  onProductUpdated,
  onVariationDimensionsChange,
}: ProductCatalogOptionsSectionProps) {
  const [sku, setSku] = useState(product.sku ?? '');
  const [quantity, setQuantity] = useState<number | ''>(product.quantity ?? '');
  const [attributes, setAttributes] = useState<ProductCatalogAttribute[]>(() => product.catalog_attributes ?? []);
  const [variations, setVariations] = useState<VariationForm[]>(() =>
    (product.catalog_variations ?? []).map((v) => ({
      id: v.id,
      combination: normalizeCombo(v.combination),
      sku: v.sku,
      quantity: v.quantity ?? null,
      price: v.price,
      compare_at_price: v.compare_at_price,
      enabled: v.enabled,
    }))
  );
  const [defaultVariationId, setDefaultVariationId] = useState<number | ''>(
    product.default_variation_id ?? ''
  );
  const [expandedAttr, setExpandedAttr] = useState<Record<number, boolean>>({});
  const [expandedVar, setExpandedVar] = useState<Record<number, boolean>>({});

  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  useEffect(() => {
    setSku(product.sku ?? '');
    setQuantity(product.quantity ?? '');
    setAttributes(product.catalog_attributes ?? []);
    setVariations(
      (product.catalog_variations ?? []).map((v) => ({
        id: v.id,
        combination: normalizeCombo(v.combination),
        sku: v.sku,
        quantity: v.quantity ?? null,
        price: v.price,
        compare_at_price: v.compare_at_price,
        enabled: v.enabled,
      }))
    );
    setDefaultVariationId(product.default_variation_id ?? '');
  }, [productId, product.catalog_attributes, product.catalog_variations, product.sku, product.default_variation_id]);

  const run = async (key: string, fn: () => Promise<void>) => {
    setError(null);
    setOk(null);
    setLoading(key);
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Request failed');
    } finally {
      setLoading(null);
    }
  };

  const saveInventory = () =>
    run('inv', async () => {
      const p = await updateProduct(productId, {
        sku: sku.trim() ? sku.trim() : null,
        quantity: quantity === '' ? null : Number(quantity),
        default_variation_id:
          defaultVariationId === '' ? null : Number(defaultVariationId),
      });
      setOk('Inventory saved.');
      toast.success('Inventory saved');
      onProductUpdated(p);
    });

  const clearDefaultVariation = () =>
    run('defclear', async () => {
      const p = await updateProduct(productId, { default_variation_id: null });
      setDefaultVariationId('');
      setOk('Default cleared — storefront will use the first enabled option.');
      onProductUpdated(p);
    });

  const setDefaultVariationRow = (id: number) =>
    run('def', async () => {
      const p = await updateProduct(productId, { default_variation_id: id });
      setDefaultVariationId(id);
      setOk('Default option set for the product page.');
      toast.success('Default option set');
      onProductUpdated(p);
    });

  const saveAttributes = () =>
    run('attr', async () => {
      const keys = attributes.map((a) => a.attr_key.trim().toLowerCase());
      if (new Set(keys).size !== keys.length) {
        const m = 'Each attribute key must be unique';
        setError(m);
        toast.error(m);
        return;
      }
      for (const a of attributes) {
        if (!a.attr_key.trim() || !a.name.trim()) {
          const m = 'Every attribute needs a key and name';
          setError(m);
          toast.error(m);
          return;
        }
        if (a.used_for_variations && a.kind !== 'select') {
          const m = `"${a.name}" cannot be used for variations unless it is a select attribute`;
          setError(m);
          toast.error(m);
          return;
        }
        if (a.kind === 'select' && a.used_for_variations && (!a.values || a.values.length === 0)) {
          const m = `Variation attribute "${a.name}" needs at least one value`;
          setError(m);
          toast.error(m);
          return;
        }
      }
      const p = await putProductCatalogAttributes(productId, toAdminInput(attributes));
      setOk(
        'Attributes saved. Variation rows were rebuilt for every combination (default price = product base price). Set SKU and price per row below, then save variations.'
      );
      toast.success('Attributes saved');
      onProductUpdated(p);
    });

  const saveVariations = () =>
    run('var', async () => {
      const p = await putProductCatalogVariations(
        productId,
        variations.map((v, i) => ({
          combination: v.combination,
          sku: v.sku?.trim() ? v.sku.trim() : null,
          quantity: v.quantity ?? null,
          price: v.price,
          compare_at_price: v.compare_at_price,
          enabled: v.enabled,
          sort_order: i,
        }))
      );
      setOk('Variations saved.');
      toast.success('Variations saved');
      onProductUpdated(p);
    });

  const generateVariations = () =>
    run('gen', async () => {
      const r = await postGenerateProductVariations(productId);
      setOk(
        r.added > 0
          ? `Added ${r.added} missing combination row(s).`
          : 'No new combinations to add — all combinations already exist.'
      );
      toast.success(r.added > 0 ? `Added ${r.added} variation row(s)` : 'No new combinations to add');
      onProductUpdated(r);
    });

  const variationAttrKeys = useMemo(() => variationDimensions(attributes), [attributes]);

  const basePriceLabel = formatCurrency(Number(product.price ?? 0));

  const defaultVariationStorefrontLabel = useMemo(() => {
    const id = product.default_variation_id;
    if (id == null) return null;
    const row = product.catalog_variations?.find((v) => v.id === id);
    if (!row?.enabled) return null;
    return formatCurrency(Number(row.price));
  }, [product.default_variation_id, product.catalog_variations]);

  const usesVariations = useMemo(
    () => variationAttrKeys.length > 0 || variations.length > 0,
    [variationAttrKeys, variations.length]
  );

  useEffect(() => {
    onVariationDimensionsChange?.(usesVariations);
  }, [usesVariations, onVariationDimensionsChange]);

  const toggleExpandAllAttrs = useCallback(() => {
    const allOpen = attributes.every((_, i) => expandedAttr[i]);
    const next: Record<number, boolean> = {};
    attributes.forEach((_, i) => {
      next[i] = !allOpen;
    });
    setExpandedAttr(next);
  }, [attributes, expandedAttr]);

  const storefrontDefaultActive = defaultVariationStorefrontLabel != null;

  return (
    <div className="space-y-4">
      <AdminAccordionSection
        title="Inventory"
        description="Product-level SKU and optional storefront default (when not using per-variation inventory)."
        icon={<IconPackage />}
        defaultOpen={!usesVariations}
        badge={
          usesVariations ? (
            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Handled per variation
            </span>
          ) : null
        }
      >
        <div className="space-y-4">
          {usesVariations ? (
            <p className="rounded-lg border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-sm text-amber-950 dark:text-amber-100">
              This product uses variations — set SKU on each variation row below. Product-level SKU and base inventory
              are disabled.
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Base SKU applies to the whole simple product. When you add variation attributes, SKUs move to each
              combination row, along with per-variation quantity.
            </p>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground">SKU</label>
              <input
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                disabled={usesVariations}
                className="mt-0.5 flex h-9 w-full rounded-md border border-input bg-background px-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
                placeholder="e.g. APP-LIC-1YR"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Quantity</label>
              <input
                type="number"
                min="0"
                step="1"
                value={quantity}
                onChange={(e) => {
                  const raw = e.target.value;
                  if (raw === '') {
                    setQuantity('');
                    return;
                  }
                  const n = Number(raw);
                  setQuantity(Number.isFinite(n) ? Math.max(0, Math.floor(n)) : '');
                }}
                disabled={usesVariations}
                className="mt-0.5 flex h-9 w-full rounded-md border border-input bg-background px-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
                placeholder="Leave empty for unlimited"
              />
            </div>
          </div>
          <Button
            type="button"
            size="sm"
            onClick={saveInventory}
            isLoading={loading === 'inv'}
            disabled={usesVariations}
          >
            Save inventory
          </Button>
        </div>
      </AdminAccordionSection>

      <AdminAccordionSection
        title="Attributes"
        description="Select lists, text fields, and options that drive variation rows."
        icon={<IconSliders />}
        defaultOpen
      >
        <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-sm font-medium text-muted-foreground">Options</span>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                setAttributes((prev) => [...prev, emptyAttribute('select', prev.length)])
              }
            >
              + Select
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setAttributes((prev) => [...prev, emptyAttribute('text', prev.length)])}
            >
              + Text
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setAttributes((prev) => [...prev, emptyAttribute('email', prev.length)])}
            >
              + Email
            </Button>
            <button
              type="button"
              className="text-xs text-primary underline"
              onClick={toggleExpandAllAttrs}
            >
              Expand / close all
            </button>
          </div>
        </div>
        {!usesVariations ? (
          <div className="rounded-lg border border-border/60 bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Pricing</span> is controlled in{' '}
            <strong className="text-foreground">General</strong> (main product form). Add a select attribute marked
            &quot;Used for variations&quot; to enable per-option prices.
          </div>
        ) : storefrontDefaultActive ? (
          <div className="flex flex-col gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
            <div className="flex flex-wrap items-center gap-2 gap-y-1">
              <span className="font-medium text-foreground">Storefront (default row)</span>
              <span className="rounded-md bg-background/80 px-2.5 py-1 font-mono text-base font-semibold tabular-nums text-emerald-700 dark:text-emerald-300">
                {defaultVariationStorefrontLabel}
              </span>
            </div>
            <span className="text-muted-foreground sm:max-w-[28rem]">
              Catalog cards and the product page use this price while the default variation is set. Edit the price on that
              variation row, or change the default toggle.
            </span>
          </div>
        ) : (
          <div className="flex flex-col gap-2 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
            <div className="flex flex-wrap items-center gap-2 gap-y-1">
              <span className="font-medium text-foreground">Product base price</span>
              <span className="rounded-md bg-background/80 px-2.5 py-1 font-mono text-base font-semibold tabular-nums text-primary">
                {basePriceLabel}
              </span>
            </div>
            <span className="text-muted-foreground sm:max-w-[28rem]">
              New variation rows start from this amount until you set row prices. Set one row as <strong>Default</strong>{' '}
              so the storefront mirrors that row&apos;s price (also updates the General price field).
            </span>
          </div>
        )}
        <p className="text-sm text-muted-foreground">
          Select attributes can drive variations. Text and email fields collect free input on the product page. When you
          save attributes, every variation combination is created automatically (using the product base price from
          General when applicable). Use &quot;Add missing combinations&quot; only if you need to sync after adding new
          values without saving attributes again.
        </p>
        {attributes.length === 0 ? (
          <p className="text-sm text-muted-foreground">No attributes — simple product.</p>
        ) : (
          <ul className="space-y-2">
            {attributes.map((a, ai) => {
              const open = expandedAttr[ai] ?? true;
              return (
                <li key={`${a.attr_key}-${ai}`} className="rounded-md border bg-card">
                  <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
                    <button
                      type="button"
                      className="flex flex-1 items-center gap-2 text-left font-medium"
                      onClick={() => setExpandedAttr((s) => ({ ...s, [ai]: !open }))}
                    >
                      <span className="text-muted-foreground">{open ? '▼' : '▶'}</span>
                      {a.name || a.attr_key}
                    </button>
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <button
                        type="button"
                        className="text-primary"
                        disabled={ai === 0}
                        onClick={() =>
                          setAttributes((prev) => {
                            const n = [...prev];
                            [n[ai - 1], n[ai]] = [n[ai], n[ai - 1]];
                            return n;
                          })
                        }
                      >
                        Up
                      </button>
                      <button
                        type="button"
                        className="text-primary"
                        disabled={ai >= attributes.length - 1}
                        onClick={() =>
                          setAttributes((prev) => {
                            const n = [...prev];
                            [n[ai], n[ai + 1]] = [n[ai + 1], n[ai]];
                            return n;
                          })
                        }
                      >
                        Down
                      </button>
                      <button
                        type="button"
                        className="text-destructive"
                        onClick={() => setAttributes((prev) => prev.filter((_, i) => i !== ai))}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                  {open && (
                    <div className="space-y-3 border-t px-3 py-3">
                      <div className="grid gap-2 sm:grid-cols-2">
                        <div>
                          <label className="text-xs text-muted-foreground">Key</label>
                          <input
                            value={a.attr_key}
                            onChange={(e) => {
                              const t = e.target.value;
                              setAttributes((prev) =>
                                prev.map((x, i) => (i === ai ? { ...x, attr_key: t } : x))
                              );
                            }}
                            className="mt-0.5 flex h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground">Name</label>
                          <input
                            value={a.name}
                            onChange={(e) => {
                              const t = e.target.value;
                              setAttributes((prev) =>
                                prev.map((x, i) => (i === ai ? { ...x, name: t } : x))
                              );
                            }}
                            className="mt-0.5 flex h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground">Type</label>
                          <select
                            value={a.kind}
                            onChange={(e) => {
                              const kind = e.target.value as ProductCatalogAttribute['kind'];
                              setAttributes((prev) =>
                                prev.map((x, i) => {
                                  if (i !== ai) return x;
                                  if (kind !== 'select') {
                                    return {
                                      ...x,
                                      kind,
                                      used_for_variations: false,
                                      values: [],
                                    };
                                  }
                                  return {
                                    ...x,
                                    kind,
                                    values:
                                      x.values?.length ? x.values : emptyAttribute('select', 0).values,
                                  };
                                })
                              );
                            }}
                            className="mt-0.5 flex h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
                          >
                            <option value="select">Select (preset values)</option>
                            <option value="text">Text</option>
                            <option value="email">Email</option>
                          </select>
                        </div>
                        <div className="flex flex-wrap items-end gap-4">
                          <label className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={a.visible_on_page}
                              onChange={(e) => {
                                const c = e.target.checked;
                                setAttributes((prev) =>
                                  prev.map((x, i) => (i === ai ? { ...x, visible_on_page: c } : x))
                                );
                              }}
                            />
                            Visible on product page
                          </label>
                          <label className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={a.used_for_variations}
                              disabled={a.kind !== 'select'}
                              onChange={(e) => {
                                const c = e.target.checked;
                                setAttributes((prev) =>
                                  prev.map((x, i) =>
                                    i === ai && x.kind === 'select' ? { ...x, used_for_variations: c } : x
                                  )
                                );
                              }}
                            />
                            Used for variations
                          </label>
                        </div>
                      </div>
                      {a.kind === 'select' && (
                        <div className="space-y-2">
                          <p className="text-xs font-medium text-muted-foreground">Values</p>
                          <ul className="space-y-2">
                            {(a.values ?? []).map((v, vi) => (
                              <li
                                key={`${a.attr_key}-v-${vi}`}
                                className="flex flex-wrap items-center gap-2 rounded border border-dashed px-2 py-1"
                              >
                                <input
                                  placeholder="key"
                                  value={v.value_key}
                                  onChange={(e) => {
                                    const t = e.target.value;
                                    setAttributes((prev) =>
                                      prev.map((x, i) => {
                                        if (i !== ai) return x;
                                        const vals = [...(x.values ?? [])];
                                        vals[vi] = { ...vals[vi], value_key: t };
                                        return { ...x, values: vals };
                                      })
                                    );
                                  }}
                                  className="h-8 w-24 rounded border border-input bg-background px-2 text-xs"
                                />
                                <input
                                  placeholder="Label"
                                  value={v.label}
                                  onChange={(e) => {
                                    const t = e.target.value;
                                    setAttributes((prev) =>
                                      prev.map((x, i) => {
                                        if (i !== ai) return x;
                                        const vals = [...(x.values ?? [])];
                                        vals[vi] = { ...vals[vi], label: t };
                                        return { ...x, values: vals };
                                      })
                                    );
                                  }}
                                  className="h-8 flex-1 min-w-[120px] rounded border border-input bg-background px-2 text-xs"
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="text-destructive"
                                  onClick={() =>
                                    setAttributes((prev) =>
                                      prev.map((x, i) => {
                                        if (i !== ai) return x;
                                        const vals = [...(x.values ?? [])].filter((_, j) => j !== vi);
                                        return { ...x, values: vals };
                                      })
                                    )
                                  }
                                >
                                  ×
                                </Button>
                              </li>
                            ))}
                          </ul>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setAttributes((prev) =>
                                prev.map((x, i) => {
                                  if (i !== ai) return x;
                                  const vals = [...(x.values ?? [])];
                                  vals.push({
                                    value_key: `v_${vals.length + 1}`,
                                    label: `Value ${vals.length + 1}`,
                                    sort_order: vals.length,
                                  });
                                  return { ...x, values: vals };
                                })
                              )
                            }
                          >
                            Add value
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
        <Button type="button" onClick={saveAttributes} isLoading={loading === 'attr'}>
          Save attributes
        </Button>
        </div>
      </AdminAccordionSection>

      <AdminAccordionSection
        title="Variations"
        description="Each combination is a sellable option with its own SKU, quantity, price, and optional storefront default."
        icon={<IconLayers />}
        defaultOpen={variationAttrKeys.length > 0}
        className="bg-gradient-to-b from-muted/20 via-card/50 to-card/80 ring-1 ring-border/40"
      >
        <div className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border/50 pb-4">
          <p className="max-w-2xl text-sm text-muted-foreground">
            New rows start at the product base price ({basePriceLabel}) until you edit them. Turn{' '}
            <strong className="text-foreground">Default</strong> on for one row so catalog and PDP use that option&apos;s
            price and selection.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {variations.length > 0 && defaultVariationId !== '' ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground"
                onClick={clearDefaultVariation}
                isLoading={loading === 'defclear'}
              >
                Clear default
              </Button>
            ) : null}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={generateVariations}
              isLoading={loading === 'gen'}
              disabled={variationAttrKeys.length === 0}
            >
              Add missing combinations
            </Button>
          </div>
        </div>
        {variationAttrKeys.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Add at least one select attribute marked &quot;Used for variations&quot; to build variation rows.
          </p>
        ) : variations.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No variation rows in the database yet. Click <strong>Save attributes</strong> above to create every
            combination automatically, or use <strong>Add missing combinations</strong> if rows already exist in the DB
            but are missing here.
          </p>
        ) : (
          <ul className="space-y-3">
            {variations.map((v, vi) => {
              const open = expandedVar[vi] ?? false;
              const { badges, title } = summarizeVariationRow(v.combination, attributes);
              const isDefault =
                defaultVariationId !== '' && Number(defaultVariationId) === v.id;
              const compareLine =
                v.compare_at_price != null && v.compare_at_price > v.price
                  ? formatCurrency(v.compare_at_price)
                  : null;
              return (
                <li
                  key={`${v.id}-${vi}`}
                  className={`group relative overflow-hidden rounded-xl border bg-card/90 transition-all duration-200 ${
                    isDefault
                      ? 'border-primary/50 shadow-md shadow-primary/10 ring-1 ring-primary/20'
                      : 'border-border/70 hover:border-primary/25 hover:shadow-sm'
                  }`}
                >
                  <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-primary/40 to-transparent opacity-0 transition group-hover:opacity-100" />
                  <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                    <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                      <div className="flex shrink-0 flex-col gap-1">
                        <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                          Default
                        </span>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={isDefault}
                          title={
                            !v.enabled
                              ? 'Enable this row first'
                              : isDefault
                                ? 'Turn off to use first enabled option on the storefront'
                                : 'Show this option’s price on cards and PDP'
                          }
                          disabled={!v.enabled || loading === 'def' || loading === 'defclear'}
                          onClick={() => {
                            if (!v.enabled) return;
                            if (isDefault) void clearDefaultVariation();
                            else void setDefaultVariationRow(v.id);
                          }}
                          className={`relative h-8 w-[3.25rem] shrink-0 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-40 ${
                            isDefault ? 'bg-primary' : 'bg-muted-foreground/30'
                          }`}
                        >
                          <span
                            className={`pointer-events-none absolute top-1 left-1 block h-6 w-6 rounded-full bg-background shadow-md ring-1 ring-border/60 transition-transform duration-200 ease-out ${
                              isDefault ? 'translate-x-[1.35rem]' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="sr-only">{title}</p>
                        <div className="flex flex-wrap gap-1.5">
                          {badges.map((b) => (
                            <span
                              key={`${v.id}-${b.attr}`}
                              className="inline-flex items-center gap-1 rounded-md border border-border/60 bg-muted/50 px-2 py-1 text-xs font-medium text-foreground"
                            >
                              <span className="text-muted-foreground">{b.attr}</span>
                              <span className="text-primary">·</span>
                              <span>{b.label}</span>
                            </span>
                          ))}
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
                          {v.sku?.trim() ? (
                            <p className="font-mono">
                              SKU <span className="text-foreground">{v.sku}</span>
                            </p>
                          ) : null}
                          {v.quantity != null ? (
                            <p>
                              Qty <span className="font-semibold text-foreground">{v.quantity}</span>
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-shrink-0 flex-wrap items-center justify-between gap-3 border-t border-border/40 pt-3 sm:border-t-0 sm:pt-0">
                      <div className="text-right sm:text-right">
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Price</p>
                        <p className="text-xl font-bold tabular-nums tracking-tight text-foreground">
                          {formatCurrency(v.price)}
                        </p>
                        {compareLine ? (
                          <p className="text-xs text-muted-foreground line-through">{compareLine}</p>
                        ) : null}
                      </div>
                      <div className="flex items-center gap-3">
                        <label className="flex cursor-pointer items-center gap-2 rounded-md border border-border/60 bg-background/50 px-2 py-1.5 text-xs font-medium">
                          <input
                            type="checkbox"
                            className="size-4 rounded border-input accent-primary"
                            checked={v.enabled}
                            onChange={(e) => {
                              const c = e.target.checked;
                              setVariations((prev) =>
                                prev.map((row, i) => (i === vi ? { ...row, enabled: c } : row))
                              );
                            }}
                          />
                          Active
                        </label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs"
                          onClick={() =>
                            setExpandedVar((s) => ({
                              ...s,
                              [vi]: !s[vi],
                            }))
                          }
                        >
                          {open ? 'Collapse' : 'Edit details'}
                        </Button>
                      </div>
                    </div>
                  </div>
                  {open && (
                    <div className="border-t border-border/50 bg-muted/20 px-4 py-4">
                      <p className="mb-3 text-xs font-medium text-muted-foreground">
                        Adjust combination, SKU, quantity, and pricing — then save all variations below.
                      </p>
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {variationAttrKeys.map((at) => (
                          <div key={at.attr_key}>
                            <label className="text-xs font-medium text-muted-foreground">{at.name}</label>
                            <select
                              value={getComboValue(v.combination, at.attr_key)}
                              onChange={(e) => {
                                const val = e.target.value;
                                setVariations((prev) =>
                                  prev.map((row, i) =>
                                    i === vi
                                      ? {
                                          ...row,
                                          combination: {
                                            ...row.combination,
                                            [at.attr_key]: val,
                                          },
                                        }
                                      : row
                                  )
                                );
                              }}
                              className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                            >
                              {at.values
                                .slice()
                                .sort((x, y) => x.sort_order - y.sort_order)
                                .map((opt) => (
                                  <option key={opt.value_key} value={opt.value_key}>
                                    {opt.label}
                                  </option>
                                ))}
                            </select>
                          </div>
                        ))}
                        <div>
                          <label className="text-xs font-medium text-muted-foreground">SKU</label>
                          <input
                            value={v.sku ?? ''}
                            onChange={(e) => {
                              const t = e.target.value;
                              setVariations((prev) =>
                                prev.map((row, i) =>
                                  i === vi ? { ...row, sku: t.trim() ? t : null } : row
                                )
                              );
                            }}
                            className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-muted-foreground">Quantity</label>
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={v.quantity ?? ''}
                            onChange={(e) => {
                              const raw = e.target.value;
                              setVariations((prev) =>
                                prev.map((row, i) => {
                                  if (i !== vi) return row;
                                  if (raw === '') return { ...row, quantity: null };
                                  const n = Number(raw);
                                  return {
                                    ...row,
                                    quantity: Number.isFinite(n) ? Math.max(0, Math.floor(n)) : null,
                                  };
                                })
                              );
                            }}
                            className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm tabular-nums"
                            placeholder="Leave empty for unlimited"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-muted-foreground">Price</label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={v.price}
                            onChange={(e) => {
                              const n = parseFloat(e.target.value);
                              setVariations((prev) =>
                                prev.map((row, i) =>
                                  i === vi ? { ...row, price: Number.isFinite(n) ? n : 0 } : row
                                )
                              );
                            }}
                            className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm tabular-nums"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-muted-foreground">Compare at (optional)</label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={v.compare_at_price ?? ''}
                            onChange={(e) => {
                              const raw = e.target.value;
                              setVariations((prev) =>
                                prev.map((row, i) => {
                                  if (i !== vi) return row;
                                  if (raw === '') return { ...row, compare_at_price: null };
                                  const n = parseFloat(raw);
                                  return { ...row, compare_at_price: Number.isFinite(n) ? n : null };
                                })
                              );
                            }}
                            className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm tabular-nums"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
        {variationAttrKeys.length > 0 && variations.length > 0 ? (
          <div className="flex flex-wrap items-center gap-3 border-t border-border/50 pt-4">
            <Button type="button" onClick={saveVariations} isLoading={loading === 'var'}>
              Save variations
            </Button>
            <span className="text-xs text-muted-foreground">
              Saves SKU, quantity, prices, enabled state, and combination edits for every row.
            </span>
          </div>
        ) : null}
        </div>
      </AdminAccordionSection>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {ok && (
        <Alert>
          <AlertDescription>{ok}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
