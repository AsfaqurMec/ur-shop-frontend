'use client';

import type { ShippingMethod } from '@/lib/api/storeSettings';
import { formatCurrency } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';

export interface CheckoutShippingMethodsProps {
  methods: ShippingMethod[];
  selectedId: string;
  onSelect: (id: string) => void;
}

export function CheckoutShippingMethods({ methods, selectedId, onSelect }: CheckoutShippingMethodsProps) {
  if (methods.length === 0) return null;

  return (
    <div id="checkout-shipping-methods" className="space-y-3" tabIndex={-1}>
      {methods.map((method) => {
        const selected = selectedId === method.id;
        return (
          <button
            key={method.id}
            type="button"
            onClick={() => onSelect(method.id)}
            className={cn(
              'group relative w-full overflow-hidden rounded-md border-2 text-left transition-all',
              selected
                ? 'border-primary bg-card ring-1 ring-primary/25 ring-offset-2 ring-offset-background'
                : 'border-border bg-card shadow-sm hover:border-primary/35 hover:bg-muted/30'
            )}
          >
            <div className="pointer-events-none absolute inset-y-3 left-0 w-0 rounded-r-full bg-primary" aria-hidden />
            <div className="flex items-start gap-4 px-3 pb-1.5 mt-3 pl-3">
                  <div
                      className={cn(
                        'flex h-[21px] w-[22px] items-center justify-center rounded-full border-[6.5px]',
                        selected ? 'border-primary bg-primary' : 'border-muted-foreground/40'
                      )}
                      aria-hidden
                    >
                      {selected ? (
                        <span className="block h-2.5 w-2.5 rounded-full bg-primary-foreground" />
                      ) : null}
                    </div>
              <div className="min-w-0 flex-1">
                
                <div className="flex items-start justify-between gap-3">
                  
                  <div>
                    <p className="text-[15px] font-medium tracking-normal [word-spacing:5px]">{method.title}</p>
                    {method.subtitle ? (
                      <p className="mt-.5 text-sm leading-relaxed text-muted-foreground">{method.subtitle}</p>
                    ) : null}
                  </div>
                  <div className="flex shrink-0  justify-center items-center">
                    <span className="text-lg font-semibold tabular-nums text-foreground">
                      {method.extraPrice > 0 ? `${formatCurrency(method.extraPrice)}` : 'Free'}
                    </span>
                   
                  </div>
                </div>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
