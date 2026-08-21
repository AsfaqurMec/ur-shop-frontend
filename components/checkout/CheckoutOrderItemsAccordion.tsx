'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { CartItem } from '@/types/cart';
import { Button } from '@/components/ui';
import { formatCurrency } from '@/lib/utils/format';
import { storefrontSelectionsSummary } from '@/lib/utils/selectionsSummary';
import { cn } from '@/lib/utils/cn';
import { getProductImageUrl } from '@/lib/imageUrl';
import { Trash2 } from 'lucide-react';

export interface CheckoutOrderItemsAccordionProps {
  items: CartItem[];
  removingId: number | null;
  updatingId: number | null;
  onRemoveItem: (itemId: number) => void;
  onUpdateItem: (item: CartItem, quantity: number) => void;
}

export function CheckoutOrderItemsAccordion({
  items,
  removingId,
  updatingId,
  onRemoveItem,
  onUpdateItem,
}: CheckoutOrderItemsAccordionProps) {
  const [open, setOpen] = useState(true);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <section className="overflow-hidden rounded-xl border border-border/80 bg-card shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-muted/30 sm:px-6"
        aria-expanded={open}
      >
        <span className="min-w-0 flex-1">
          <span className="block text-base font-semibold tracking-tight">Order items</span>
          <span className="mt-0.5 block text-sm text-muted-foreground">
            {items.length} product{items.length === 1 ? '' : 's'} · {itemCount} item{itemCount === 1 ? '' : 's'}
          </span>
        </span>
        <span
          className={cn(
            'flex size-8 shrink-0 items-center justify-center rounded-md border border-border/60 bg-background/80 text-muted-foreground transition-transform',
            open && 'rotate-180'
          )}
          aria-hidden
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </button>
      {open ? (
        <div className="border-t border-border/60 px-4 py-2 sm:px-6 sm:py-3">
          <ul className="divide-y divide-border/60">
            {items.map((item) => {
              const isOutOfStock = (item.max_quantity ?? 99) <= 0;
              const rows = storefrontSelectionsSummary(item.selections_summary);
              return (
                <li key={item.id} className="flex gap-3 py-3">
                  <img src={getProductImageUrl(item.product_thumbnail) ?? '/icon.png'} alt={item.product_name} className="h-14 w-14 shrink-0 rounded-md border border-border object-cover" />
                  <div className="min-w-0 flex-1">
                    <Link href={`/products/${item.product_slug}`} className="font-medium text-primary hover:underline">
                      {item.product_name}
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      {formatCurrency(item.unit_price)} × {item.quantity}
                    </p>
                    {isOutOfStock ? (
                      <div className="mt-2">
                        <span className="inline-flex items-center rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs font-semibold text-destructive">
                          Out of stock
                        </span>
                      </div>
                    ) : (
                      <div className="mt-2 inline-flex items-center rounded-md border border-border bg-background">
                        <button type="button" aria-label={`Decrease ${item.product_name} quantity`} onClick={() => onUpdateItem(item, item.quantity - 1)} disabled={updatingId === item.id || item.quantity <= 1} className="h-7 w-7 text-sm font-semibold hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40">−</button>
                        <span className="min-w-8 text-center text-sm font-medium tabular-nums">{item.quantity}</span>
                        <button type="button" aria-label={`Increase ${item.product_name} quantity`} onClick={() => onUpdateItem(item, item.quantity + 1)} disabled={updatingId === item.id || item.quantity >= (item.max_quantity ?? 99)} className="h-7 w-7 text-sm font-semibold hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40">+</button>
                      </div>
                    )}
                    {rows.length > 0 ? (
                      <ul className="mt-1 text-xs text-muted-foreground">
                        {rows.map((row) => (
                          <li key={`${item.id}-${row.label}`}>
                            {row.label}: {row.value}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <span className="font-medium tabular-nums">{formatCurrency(item.line_total)}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={removingId === item.id}
                      onClick={() => onRemoveItem(item.id)}
                      className="h-12 w-12 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive bg-stone-50 "
                      aria-label={`Remove ${item.product_name}`}
                    >
                     <Trash2 className="h-10 w-10 text-primary" aria-hidden />
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
