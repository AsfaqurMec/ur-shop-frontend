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
          'group relative w-full overflow-hidden rounded-md border-1 text-left transition-all',
          paymentMethod === 'cash_on_delivery'
            ? 'border-primary bg-card ring-2 ring-primary/25 ring-offset-2 ring-offset-background'
            : 'border-border bg-card shadow-sm hover:border-primary/35 hover:bg-muted/30'
        )}
      >
        <div className="pointer-events-none absolute inset-y-3 left-0 w-0 rounded-r-full bg-primary" aria-hidden />
        <div className="flex items-start gap-4 px-5 py-5 pl-6">
          {/* <div className="flex h-12 w-14 shrink-0 items-center justify-center rounded-xl border border-border bg-muted text-lg font-bold text-primary">
            COD
          </div> */}
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-base font-semibold tracking-tight text-foreground">Cash on delivery - ( COD )</p>
                <div className="mt-2 text-sm leading-relaxed text-muted-foreground border-t-2 pt-4 space-y-3">

                 <p>
                   <strong>***COD Order Confirmation Policy***</strong>
                 </p>
               
                 <p>
                   If your <strong>Courier Score is 80% or above</strong>, we will call you
                   from our <strong>official page</strong> to confirm your order.
                 </p>
               
                 <p>
                   If your <strong>Courier Score is below 80% or unavailable</strong>, the
                   <strong> delivery charge must be paid in advance</strong> to confirm your
                   order.
                 </p>
               
                 <p>
                   We will contact you by phone. If your number is{" "}
                   <strong>switched off, unreachable, or has any issue</strong>, the order
                   will be <strong>cancelled</strong>.
                 </p>
               
                 <p>
                   <strong>bKash Number:</strong> 018xxxxxxx{" "}
                   <span>[Send Money]</span>
                 </p>
               
                 <p>
                   The delivery charge is <strong>150 BDT</strong>.
                 </p>
               
                 <p>
                   Please send the <strong>last digit of the transaction ID</strong> or a
                   <strong> screenshot</strong> to WhatsApp:{" "}
                   <strong>018xxxxxxxx</strong>
                 </p>
               </div>

            </div>
              {/* <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border/80 bg-background/50 shadow-inner" aria-hidden>
                <div className={cn('flex h-6 w-6 rounded-full border-[2.5px]', paymentMethod === 'cash_on_delivery' ? 'border-primary bg-primary' : 'border-muted-foreground/40')}>
                  {paymentMethod === 'cash_on_delivery' ? <span className="m-auto block h-2.5 w-2.5 rounded-full bg-primary-foreground" /> : null}
                </div>
              </div> */}
            </div>
          </div>
        </div>
      </button>
    </div>
  );
}
