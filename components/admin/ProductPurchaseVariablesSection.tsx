'use client';

import { useState, useEffect } from 'react';
import type { ProductPurchaseVariable } from '@/types/product';
import { putProductPurchaseVariables, type AdminPurchaseVariableInput } from '@/lib/api/admin';
import { Button } from '@/components/ui';
import { Alert, AlertDescription } from '@/components/ui';
import { toast } from 'sonner';

function toAdminInput(list: ProductPurchaseVariable[]): AdminPurchaseVariableInput[] {
  return list.map((v, idx) => ({
    var_key: v.var_key,
    label: v.label,
    kind: v.kind,
    enabled: v.enabled !== false,
    required: v.required,
    sort_order: v.sort_order ?? idx,
    options: (v.options ?? []).map((o, j) => ({
      option_key: o.option_key,
      label: o.label,
      price_adjustment: o.price_adjustment,
      sort_order: o.sort_order ?? j,
    })),
  }));
}

function emptySelect(key: string, label: string, sort: number): ProductPurchaseVariable {
  return {
    var_key: key,
    label,
    kind: 'select',
    enabled: true,
    required: true,
    sort_order: sort,
    options: [
      { option_key: 'standard', label: 'Standard', price_adjustment: 0, sort_order: 0 },
      { option_key: 'premium', label: 'Premium', price_adjustment: 10, sort_order: 1 },
    ],
  };
}

function emptyEmail(key: string, label: string, sort: number): ProductPurchaseVariable {
  return {
    var_key: key,
    label,
    kind: 'email',
    enabled: true,
    required: false,
    sort_order: sort,
  };
}

export interface ProductPurchaseVariablesSectionProps {
  productId: number;
  initial: ProductPurchaseVariable[] | undefined;
}

