'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import type { CartItem } from '@/types/cart';
import type { Product, ProductCatalogAttribute } from '@/types/product';
import { fetchProductBySlug } from '@/lib/api/products';
import { formatCurrency, splitCurrencyDisplay } from '@/lib/utils/format';
import { getProductImageUrl } from '@/lib/imageUrl';
import { Button } from '@/components/ui';
import { X, Check, Loader2 } from 'lucide-react';

export interface EditVariationModalProps {
  open: boolean;
  onClose: () => void;
  item: CartItem | null;
  onSave: (data: {
    itemId: number;
    variationId?: number | null;
    selections: Record<string, string>;
    selectionsSummary: Array<{ label: string; value: string }>;
    unitPrice: number;
    maxQuantity: number;
    quantity: number;
    productThumbnail?: string | null;
  }) => Promise<void>;
}

function storefrontVars(product: Product) {
  return (product.purchase_variables ?? []).filter((v) => v.enabled !== false);
}

function variationDimensions(product: Product): ProductCatalogAttribute[] {
  return (product.catalog_attributes ?? [])
    .filter((a) => a.used_for_variations && a.kind === 'select')
    .sort((a, b) => a.sort_order - b.sort_order);
}

function extraCatalogFields(product: Product): ProductCatalogAttribute[] {
  return (product.catalog_attributes ?? [])
    .filter((a) => !a.used_for_variations && (a.kind === 'email' || a.kind === 'text'))
    .sort((a, b) => a.sort_order - b.sort_order);
}

function normSelectionValue(v: unknown): string {
  if (v == null) return '';
  return String(v).trim();
}

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

