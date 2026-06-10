'use client';

import { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { SocialLink } from '@/lib/api/storeSettings';
import type { Product, ProductCatalogAttribute } from '@/types/product';
import { formatCurrency, splitCurrencyDisplay } from '@/lib/utils/format';
import { AddToCartButton } from './AddToCartButton';
import { ProductSocialContactStrip } from './ProductSocialContactStrip';

const purchaseCardClass =
  'overflow-hidden rounded-2xl border border-border/55 bg-gradient-to-b from-card via-card to-muted/25 shadow-[0_20px_40px_-20px_hsl(var(--foreground)/0.15)] ring-1 ring-foreground/[0.03] dark:from-card dark:via-card dark:to-muted/20 dark:shadow-[0_24px_48px_-24px_hsl(0_0%_0%/0.5)] dark:ring-white/[0.05]';

const LOCK_QTY_ONE_TYPES = new Set<Product['product_type']>([
  'downloadable',
  'subscription_manual',
  'digital_service',
]);

function storefrontVars(product: Product) {
  return (product.purchase_variables ?? []).filter((v) => v.enabled !== false);
}

function initialSelections(product: Product): Record<string, string> {
  const out: Record<string, string> = {};
  for (const v of storefrontVars(product)) {
    if (v.kind === 'select' && v.options?.length) {
      // Start empty so shoppers must choose; validated before add.
      out[v.var_key] = '';
    }
  }
  return out;
}

function previewPrice(product: Product, selections: Record<string, string>): number {
  let p = product.price;
  for (const v of storefrontVars(product)) {
    if (v.kind !== 'select') continue;
    const key = selections[v.var_key];
    const opt = v.options?.find((o) => o.option_key === key);
    if (opt) p += opt.price_adjustment;
  }
  return Math.round(p * 100) / 100;
}

function variationDimensions(product: Product) {
  return (product.catalog_attributes ?? [])
    .filter((a) => a.used_for_variations && a.kind === 'select')
    .sort((a, b) => a.sort_order - b.sort_order);
}

/** API/JSON may return non-string combination values; selects always use strings. */
function normSelectionValue(v: unknown): string {
  if (v == null) return '';
  return String(v).trim();
}

/** Match API combination keys to attribute keys (case / normalization). */
function getComboValue(combo: Record<string, unknown>, attrKey: string): string {
  const raw =
    combo[attrKey] != null && combo[attrKey] !== ''
      ? combo[attrKey]
      : (() => {
          const lk = attrKey.toLowerCase();
          const key = Object.keys(combo).find((k) => k.toLowerCase() === lk);
          return key != null ? combo[key] : '';
        })();
  return normSelectionValue(raw);
}

function matchVariation(product: Product, choice: Record<string, string>) {
  const vars = product.catalog_variations ?? [];
  const dims = variationDimensions(product);
  if (vars.length === 0) return undefined;
  // No variation axes on the PDP (misconfigured catalog or single implicit row): still must send a variation id.
  if (dims.length === 0) {
    if (vars.length === 1) return vars[0];
    const defId = product.default_variation_id;
    if (defId != null) {
      const byDef = vars.find((v) => Number(v.id) === Number(defId));
      if (byDef) return byDef;
    }
    return vars[0];
  }
  const comboRecord = (v: (typeof vars)[0]) =>
    v.combination as Record<string, unknown>;
  return vars.find((v) =>
    dims.every(
      (d) =>
        getComboValue(comboRecord(v), d.attr_key) === normSelectionValue(choice[d.attr_key])
    )
  );
}

function initialVariationChoice(product: Product): Record<string, string> {
  const dims = variationDimensions(product);
  const vars = product.catalog_variations ?? [];
  if (dims.length === 0 || vars.length === 0) return {};
  let def = vars[0];
  const defVid = product.default_variation_id;
  if (defVid != null) {
    const row = vars.find((v) => Number(v.id) === Number(defVid));
    if (row) def = row;
  }
  const out: Record<string, string> = {};
  for (const d of dims) {
    const fromCombo = getComboValue(def.combination as Record<string, unknown>, d.attr_key);
    out[d.attr_key] = fromCombo || d.values[0]?.value_key || '';
  }
  return out;
}

function extraCatalogFields(product: Product) {
  return (product.catalog_attributes ?? [])
    .filter((a) => !a.used_for_variations && (a.kind === 'email' || a.kind === 'text'))
    .sort((a, b) => a.sort_order - b.sort_order);
}

const formFieldClass =
  'flex h-11 w-full rounded-lg border border-border/70 bg-background/80 px-3.5 py-2 text-sm text-foreground shadow-sm transition-[border-color,box-shadow] placeholder:text-muted-foreground/65 hover:border-border focus-visible:border-primary/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 dark:bg-muted/30';

const formControlClass = `mt-2 ${formFieldClass}`;

export interface ProductPurchasePanelProps {
  product: Product;
  imageUrl: string | null;
  initialVariationId?: number;
  renewHint?: boolean;
  socialLinks?: SocialLink[];
  supportNumber?: string;
  /** Specs visible on PDP (non-variation attributes); rendered inside the price card. */
  displayAttributes?: ProductCatalogAttribute[];
}

export function ProductPurchasePanel({
  product,
  imageUrl,
  initialVariationId,
  renewHint = false,
  socialLinks = [],
  supportNumber = '',
  displayAttributes = [],
}: ProductPurchasePanelProps) {
  const router = useRouter();
  const hasVariations = (product.catalog_variations?.length ?? 0) > 0;
  const vars = storefrontVars(product);
  const [selections, setSelections] = useState<Record<string, string>>(() => initialSelections(product));
  const [emails, setEmails] = useState<Record<string, string>>(() => {
    const o: Record<string, string> = {};
    for (const v of storefrontVars(product)) {
      if (v.kind === 'email') o[v.var_key] = '';
    }
    return o;
  });

  const [variationChoice, setVariationChoice] = useState<Record<string, string>>(() =>
    initialVariationChoice(product)
  );
  const [extras, setExtras] = useState<Record<string, string>>(() => {
    const o: Record<string, string> = {};
    for (const a of extraCatalogFields(product)) {
      o[a.attr_key] = '';
    }
    return o;
  });

  const [qty, setQty] = useState(1);

  const catalogExtraFieldsSig = useMemo(
    () =>
      extraCatalogFields(product)
        .map((a) => `${a.attr_key}:${a.kind}`)
        .join('|'),
    [product.catalog_attributes]
  );

  useEffect(() => {
    setVariationChoice(initialVariationChoice(product));
  }, [product.id, product.default_variation_id, product.catalog_variations, product.catalog_attributes]);

  useEffect(() => {
    setExtras((prev) => {
      const next: Record<string, string> = {};
      for (const a of extraCatalogFields(product)) {
        const k = a.attr_key;
        next[k] = prev[k] ?? '';
      }
      return next;
    });
  }, [product.id, catalogExtraFieldsSig]);

  const matchedVariation = useMemo(
    () => (hasVariations ? matchVariation(product, variationChoice) : undefined),
    [product, hasVariations, variationChoice]
  );

  const cartVariationId = useMemo(() => {
    if (!hasVariations || matchedVariation == null) return undefined;
    const n = Number(matchedVariation.id);
    return Number.isFinite(n) && n >= 1 ? n : undefined;
  }, [hasVariations, matchedVariation]);

  const displayPrice = useMemo(() => {
    if (hasVariations && matchedVariation) return matchedVariation.price;
    if (hasVariations) return product.price;
    return previewPrice(product, selections);
  }, [hasVariations, matchedVariation, product, selections]);

  const baseHasCompare = product.compare_at_price != null && product.compare_at_price > product.price;
  const displayParts = splitCurrencyDisplay(displayPrice);
  const variationCompare =
    hasVariations && matchedVariation?.compare_at_price != null && matchedVariation.compare_at_price > displayPrice
      ? matchedVariation.compare_at_price
      : null;
  const compareParts =
    variationCompare != null
      ? splitCurrencyDisplay(variationCompare)
      : baseHasCompare && !hasVariations && vars.length === 0
        ? splitCurrencyDisplay(product.compare_at_price!)
        : null;
  const savePercent =
    compareParts != null
      ? variationCompare != null && variationCompare > 0
        ? Math.max(0, Math.round((1 - displayPrice / variationCompare) * 100))
        : baseHasCompare && !hasVariations && vars.length === 0 && product.compare_at_price! > 0
          ? Math.max(0, Math.round((1 - product.price / product.compare_at_price!) * 100))
          : 0
      : 0;

  const productQuantity = useMemo(
    () => (product.quantity != null ? Math.max(0, Number(product.quantity)) : null),
    [product.quantity]
  );
  const displaySku = useMemo(() => {
    if (hasVariations) {
      const variationSku = matchedVariation?.sku?.trim();
      return variationSku || null;
    }
    const baseSku = product.sku?.trim();
    return baseSku || null;
  }, [hasVariations, matchedVariation?.sku, product.sku]);

  const maxQty = useMemo(() => {
    if (matchedVariation?.quantity != null) {
      return Math.max(0, Number(matchedVariation.quantity));
    }
    if (productQuantity != null) return productQuantity;
    if (LOCK_QTY_ONE_TYPES.has(product.product_type)) return 1;
    if (product.product_type === 'license_key' && product.license_available_count != null) {
      return Math.max(0, product.license_available_count);
    }
    return 99;
  }, [
    matchedVariation?.quantity,
    productQuantity,
    product.product_type,
    product.license_available_count,
  ]);

  useEffect(() => {
    const cap =
      matchedVariation?.quantity != null ? matchedVariation.quantity : productQuantity;
    if (cap == null || cap < 1) return;
    setQty((q) => Math.min(q, cap));
  }, [matchedVariation?.id, matchedVariation?.quantity, productQuantity]);

  const dims = variationDimensions(product);
  const extraFieldMeta = extraCatalogFields(product);

  const formRef = useRef<HTMLFormElement>(null);

  const purchaseFieldsSorted = useMemo(
    () => [...vars].sort((a, b) => a.sort_order - b.sort_order),
    [vars]
  );

  const pvEmailSlotByVarKey = useMemo(() => {
    const m = new Map<string, number>();
    let n = 0;
    for (const v of purchaseFieldsSorted) {
      if (v.kind === 'email') m.set(v.var_key, n++);
    }
    return m;
  }, [purchaseFieldsSorted]);

  /** Prefer live DOM values so browser autofill / IME still reach the cart API. */
  const buildSelectionsSnapshot = useCallback((): Record<string, string> => {
    const form = formRef.current;
    const catalogDom = (i: number) =>
      (form?.querySelector(`[data-pdp-catalog-extra="${i}"]`) as HTMLInputElement | null)?.value?.trim() ?? '';
    const pvEmailDom = (slot: number) =>
      (form?.querySelector(`[data-pdp-pv-email="${slot}"]`) as HTMLInputElement | null)?.value?.trim() ?? '';

    if (hasVariations) {
      const out: Record<string, string> = {};
      for (const v of vars) {
        if (v.kind === 'email') {
          const t = (emails[v.var_key] ?? '').trim();
          if (t) out[v.var_key] = t;
        }
      }
      extraFieldMeta.forEach((a, i) => {
        const k = a.attr_key.trim();
        const merged = catalogDom(i) || (extras[a.attr_key] ?? '').trim();
        if (merged) out[k] = merged;
      });
      return out;
    }
    const m = { ...selections };
    for (const v of vars) {
      if (v.kind === 'email') {
        const slot = pvEmailSlotByVarKey.get(v.var_key);
        const fromDom = slot != null ? pvEmailDom(slot) : '';
        const fromState = (emails[v.var_key] ?? '').trim();
        const t = fromDom || fromState;
        if (t) m[v.var_key] = t;
      }
    }
    return m;
  }, [hasVariations, vars, emails, selections, extras, extraFieldMeta, pvEmailSlotByVarKey]);

  const validateBeforeAdd = (): string | null => {
    const snap = buildSelectionsSnapshot();
    if (hasVariations) {
      for (const d of dims) {
        if (!normSelectionValue(variationChoice[d.attr_key])) {
          return `${d.name} is required`;
        }
      }
      if (!matchedVariation) return 'Please select a valid combination';
      if (matchedVariation.quantity != null && matchedVariation.quantity < 1) {
        return 'This option is sold out';
      }
      const vid = Number(matchedVariation.id);
      if (!Number.isFinite(vid) || vid < 1) return 'Please select a valid combination';
      for (const a of extraFieldMeta) {
        const k = a.attr_key.trim();
        const t = (snap[k] ?? '').trim();
        if (!t) return `${a.name} is required`;
        if (a.kind === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t)) {
          return `Enter a valid ${a.name}`;
        }
      }
      return null;
    }
    for (const v of vars) {
      if (v.kind === 'email') {
        const t = (snap[v.var_key] ?? '').trim();
        if (!t) return `${v.label} is required`;
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t)) return `Enter a valid ${v.label}`;
      } else if (v.kind === 'select') {
        const key = (selections[v.var_key] ?? '').trim();
        if (!key) return `${v.label} is required`;
        const opt = v.options?.find((o) => o.option_key === key);
        if (!opt) return `Choose a valid option for ${v.label}`;
      }
    }
    return null;
  };

  return (
    <div className="flex flex-col gap-3">
      <div className={purchaseCardClass}>
        <div className="space-y-3 p-5 md:p-6">
          {renewHint ? (
            <div
              role="status"
              className="rounded-lg border border-amber-500/35 bg-amber-500/10 px-3 py-2 text-sm text-amber-950 dark:border-amber-400/25 dark:bg-amber-400/10 dark:text-amber-100"
            >
              You are renewing this product. Options below match your last purchase where possible; confirm
              duration and details, then add to cart.
            </div>
          ) : null}
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Your price</p>
          <div className="flex flex-wrap items-end gap-x-4 gap-y-2">
            <span className="inline-flex items-baseline gap-1.5 text-3xl font-bold tracking-tight text-foreground md:text-[2.35rem]">
              <span className="text-[1.65rem] font-semibold leading-none text-primary md:text-[2rem]" aria-hidden>
                {displayParts.symbol}
              </span>
              <span className="tabular-nums leading-none">{displayParts.amount}</span>
              <span className="sr-only">BDT</span>
            </span>
            <div className="flex flex-wrap items-center gap-2">
              {compareParts ? (
                <span
                  className="inline-flex items-baseline gap-1 text-base font-medium text-muted-foreground/8 line-through decoration-muted-foreground/55 [text-decoration-thickness:1px] md:text-lg"
                  aria-label={`Was ${compareParts.symbol}${compareParts.amount}`}
                >
                  <span className="font-normal leading-none opacity-75" aria-hidden>
                    {compareParts.symbol}
                  </span>
                  <span className="tabular-nums">{compareParts.amount}</span>
                </span>
              ) : null}
              {savePercent > 0 ? (
                <span className="inline-flex items-center rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300">
                  Save {savePercent}%
                </span>
              ) : null}
            </div>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            {displaySku ? (
              <p>
                SKU: <span className="font-mono text-foreground/90">{displaySku}</span>
              </p>
            ) : null}
            {productQuantity != null && !hasVariations && !matchedVariation?.sku?.trim() ? (
              <p>
                Available Stock:{' '}
                <span className="font-semibold tabular-nums text-foreground/90">{productQuantity}</span>
              </p>
            ) : null}
            {hasVariations && matchedVariation && matchedVariation.quantity != null ? (
              <p>
                Available Stock:{' '}
                <span className="font-semibold tabular-nums text-foreground/90">{matchedVariation.quantity}</span>
              </p>
            ) : hasVariations && matchedVariation?.sku?.trim() ? (
              <p>
                Variation SKU:{' '}
                <span className="font-mono text-[0.8rem] text-foreground/90">{matchedVariation.sku}</span>
              </p>
            ) : null}
          </div>

          {displayAttributes.length > 0 ? (
            <div className="border-t border-border/50 pt-4">
              <h3 className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Details
              </h3>
              <dl className="space-y-0 divide-y divide-border/40">
                {displayAttributes
                  .slice()
                  .sort((a, b) => a.sort_order - b.sort_order)
                  .map((a) => (
                    <div
                      key={a.attr_key}
                      className="grid gap-0.5 py-2.5 first:pt-0 sm:grid-cols-[minmax(0,0.95fr)_minmax(0,1.25fr)] sm:gap-4 sm:py-2.5"
                    >
                      <dt className="text-xs font-medium text-muted-foreground">{a.name}</dt>
                      <dd className="text-xs leading-snug text-foreground sm:text-sm">
                        {a.values
                          .slice()
                          .sort((x, y) => x.sort_order - y.sort_order)
                          .map((v) => v.label)
                          .join(', ')}
                      </dd>
                    </div>
                  ))}
              </dl>
            </div>
          ) : null}
        </div>

        <form
          ref={formRef}
          className="space-y-5 border-t border-border/50 px-5 pb-5 pt-5 md:px-6 md:pb-6 md:pt-6"
          noValidate
          onSubmit={(e) => e.preventDefault()}
        >
      {hasVariations && (dims.length > 0 || extraFieldMeta.length > 0) && (
        <div className="space-y-5 rounded-xl border border-border/50 bg-muted/25 p-5 dark:bg-muted/15">
          {dims.map((a) => {
            const opts = a.values.slice().sort((x, y) => x.sort_order - y.sort_order);
            return (
              <div key={a.attr_key}>
                <label className="text-sm font-medium text-foreground">
                  {a.name}
                  <span className="text-destructive"> *</span>
                </label>
                <select
                  value={variationChoice[a.attr_key] ?? ''}
                  onChange={(e) =>
                    setVariationChoice((prev) => ({
                      ...prev,
                      [a.attr_key]: e.target.value,
                    }))
                  }
                  className={formControlClass}
                  required
                >
                  {opts.map((o) => (
                    <option key={o.value_key} value={o.value_key}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
            );
          })}
          {extraFieldMeta.map((a, i) => (
            <div key={a.attr_key}>
              <label className="text-sm font-medium text-foreground">
                {a.name}
                <span className="text-destructive"> *</span>
              </label>
              {a.kind === 'email' ? (
                <input
                  type="email"
                  autoComplete="email"
                  data-pdp-catalog-extra={i}
                  value={extras[a.attr_key] ?? ''}
                  onChange={(e) => {
                    const val = e.currentTarget?.value ?? '';
                    setExtras((prev) => ({ ...prev, [a.attr_key]: val }));
                  }}
                  onInput={(e) => {
                    const val = e.currentTarget?.value ?? '';
                    setExtras((prev) => ({ ...prev, [a.attr_key]: val }));
                  }}
                  placeholder="Required"
                  className={formControlClass}
                  required
                />
              ) : (
                <input
                  type="text"
                  data-pdp-catalog-extra={i}
                  value={extras[a.attr_key] ?? ''}
                  onChange={(e) => {
                    const val = e.currentTarget?.value ?? '';
                    setExtras((prev) => ({ ...prev, [a.attr_key]: val }));
                  }}
                  onInput={(e) => {
                    const val = e.currentTarget?.value ?? '';
                    setExtras((prev) => ({ ...prev, [a.attr_key]: val }));
                  }}
                  placeholder="Required"
                  className={formControlClass}
                  required
                />
              )}
            </div>
          ))}
        </div>
      )}

      {!hasVariations && vars.length > 0 && (
        <div className="space-y-5 rounded-xl border border-border/50 bg-muted/25 p-5 dark:bg-muted/15">
          {purchaseFieldsSorted.map((v) => {
              if (v.kind === 'email') {
                const slot = pvEmailSlotByVarKey.get(v.var_key) ?? 0;
                return (
                  <div key={v.var_key}>
                    <label className="text-sm font-medium text-foreground">
                      {v.label}
                      <span className="text-destructive"> *</span>
                    </label>
                    <input
                      type="email"
                      autoComplete="email"
                      data-pdp-pv-email={slot}
                      value={emails[v.var_key] ?? ''}
                      onChange={(e) => {
                        const val = e.currentTarget?.value ?? '';
                        setEmails((prev) => ({ ...prev, [v.var_key]: val }));
                      }}
                      onInput={(e) => {
                        const val = e.currentTarget?.value ?? '';
                        setEmails((prev) => ({ ...prev, [v.var_key]: val }));
                      }}
                      placeholder="Required"
                      className={formControlClass}
                      required
                    />
                  </div>
                );
              }
              const opts = (v.options ?? []).slice().sort((a, b) => a.sort_order - b.sort_order);
              return (
                <div key={v.var_key}>
                  <label className="text-sm font-medium text-foreground">
                    {v.label}
                    <span className="text-destructive"> *</span>
                  </label>
                  <select
                    value={selections[v.var_key] ?? ''}
                    onChange={(e) =>
                      setSelections((prev) => ({
                        ...prev,
                        [v.var_key]: e.target.value,
                      }))
                    }
                    className="mt-1.5 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    required
                  >
                    <option value="">Choose…</option>
                    {opts.map((o) => (
                      <option key={o.option_key} value={o.option_key}>
                        {o.label}
                        {o.price_adjustment !== 0
                          ? ` (${o.price_adjustment > 0 ? '+' : ''}${formatCurrency(o.price_adjustment)})`
                          : ''}
                      </option>
                    ))}
                  </select>
                </div>
              );
            })}
        </div>
      )}

      {maxQty > 1 && (
        <div className="flex max-w-md flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground">Quantity</label>
          <input
            type="number"
            min={1}
            max={maxQty}
            step={1}
            value={qty}
            onChange={(e) => {
              const n = parseInt(e.target.value, 10);
              if (!Number.isFinite(n)) return;
              setQty(Math.min(maxQty, Math.max(1, n)));
            }}
            className={`mt-1.5 ${formFieldClass} w-32 tabular-nums`}
          />
          {product.product_type === 'license_key' && product.license_available_count != null ? (
            <p className="text-xs text-muted-foreground">Up to {product.license_available_count} in stock.</p>
          ) : matchedVariation?.quantity != null ? (
            <p className="text-xs text-muted-foreground">Up to {matchedVariation.quantity} available.</p>
          ) : productQuantity != null ? (
            <p className="text-xs text-muted-foreground">Up to {productQuantity} available.</p>
          ) : null}
        </div>
      )}

      <div className="grid gap-2 pt-1 sm:grid-cols-2">
        <AddToCartButton
          productId={product.id}
          quantity={maxQty > 1 ? qty : 1}
          variant="outline"
          size="lg"
          className="w-full border-primary/45 bg-background text-foreground shadow-sm hover:bg-primary/10 hover:text-foreground"
          getSelections={buildSelectionsSnapshot}
          variationId={cartVariationId}
          validateBeforeAdd={validateBeforeAdd}
          resumeAfterLoginRedirect="/cart"
          disabled={maxQty < 1}
          productSummary={{
            name: product.name,
            imageUrl,
          }}
        >
          {maxQty < 1 ? 'Sold out' : 'Add to cart'}
        </AddToCartButton>
        <AddToCartButton
          productId={product.id}
          quantity={maxQty > 1 ? qty : 1}
          size="lg"
          className="w-full shadow-md shadow-primary/10 transition-[transform,box-shadow] hover:shadow-lg hover:shadow-primary/15 active:scale-[0.99]"
          getSelections={buildSelectionsSnapshot}
          variationId={cartVariationId}
          validateBeforeAdd={validateBeforeAdd}
          resumeAfterLoginRedirect="/checkout"
          guestCheckoutOnUnauthorized
          placeOrderAfterGuestCheckout
          disabled={maxQty < 1}
          onAdded={() => {
            router.push('/checkout');
          }}
        >
          {maxQty < 1 ? 'Sold out' : 'Order now'}
        </AddToCartButton>
      </div>
        </form>
      </div>

      <ProductSocialContactStrip links={socialLinks} supportNumber={supportNumber} />
    </div>
  );
}
