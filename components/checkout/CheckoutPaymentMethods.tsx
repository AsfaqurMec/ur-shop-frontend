'use client';

import { useEffect, useState } from 'react';
import type { PaymentMethod } from '@/types/payment';
import type { CheckoutPaymentMethod } from '@/lib/api/checkout';
import { cn } from '@/lib/utils/cn';
import { ChevronDown } from 'lucide-react';

export interface CheckoutPaymentMethodsProps {
  checkoutMethods: PaymentMethod[];
  bkashMerchantEnabled: boolean;
  paymentMethod: CheckoutPaymentMethod;
  onPaymentMethodChange: (method: CheckoutPaymentMethod) => void;
  senderNumber: string;
  transactionId: string;
  onSenderNumberChange: (value: string) => void;
  onTransactionIdChange: (value: string) => void;
}

export function CheckoutPaymentMethods({ paymentMethod, onPaymentMethodChange }: CheckoutPaymentMethodsProps) {
  const [policyOpen, setPolicyOpen] = useState(false);

  useEffect(() => {
    const media = window.matchMedia('(min-width: 640px)');
    const sync = () => setPolicyOpen(media.matches);
    sync();
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, []);

  return (
    <div className="space-y-4">
      <div
        className={cn(
          'group relative w-full overflow-hidden rounded-md border-1 text-left transition-all',
          paymentMethod === 'cash_on_delivery'
            ? 'border-primary bg-card ring-2 ring-primary/25 ring-offset-2 ring-offset-background'
            : 'border-border bg-card shadow-sm hover:border-primary/35 hover:bg-muted/30'
        )}
      >
        <div className="pointer-events-none absolute inset-y-3 left-0 w-0 rounded-r-full bg-primary" aria-hidden />
        <div className="flex items-start gap-4 px-5 py-5 pl-6">
          <div className="min-w-0 flex-1">
            <button type="button" onClick={() => onPaymentMethodChange('cash_on_delivery')} className="w-full text-left">
              <p className="text-base font-semibold tracking-tight text-foreground">Cash on delivery - ( COD )</p>
            </button>
            <button type="button" onClick={() => setPolicyOpen((value) => !value)} className="mt-2 flex w-full items-center justify-between border-t-2 pt-4 text-left text-sm leading-relaxed text-muted-foreground" aria-expanded={policyOpen}>
              <strong>***COD Order Confirmation Policy***</strong>
              <span className={cn('text-lg transition-transform, bg-stone-50 text-black rounded-sm border-2', policyOpen && 'rotate-180')} aria-hidden> <ChevronDown /></span>
            </button>
            {policyOpen ? (
              <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">
                <p>If your <strong>Courier Score is 80% or above</strong>, we will call you from our <strong>official page</strong> to confirm your order.</p>
                <p>If your <strong>Courier Score is below 80% or unavailable</strong>, the <strong>delivery charge must be paid in advance</strong> to confirm your order.</p>
                <p>We will contact you by phone. If your number is <strong>switched off, unreachable, or has any issue</strong>, the order will be <strong>cancelled</strong>.</p>
                <p><strong>bKash Number:</strong> 018xxxxxxx <span>[Send Money]</span></p>
                <p>The delivery charge is <strong>150 BDT</strong>.</p>
                <p>Please send the <strong>last digit of the transaction ID</strong> or a <strong>screenshot</strong> to WhatsApp: <strong>018xxxxxxxx</strong></p>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