function isOptionOutOfStock(
  product: Product,
  attrKey: string,
  valueKey: string,
  currentChoice: Record<string, string>,
  dimIndex: number
): boolean {
  const vars = product.catalog_variations ?? [];
  if (vars.length === 0) return false;

  if (dimIndex === 0) {
    const matchingVars = vars.filter((v) => {
      const combo = v.combination as Record<string, unknown>;
      return getComboValue(combo, attrKey) === valueKey;
    });
    if (matchingVars.length === 0) return true;
    return matchingVars.every(
      (v) => v.enabled === false || (v.quantity !== null && v.quantity !== undefined && v.quantity <= 0)
    );
  }

  const testChoice = { ...currentChoice, [attrKey]: valueKey };
  const matched = matchVariation(product, testChoice);
  if (matched) {
    if (matched.enabled === false) return true;
    if (matched.quantity !== null && matched.quantity !== undefined && matched.quantity <= 0) return true;
    return false;
  }

  const matchingVars = vars.filter((v) => {
    const combo = v.combination as Record<string, unknown>;
    return getComboValue(combo, attrKey) === valueKey;
  });

  if (matchingVars.length === 0) return true;
  return matchingVars.every(
    (v) => v.enabled === false || (v.quantity !== null && v.quantity !== undefined && v.quantity <= 0)
  );
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

const formFieldClass =
  'flex h-10 w-full rounded-lg border border-border/70 bg-background/80 px-3.5 py-2 text-sm text-foreground shadow-sm transition-[border-color,box-shadow] placeholder:text-muted-foreground/65 hover:border-border focus-visible:border-primary/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 dark:bg-muted/30';

export function EditVariationModal({
  open,
  onClose,
  item,
  onSave,
}: EditVariationModalProps) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [variationChoice, setVariationChoice] = useState<Record<string, string>>({});
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [emails, setEmails] = useState<Record<string, string>>({});
  const [extras, setExtras] = useState<Record<string, string>>({});
  const [qty, setQty] = useState(1);
  const [validationError, setValidationError] = useState<string | null>(null);

  const formRef = useRef<HTMLFormElement>(null);

  // Load product when opened
  useEffect(() => {
    if (!open || !item) {
      setProduct(null);
      setError(null);
      setValidationError(null);
      return;
    }

    let isCancelled = false;
    setLoading(true);
    setError(null);
    setValidationError(null);

    fetchProductBySlug(item.product_slug)
      .then((p) => {
        if (isCancelled) return;
        setProduct(p);

        const dims = variationDimensions(p);
        const vars = p.catalog_variations ?? [];
        const choice: Record<string, string> = {};

        // Find existing variation row if variation ID is stored
        let currentVar = item.product_variation_id
          ? vars.find((v) => Number(v.id) === Number(item.product_variation_id))
          : undefined;

        if (!currentVar && vars.length > 0) {
          currentVar = vars.find(
            (v) =>
              Number(v.id) === Number(p.default_variation_id) &&
              v.enabled !== false &&
              (v.quantity === null || v.quantity === undefined || v.quantity > 0)
          ) || vars[0];
        }

        for (const d of dims) {
          if (currentVar) {
            choice[d.attr_key] = getComboValue(currentVar.combination as Record<string, unknown>, d.attr_key);
          }
          if (!choice[d.attr_key] && item.selections?.[d.attr_key]) {
            choice[d.attr_key] = item.selections[d.attr_key];
          }
          if (!choice[d.attr_key] && d.values[0]?.value_key) {
            choice[d.attr_key] = d.values[0].value_key;
          }
        }
        setVariationChoice(choice);

        // Purchase variables
        const sel: Record<string, string> = {};
        const em: Record<string, string> = {};
        for (const v of storefrontVars(p)) {
          if (v.kind === 'email') {
            em[v.var_key] = item.selections?.[v.var_key] ?? '';
          } else {
            sel[v.var_key] = item.selections?.[v.var_key] ?? '';
          }
        }
        setSelections(sel);
        setEmails(em);

        // Catalog extra text/email fields
        const ext: Record<string, string> = {};
        for (const a of extraCatalogFields(p)) {
          ext[a.attr_key] = item.selections?.[a.attr_key] ?? '';
        }
        setExtras(ext);

        setQty(Math.max(1, item.quantity));
      })
      .catch((err) => {
        if (!isCancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load product details');
        }
      })
      .finally(() => {
        if (!isCancelled) setLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [open, item]);

  // Handle ESC key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !saving) onClose();
    };
    if (open) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [open, saving, onClose]);

  const hasVariations = (product?.catalog_variations?.length ?? 0) > 0;
  const dims = product ? variationDimensions(product) : [];
  const extraFieldMeta = product ? extraCatalogFields(product) : [];
  const vars = product ? storefrontVars(product) : [];

  const matchedVariation = useMemo(() => {
    if (!product || !hasVariations) return undefined;
    return matchVariation(product, variationChoice);
  }, [product, hasVariations, variationChoice]);

  const displayPrice = useMemo(() => {
    if (!product) return item?.unit_price ?? 0;
    if (hasVariations && matchedVariation) return matchedVariation.price;
    if (hasVariations) return product.price;
    return previewPrice(product, selections);
  }, [product, hasVariations, matchedVariation, selections, item]);

  const displayParts = splitCurrencyDisplay(displayPrice);

  const variationCompare =
    hasVariations && matchedVariation?.compare_at_price != null && matchedVariation.compare_at_price > displayPrice
      ? matchedVariation.compare_at_price
      : null;

  const baseHasCompare = product && product.compare_at_price != null && product.compare_at_price > product.price;

  const compareParts =
    variationCompare != null
      ? splitCurrencyDisplay(variationCompare)
      : baseHasCompare && !hasVariations && vars.length === 0
        ? splitCurrencyDisplay(product!.compare_at_price!)
        : null;

  const savePercent =
    compareParts != null
      ? variationCompare != null && variationCompare > 0
        ? Math.max(0, Math.round((1 - displayPrice / variationCompare) * 100))
        : baseHasCompare && !hasVariations && vars.length === 0 && product!.compare_at_price! > 0
          ? Math.max(0, Math.round((1 - product!.price / product!.compare_at_price!) * 100))
          : 0
      : 0;

  const productQuantity = useMemo(
    () => (product?.quantity != null ? Math.max(0, Number(product.quantity)) : null),
    [product?.quantity]
  );

  const displaySku = useMemo(() => {
    if (hasVariations) {
      return matchedVariation?.sku?.trim() || null;
    }
    return product?.sku?.trim() || null;
  }, [hasVariations, matchedVariation?.sku, product?.sku]);

  const maxQty = useMemo(() => {
    if (matchedVariation?.quantity != null) {
      return Math.max(0, Number(matchedVariation.quantity));
    }
    if (productQuantity != null) return productQuantity;
    if (product?.product_type === 'license_key' && product.license_available_count != null) {
      return Math.max(0, product.license_available_count);
    }
    return 99;
  }, [matchedVariation?.quantity, productQuantity, product]);

  useEffect(() => {
    if (maxQty > 0 && qty > maxQty) {
      setQty(maxQty);
    }
  }, [maxQty, qty]);

  const buildSelectionsSnapshot = useCallback((): Record<string, string> => {
    if (!product) return {};
    if (hasVariations) {
      const out: Record<string, string> = {};
      for (const v of vars) {
        if (v.kind === 'email') {
          const t = (emails[v.var_key] ?? '').trim();
          if (t) out[v.var_key] = t;
        }
      }
      extraFieldMeta.forEach((a) => {
        const k = a.attr_key.trim();
        const merged = (extras[a.attr_key] ?? '').trim();
        if (merged) out[k] = merged;
      });
      return out;
    }
    const m = { ...selections };
    for (const v of vars) {
      if (v.kind === 'email') {
        const t = (emails[v.var_key] ?? '').trim();
        if (t) m[v.var_key] = t;
      }
    }
    return m;
  }, [product, hasVariations, vars, emails, extraFieldMeta, extras, selections]);

  const buildSelectionsSummary = useCallback((): Array<{ label: string; value: string }> => {
    if (!product) return [];
    const summary: Array<{ label: string; value: string }> = [];

    if (hasVariations && matchedVariation) {
      const combo = matchedVariation.combination as Record<string, unknown>;
      for (const d of dims) {
        const valKey = getComboValue(combo, d.attr_key) || variationChoice[d.attr_key];
        const opt = d.values.find((v) => v.value_key === valKey);
        summary.push({
          label: d.name,
          value: opt?.label ?? valKey,
        });
      }
      for (const a of extraFieldMeta) {
        const val = (extras[a.attr_key] ?? '').trim();
        if (val) {
          summary.push({ label: a.name, value: val });
        }
      }
    } else {
      for (const v of vars) {
        if (v.kind === 'email') {
          const t = (emails[v.var_key] ?? '').trim();
          if (t) summary.push({ label: v.label, value: t });
        } else if (v.kind === 'select') {
          const key = selections[v.var_key];
          const opt = v.options?.find((o) => o.option_key === key);
          if (opt) summary.push({ label: v.label, value: opt.label });
        }
      }
    }
    return summary;
  }, [product, hasVariations, matchedVariation, dims, variationChoice, extraFieldMeta, extras, vars, emails, selections]);

  const handleSave = async () => {
    if (!item || !product) return;
    setValidationError(null);

    const snap = buildSelectionsSnapshot();

    if (hasVariations) {
      for (const d of dims) {
        if (!normSelectionValue(variationChoice[d.attr_key])) {
          setValidationError(`Please select ${d.name}`);
          return;
        }
      }
      if (!matchedVariation) {
        setValidationError('Please select a valid combination');
        return;
      }
      if (matchedVariation.quantity != null && matchedVariation.quantity < 1) {
        setValidationError('This option is sold out');
        return;
      }
      for (const a of extraFieldMeta) {
        const k = a.attr_key.trim();
        const t = (snap[k] ?? '').trim();
        if (!t) {
          setValidationError(`${a.name} is required`);
          return;
        }
        if (a.kind === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t)) {
          setValidationError(`Enter a valid email for ${a.name}`);
          return;
        }
      }
    } else {
      for (const v of vars) {
        if (v.kind === 'email') {
          const t = (snap[v.var_key] ?? '').trim();
          if (!t) {
            setValidationError(`${v.label} is required`);
            return;
          }
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t)) {
            setValidationError(`Enter a valid email for ${v.label}`);
            return;
          }
        } else if (v.kind === 'select') {
          const key = (selections[v.var_key] ?? '').trim();
          if (!key) {
            setValidationError(`Please select ${v.label}`);
            return;
          }
        }
      }
    }

    if (maxQty <= 0) {
      setValidationError('This item is currently out of stock');
      return;
    }

    const variationId = hasVariations && matchedVariation ? Number(matchedVariation.id) : null;
    const finalQty = Math.max(1, Math.min(qty, maxQty > 0 ? maxQty : 1));
    const summary = buildSelectionsSummary();

    setSaving(true);
    try {
      await onSave({
        itemId: item.id,
        variationId,
        selections: snap,
        selectionsSummary: summary,
        unitPrice: displayPrice,
        maxQuantity: maxQty,
        quantity: finalQty,
        productThumbnail: product.thumbnail ?? item.product_thumbnail,
      });
      onClose();
    } catch (err) {
      setValidationError(err instanceof Error ? err.message : 'Failed to update item');
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-variation-title"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={() => {
          if (!saving) onClose();
        }}
      />

      {/* Modal Card */}
      <div className="relative z-10 flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border border-border bg-card shadow-2xl sm:max-h-[85vh] sm:rounded-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/80 px-4 py-3.5 sm:px-6">
          <div className="min-w-0 flex-1">
            <h2 id="edit-variation-title" className="text-base font-semibold tracking-tight text-foreground sm:text-lg">
              Edit item
            </h2>
            <p className="truncate text-xs text-muted-foreground sm:text-sm">
              {item?.product_name}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Close"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader2 className="size-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Loading options...</p>
            </div>
          ) : error ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
              {error}
            </div>
          ) : product ? (
            <>
              {/* Product mini header with image, price and SKU */}
              <div className="flex items-start gap-4 rounded-xl border border-border/60 bg-muted/20 p-3.5">
                <img
                  src={getProductImageUrl(product.thumbnail ?? item?.product_thumbnail) ?? '/icon.png'}
                  alt={product.name}
                  className="h-16 w-16 shrink-0 rounded-lg border border-border object-cover"
                />
                <div className="min-w-0 flex-1">
                  <h3 className="line-clamp-1 font-semibold text-foreground text-sm sm:text-base">
                    {product.name}
                  </h3>
                  <div className="mt-1 flex flex-wrap items-baseline gap-2">
                    <span className="text-lg font-bold text-foreground">
                      <span className="text-sm font-semibold text-primary">{displayParts.symbol}</span>
                      {displayParts.amount}
                    </span>
                    {compareParts ? (
                      <span className="text-xs text-muted-foreground line-through">
                        {compareParts.symbol}{compareParts.amount}
                      </span>
                    ) : null}
                    {savePercent > 0 ? (
                      <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        Save {savePercent}%
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                    {displaySku ? (
                      <span>
                        SKU: <span className="font-mono text-foreground">{displaySku}</span>
                      </span>
                    ) : null}
                    {maxQty > 0 ? (
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                        {maxQty <= 5 ? `Only ${maxQty} left in stock` : 'In stock'}
                      </span>
                    ) : (
                      <span className="text-destructive font-medium">Out of stock</span>
                    )}
                  </div>
                </div>
              </div>

              {validationError ? (
                <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-3.5 py-2 text-xs sm:text-sm text-destructive">
                  {validationError}
                </div>
              ) : null}

              {/* Form Options */}
              <form ref={formRef} className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                {/* Catalog Variations (Color, Size, etc.) */}
                {hasVariations && dims.length > 0 && (
                  <div className="space-y-4 rounded-xl border border-border/60 bg-muted/20 p-4">
                    {dims.map((a, dimIndex) => {
                      const opts = a.values.slice().sort((x, y) => x.sort_order - y.sort_order);
                      const isColor =
                        a.attr_key.toLowerCase().includes('color') ||
                        a.name.toLowerCase().includes('color') ||
                        opts.some((o) => !!o.color_code);
                      const selectedVal = variationChoice[a.attr_key] ?? '';
                      const selectedOpt = opts.find((o) => o.value_key === selectedVal);

                      const handleAttributeClick = (valueKey: string) => {
                        let nextChoice = { ...variationChoice, [a.attr_key]: valueKey };

                        if (dimIndex === 0 && dims.length > 1) {
                          const matched = matchVariation(product, nextChoice);
                          const isOutOfStock =
                            !matched ||
                            matched.enabled === false ||
                            (matched.quantity !== null && matched.quantity !== undefined && matched.quantity <= 0);

                          if (isOutOfStock) {
                            const varsList = product.catalog_variations ?? [];
                            const inStockVar = varsList.find((v) => {
                              const combo = v.combination as Record<string, unknown>;
                              return (
                                getComboValue(combo, a.attr_key) === valueKey &&
                                v.enabled !== false &&
                                (v.quantity === null || v.quantity === undefined || v.quantity > 0)
                              );
                            });
                            if (inStockVar) {
                              for (const d of dims) {
                                const val = getComboValue(inStockVar.combination as Record<string, unknown>, d.attr_key);
                                if (val) nextChoice[d.attr_key] = val;
                              }
                            }
                          }
                        }

                        setVariationChoice(nextChoice);
                        setValidationError(null);
                      };

                      return (
                        <div key={a.attr_key} className="space-y-2">
                          <div className="flex items-center justify-between text-xs sm:text-sm">
                            <span className="font-medium text-foreground">
                              {a.name}: <span className="font-semibold text-primary">{selectedOpt?.label || 'Select'}</span>
                              <span className="text-destructive"> *</span>
                            </span>
                          </div>

                          {isColor ? (
                            <div className="flex flex-wrap items-center gap-3 pt-1">
                              {opts.map((o) => {
                                const isSelected = selectedVal === o.value_key;
                                const isOos = isOptionOutOfStock(product, a.attr_key, o.value_key, variationChoice, dimIndex);
                                const hasHex = typeof o.color_code === 'string' && o.color_code.trim().length > 0;
                                const bgStyle: React.CSSProperties | undefined = hasHex ? { backgroundColor: o.color_code! } : undefined;

                                return (
                                  <button
                                    key={o.value_key}
                                    type="button"
                                    disabled={isOos}
                                    onClick={() => {
                                      if (isOos) return;
                                      handleAttributeClick(o.value_key);
                                    }}
                                    title={isOos ? `${o.label} (Out of stock)` : o.label}
                                    aria-label={`${a.name}: ${o.label}${isOos ? ' (Out of stock)' : ''}`}
                                    className={`group relative flex size-9 items-center justify-center rounded-full transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                                      isOos
                                        ? 'opacity-30 cursor-not-allowed pointer-events-none filter grayscale ring-1 ring-border/40'
                                        : isSelected
                                        ? 'ring-2 ring-primary ring-offset-2 ring-offset-background scale-110 shadow-sm'
                                        : 'hover:scale-105 opacity-90 hover:opacity-100 ring-1 ring-border/80'
                                    }`}
                                  >
                                    <span
                                      className="h-full w-full rounded-full border border-black/15 shadow-inner flex items-center justify-center overflow-hidden"
                                      style={bgStyle}
                                    >
                                      {!hasHex && (
                                        <span className="text-[10px] font-bold text-muted-foreground uppercase">
                                          {o.label.slice(0, 2)}
                                        </span>
                                      )}
                                    </span>
                                    {isOos && (
                                      <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                        <span className="h-0.5 w-full bg-destructive/90 rotate-45" />
                                      </span>
                                    )}
                                    {!isOos && isSelected && (
                                      <span className="absolute inset-0 flex items-center justify-center text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                                        <Check className="size-4 stroke-[3]" />
                                      </span>
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="flex flex-wrap items-center gap-2 pt-1">
                              {opts.map((o) => {
                                const isSelected = selectedVal === o.value_key;
                                const isOos = isOptionOutOfStock(product, a.attr_key, o.value_key, variationChoice, dimIndex);

                                return (
                                  <button
                                    key={o.value_key}
                                    type="button"
                                    disabled={isOos}
                                    onClick={() => {
                                      if (isOos) return;
                                      handleAttributeClick(o.value_key);
                                    }}
                                    className={`min-w-[40px] h-9 px-3 py-1 rounded-lg border text-xs sm:text-sm font-medium transition-all duration-150 flex items-center justify-center ${
                                      isOos
                                        ? 'opacity-35 cursor-not-allowed bg-muted/60 text-muted-foreground line-through pointer-events-none border-border/40'
                                        : isSelected
                                        ? 'border-primary bg-primary text-primary-foreground font-semibold shadow-sm'
                                        : 'border-border/80 bg-background text-foreground hover:border-primary/50 hover:bg-muted/40'
                                    }`}
                                  >
                                    {o.label}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {extraFieldMeta.map((a) => (
                      <div key={a.attr_key} className="space-y-1.5 pt-1">
                        <label className="text-xs sm:text-sm font-medium text-foreground">
                          {a.name} <span className="text-destructive">*</span>
                        </label>
                        <input
                          type={a.kind === 'email' ? 'email' : 'text'}
                          value={extras[a.attr_key] ?? ''}
                          onChange={(e) => {
                            setExtras((prev) => ({ ...prev, [a.attr_key]: e.target.value }));
                            setValidationError(null);
                          }}
                          placeholder={`Enter ${a.name}`}
                          className={formFieldClass}
                          required
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* Purchase Variables (Duration, Addons, etc.) */}
                {!hasVariations && vars.length > 0 && (
                  <div className="space-y-4 rounded-xl border border-border/60 bg-muted/20 p-4">
                    {vars.map((v) => {
                      if (v.kind === 'email') {
                        return (
                          <div key={v.var_key} className="space-y-1.5">
                            <label className="text-xs sm:text-sm font-medium text-foreground">
                              {v.label} <span className="text-destructive">*</span>
                            </label>
                            <input
                              type="email"
                              value={emails[v.var_key] ?? ''}
                              onChange={(e) => {
                                setEmails((prev) => ({ ...prev, [v.var_key]: e.target.value }));
                                setValidationError(null);
                              }}
                              placeholder="Enter email address"
                              className={formFieldClass}
                              required
                            />
                          </div>
                        );
                      }
                      const opts = (v.options ?? []).slice().sort((a, b) => a.sort_order - b.sort_order);
                      const selectedVal = selections[v.var_key] ?? '';
                      const selectedOpt = opts.find((o) => o.option_key === selectedVal);

                      return (
                        <div key={v.var_key} className="space-y-2">
                          <div className="flex items-center justify-between text-xs sm:text-sm">
                            <span className="font-medium text-foreground">
                              {v.label}: <span className="font-semibold text-primary">{selectedOpt?.label || 'Select'}</span>
                              <span className="text-destructive"> *</span>
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 pt-1">
                            {opts.map((o) => {
                              const isSelected = selectedVal === o.option_key;
                              return (
                                <button
                                  key={o.option_key}
                                  type="button"
                                  onClick={() => {
                                    setSelections((prev) => ({ ...prev, [v.var_key]: o.option_key }));
                                    setValidationError(null);
                                  }}
                                  className={`min-w-[44px] h-9 px-3 py-1 rounded-lg border text-xs sm:text-sm font-medium transition-all duration-150 flex items-center justify-center gap-1.5 ${
                                    isSelected
                                      ? 'border-primary bg-primary text-primary-foreground font-semibold shadow-sm'
                                      : 'border-border/80 bg-background text-foreground hover:border-primary/50 hover:bg-muted/40'
                                  }`}
                                >
                                  <span>{o.label}</span>
                                  {o.price_adjustment !== 0 && (
                                    <span className={isSelected ? 'text-primary-foreground/80 text-[11px]' : 'text-muted-foreground text-[11px]'}>
                                      ({o.price_adjustment > 0 ? '+' : ''}{formatCurrency(o.price_adjustment)})
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Quantity Controls */}
                {maxQty > 1 && (
                  <div className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/20 p-3.5">
                    <div>
                      <span className="text-xs sm:text-sm font-medium text-foreground block">Quantity</span>
                      <span className="text-xs text-muted-foreground">Up to {maxQty} available</span>
                    </div>
                    <div className="flex items-center rounded-lg border border-border bg-background shadow-sm">
                      <button
                        type="button"
                        onClick={() => setQty((q) => Math.max(1, q - 1))}
                        disabled={qty <= 1}
                        className="size-8 text-base font-semibold hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center"
                        aria-label="Decrease quantity"
                      >
                        −
                      </button>
                      <span className="min-w-8 text-center text-sm font-medium tabular-nums px-1">
                        {qty}
                      </span>
                      <button
                        type="button"
                        onClick={() => setQty((q) => Math.min(maxQty, q + 1))}
                        disabled={qty >= maxQty}
                        className="size-8 text-base font-semibold hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center"
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                    </div>
                  </div>
                )}
              </form>
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border/80 bg-muted/10 px-4 py-3 sm:px-6">
          <div>
            <span className="text-xs text-muted-foreground block">Line Total</span>
            <span className="text-base sm:text-lg font-bold tabular-nums text-foreground">
              {formatCurrency(displayPrice * (maxQty > 0 ? qty : 1))}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="success"
              size="sm"
              onClick={handleSave}
              isLoading={saving}
              disabled={loading || Boolean(error) || maxQty < 1}
            >
              {maxQty < 1 ? 'Out of stock' : 'Save changes'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