export function ProductPurchaseVariablesSection({ productId, initial }: ProductPurchaseVariablesSectionProps) {
  const [variables, setVariables] = useState<ProductPurchaseVariable[]>(() => initial ?? []);
  useEffect(() => {
    setVariables(initial ?? []);
  }, [productId, initial]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  const save = async () => {
    const keys = variables.map((v) => v.var_key.trim().toLowerCase());
    if (new Set(keys).size !== keys.length) {
      setError('Each variable key must be unique');
      return;
    }
    setError(null);
    setSaved(null);
    setLoading(true);
    try {
      const product = await putProductPurchaseVariables(productId, toAdminInput(variables));
      setVariables(product.purchase_variables ?? []);
      setSaved('Purchase options saved.');
      toast.success('Purchase options saved');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Save failed';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">Purchase options</h2>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              setVariables((prev) => [...prev, emptySelect(`monthly_${prev.length + 1}`, 'Billing / monthly', prev.length)])
            }
          >
            + Select (e.g. monthly)
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              setVariables((prev) => [...prev, emptySelect(`plan_${prev.length + 1}`, 'Plan', prev.length)])
            }
          >
            + Select (e.g. plan)
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              setVariables((prev) => [...prev, emptyEmail(`delivery_email_${prev.length + 1}`, 'Delivery email', prev.length)])
            }
          >
            + Email field
          </Button>
        </div>
      </div>
      <p className="text-sm text-muted-foreground">
        Enable per-product choices that change price (option price adjustments stack on top of the product base
        price). Use stable keys (e.g. <code className="text-xs">monthly</code>, <code className="text-xs">plan</code>); customers
        see these on the product page, cart, and checkout.
      </p>
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {saved && (
        <Alert>
          <AlertDescription>{saved}</AlertDescription>
        </Alert>
      )}
      {variables.length === 0 ? (
        <p className="text-sm text-muted-foreground">No extra fields — product uses base price only.</p>
      ) : (
        <ul className="space-y-6">
          {variables.map((v, vi) => (
            <li key={`${v.var_key}-${vi}`} className="rounded-md border p-3 space-y-3">
              <div className="grid gap-2 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Key (machine id)</label>
                  <input
                    value={v.var_key}
                    onChange={(e) => {
                      const t = e.target.value;
                      setVariables((prev) => prev.map((x, i) => (i === vi ? { ...x, var_key: t } : x)));
                    }}
                    className="mt-0.5 flex h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Label (shown to customers)</label>
                  <input
                    value={v.label}
                    onChange={(e) => {
                      const t = e.target.value;
                      setVariables((prev) => prev.map((x, i) => (i === vi ? { ...x, label: t } : x)));
                    }}
                    className="mt-0.5 flex h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Kind</label>
                  <select
                    value={v.kind}
                    onChange={(e) => {
                      const kind = e.target.value === 'email' ? 'email' : 'select';
                      setVariables((prev) =>
                        prev.map((x, i) =>
                          i === vi
                            ? {
                                ...x,
                                kind,
                                options:
                                  kind === 'select' ? x.options ?? emptySelect('opt', 'Options', 0).options : [],
                              }
                            : x
                        )
                      );
                    }}
                    className="mt-0.5 flex h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
                  >
                    <option value="select">Select (options + price change)</option>
                    <option value="email">Email</option>
                  </select>
                </div>
                <div className="flex flex-wrap items-end gap-4">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={v.enabled !== false}
                      onChange={(e) => {
                        const c = e.target.checked;
                        setVariables((prev) => prev.map((x, i) => (i === vi ? { ...x, enabled: c } : x)));
                      }}
                    />
                    Enabled
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={v.required}
                      onChange={(e) => {
                        const c = e.target.checked;
                        setVariables((prev) => prev.map((x, i) => (i === vi ? { ...x, required: c } : x)));
                      }}
                    />
                    Required
                  </label>
                </div>
              </div>
              {v.kind === 'select' && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Options</p>
                  <ul className="space-y-2">
                    {(v.options ?? []).map((o, oi) => (
                      <li key={`${v.var_key}-o-${oi}`} className="grid gap-2 sm:grid-cols-4">
                        <input
                          placeholder="option_key"
                          value={o.option_key}
                          onChange={(e) => {
                            const t = e.target.value;
                            setVariables((prev) =>
                              prev.map((x, i) => {
                                if (i !== vi) return x;
                                const opts = [...(x.options ?? [])];
                                opts[oi] = { ...opts[oi], option_key: t };
                                return { ...x, options: opts };
                              })
                            );
                          }}
                          className="flex h-9 rounded-md border border-input bg-background px-2 text-sm"
                        />
                        <input
                          placeholder="Label"
                          value={o.label}
                          onChange={(e) => {
                            const t = e.target.value;
                            setVariables((prev) =>
                              prev.map((x, i) => {
                                if (i !== vi) return x;
                                const opts = [...(x.options ?? [])];
                                opts[oi] = { ...opts[oi], label: t };
                                return { ...x, options: opts };
                              })
                            );
                          }}
                          className="flex h-9 rounded-md border border-input bg-background px-2 text-sm"
                        />
                        <input
                          type="number"
                          step="0.01"
                          placeholder="Price +/-"
                          value={o.price_adjustment}
                          onChange={(e) => {
                            const n = parseFloat(e.target.value);
                            setVariables((prev) =>
                              prev.map((x, i) => {
                                if (i !== vi) return x;
                                const opts = [...(x.options ?? [])];
                                opts[oi] = { ...opts[oi], price_adjustment: Number.isFinite(n) ? n : 0 };
                                return { ...x, options: opts };
                              })
                            );
                          }}
                          className="flex h-9 rounded-md border border-input bg-background px-2 text-sm"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          onClick={() =>
                            setVariables((prev) =>
                              prev.map((x, i) => {
                                if (i !== vi) return x;
                                const opts = [...(x.options ?? [])].filter((_, j) => j !== oi);
                                return { ...x, options: opts };
                              })
                            )
                          }
                        >
                          Remove
                        </Button>
                      </li>
                    ))}
                  </ul>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setVariables((prev) =>
                        prev.map((x, i) => {
                          if (i !== vi) return x;
                          const opts = [...(x.options ?? [])];
                          opts.push({
                            option_key: `opt_${opts.length + 1}`,
                            label: `Option ${opts.length + 1}`,
                            price_adjustment: 0,
                            sort_order: opts.length,
                          });
                          return { ...x, options: opts };
                        })
                      )
                    }
                  >
                    Add option
                  </Button>
                </div>
              )}
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => setVariables((prev) => prev.filter((_, i) => i !== vi))}
              >
                Remove variable
              </Button>
            </li>
          ))}
        </ul>
      )}
      <Button type="button" onClick={save} isLoading={loading}>
        Save purchase options
      </Button>
    </div>
  );
}
