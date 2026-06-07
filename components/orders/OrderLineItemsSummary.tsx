import { ProductPhoto } from '@/components/storefront/ProductPhoto';
import { ProductTypeBadge } from '@/components/storefront/ProductTypeBadge';
import { formatCurrency } from '@/lib/utils/format';
import type { ProductType } from '@/types/product';
import { PRODUCT_TYPES } from '@/types/product';

export type OrderSummaryLineItem = {
  id: number;
  product_name: string;
  product_type: string;
  product_thumbnail: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
  purchase_selections_summary?: Array<{ label: string; value: string }> | null;
};

function orderItemProductType(t: string): ProductType | null {
  return (PRODUCT_TYPES as readonly string[]).includes(t) ? (t as ProductType) : null;
}

export interface OrderLineItemsSummaryProps {
  items: OrderSummaryLineItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  currency: string;
  placedAt?: string | null;
  title?: string;
  className?: string;
}

export function OrderLineItemsSummary({
  items,
  subtotal,
  discount,
  tax,
  total,
  currency,
  placedAt,
  title = 'Order items',
  className = '',
}: OrderLineItemsSummaryProps) {
  return (
    <div
      className={`overflow-hidden rounded-2xl border border-border/80 bg-card/40 shadow-sm ring-1 ring-border/40 backdrop-blur-sm ${className}`}
    >
      <div className="border-b border-border/80 bg-muted/20 px-5 py-4">
        <h2 className="text-base font-semibold tracking-tight text-foreground">{title}</h2>
        {placedAt ? (
          <p className="mt-1 text-xs text-muted-foreground">Placed {placedAt}</p>
        ) : null}
      </div>
      <ul className="divide-y divide-border/60">
        {items.map((item) => {
          const pt = orderItemProductType(item.product_type);
          return (
            <li key={item.id} className="flex gap-4 px-4 py-4 sm:px-5">
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-border/60 bg-muted/40">
                <ProductPhoto path={item.product_thumbnail} alt="" fill className="rounded-xl" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium leading-snug text-foreground">{item.product_name}</p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2">
                      {pt ? <ProductTypeBadge type={pt} /> : null}
                      <span className="text-xs text-muted-foreground">
                        Qty {item.quantity} · {formatCurrency(item.unit_price, currency)} each
                      </span>
                    </div>
                    {item.purchase_selections_summary?.length ? (
                      <ul className="mt-2 space-y-0.5 text-xs text-muted-foreground">
                        {item.purchase_selections_summary.map((row) => (
                          <li key={`${item.id}-${row.label}`}>
                            <span className="font-medium text-foreground/80">{row.label}:</span> {row.value}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                  <p className="shrink-0 text-sm font-semibold tabular-nums text-foreground">
                    {formatCurrency(item.total_price, currency)}
                  </p>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
      <div className="space-y-2 border-t border-border/80 bg-muted/10 px-5 py-4 text-sm">
        <div className="flex justify-between text-muted-foreground">
          <span>Subtotal</span>
          <span className="tabular-nums text-foreground">{formatCurrency(subtotal, currency)}</span>
        </div>
        {discount > 0 ? (
          <div className="flex justify-between text-muted-foreground">
            <span>Discount</span>
            <span className="tabular-nums text-emerald-600 dark:text-emerald-400">
              −{formatCurrency(discount, currency)}
            </span>
          </div>
        ) : null}
        {tax > 0 ? (
          <div className="flex justify-between text-muted-foreground">
            <span>Tax</span>
            <span className="tabular-nums text-foreground">{formatCurrency(tax, currency)}</span>
          </div>
        ) : null}
        <div className="flex justify-between border-t border-border/60 pt-3 text-base font-semibold">
          <span>Total</span>
          <span className="tabular-nums text-foreground">{formatCurrency(total, currency)}</span>
        </div>
      </div>
    </div>
  );
}
