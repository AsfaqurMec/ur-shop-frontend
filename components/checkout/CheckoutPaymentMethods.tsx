'use client';

import type { PaymentMethod } from '@/types/payment';
import type { CheckoutPaymentMethod } from '@/lib/api/checkout';
import { cn } from '@/lib/utils/cn';

export interface CheckoutPaymentMethodsProps {
  checkoutMethods: PaymentMethod[];
  bkashMerchantEnabled: boolean;
  paymentMethod: CheckoutPaymentMethod;
  onPaymentMethodChange: (m: CheckoutPaymentMethod) => void;
  senderNumber: string;
  transactionId: string;
  onSenderNumberChange: (v: string) => void;
  onTransactionIdChange: (v: string) => void;
}

export function CheckoutPaymentMethods({
  paymentMethod,
  onPaymentMethodChange,
}: CheckoutPaymentMethodsProps) {
  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={() => onPaymentMethodChange('cash_on_delivery')}
        className={cn(
          'group relative w-full overflow-hidden rounded-2xl border text-left transition-all',
          paymentMethod === 'cash_on_delivery'
            ? 'border-primary bg-card ring-2 ring-primary/25 ring-offset-2 ring-offset-background'
            : 'border-border bg-card shadow-sm hover:border-primary/35 hover:bg-muted/30'
        )}
      >
        <div className="pointer-events-none absolute inset-y-3 left-0 w-1 rounded-r-full bg-primary" aria-hidden />
        <div className="flex items-start gap-4 px-5 py-5 pl-6">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-border bg-muted text-lg font-bold text-primary">
            COD
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-base font-semibold tracking-tight text-foreground">Cash on delivery</p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Place the order now. Admin will keep it pending until the payment status is updated.
                </p>
              </div>
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border/80 bg-background/50 shadow-inner" aria-hidden>
                <div className={cn('flex h-6 w-6 rounded-full border-[2.5px]', paymentMethod === 'cash_on_delivery' ? 'border-primary bg-primary' : 'border-muted-foreground/40')}>
                  {paymentMethod === 'cash_on_delivery' ? <span className="m-auto block h-2.5 w-2.5 rounded-full bg-primary-foreground" /> : null}
                </div>
              </div>
            </div>
          </div>
        </div>
      </button>
    </div>
  );
}
