'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getCart } from '@/lib/api/cart';
import { createOrder } from '@/lib/api/checkout';
import type { Cart } from '@/types/cart';
import type { PaymentMethod } from '@/types/payment';
import type { CheckoutPaymentMethod } from '@/lib/api/checkout';
import { CheckoutPaymentMethods } from '@/components/checkout/CheckoutPaymentMethods';
import { Container } from '@/components/ui';
import { Button } from '@/components/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { Alert, AlertDescription } from '@/components/ui';
import { formatCurrency } from '@/lib/utils/format';
import { storefrontSelectionsSummary } from '@/lib/utils/selectionsSummary';
import { toast } from 'sonner';

const COUPON_STORAGE_KEY = 'checkout_coupon_code';

export default function CheckoutPage() {
  const router = useRouter();
  const [cart, setCart] = useState<Cart | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<CheckoutPaymentMethod>('cash_on_delivery');
  const [senderNumber, setSenderNumber] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const couponCode =
    typeof window !== 'undefined' ? sessionStorage.getItem(COUPON_STORAGE_KEY) : null;
  const couponToSend = couponCode?.trim() || undefined;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const cartData = await getCart();
        if (!cancelled) {
          setCart(cartData);
          setPaymentMethods([]);
          setPaymentMethod('cash_on_delivery');
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load cart');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleCreateOrder = async () => {
    if (!cart || cart.items.length === 0) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const order = await createOrder({
        coupon_code: couponToSend ?? null,
        payment_method: 'cash_on_delivery',
        payment_type: 'cash_on_delivery',
        sender_number: null,
        transaction_id: null,
      });
      sessionStorage.removeItem(COUPON_STORAGE_KEY);
      router.push(`/order-success?orderId=${order.id}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Checkout failed. Please try again.';
      setSubmitError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Container className="py-12">
        <div className="flex justify-center py-12">
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      </Container>
    );
  }

  if (error && !cart) {
    return (
      <Container className="py-12">
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Link href="/cart" className="mt-4 inline-block">
          <Button variant="outline">Back to cart</Button>
        </Link>
      </Container>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <Container className="py-12">
        <Card>
          <CardHeader>
            <CardTitle>Checkout</CardTitle>
            <p className="text-sm text-muted-foreground">Your cart is empty.</p>
          </CardHeader>
          <CardContent>
            <Link href="/shop">
              <Button>Continue shopping</Button>
            </Link>
          </CardContent>
        </Card>
      </Container>
    );
  }

  return (
    <Container className="max-w-6xl py-6 sm:py-8">
      <h1 className="mb-1 text-xl font-semibold tracking-tight sm:text-2xl">Checkout</h1>
      <p className="mb-6 text-sm leading-relaxed text-muted-foreground text-pretty">
        Place your order with cash on delivery. Admin will review and update the order status.
      </p>
      {submitError && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{submitError}</AlertDescription>
        </Alert>
      )}
      <div className="flex flex-col gap-6 lg:grid lg:grid-cols-5 lg:gap-8">
        <div className="order-2 space-y-4 sm:space-y-6 lg:order-none lg:col-span-3">
          <Card className="overflow-hidden shadow-sm">
            <CardHeader className="p-4 pb-2 sm:p-6 sm:pb-2">
              <CardTitle className="text-base sm:text-lg">Payment</CardTitle>
              <p className="text-sm font-normal leading-relaxed text-muted-foreground text-pretty">
                Cash on delivery is currently the only available payment option.
              </p>
            </CardHeader>
            <CardContent className="p-4 pt-2 sm:p-6 sm:pt-2">
              <CheckoutPaymentMethods
                checkoutMethods={paymentMethods}
                bkashMerchantEnabled={false}
                paymentMethod={paymentMethod}
                onPaymentMethodChange={setPaymentMethod}
                senderNumber={senderNumber}
                transactionId={transactionId}
                onSenderNumberChange={setSenderNumber}
                onTransactionIdChange={setTransactionId}
              />
            </CardContent>
          </Card>

          <Card className="overflow-hidden">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-base sm:text-lg">Order items</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
              <ul className="divide-y divide-border/60">
                {cart.items.map((item) => {
                  const summaryRows = storefrontSelectionsSummary(item.selections_summary);
                  return (
                    <li
                      key={item.id}
                      className="flex flex-col gap-1 py-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4"
                    >
                      <div className="min-w-0">
                        <Link href={`/products/${item.product_slug}`} className="font-medium text-primary hover:underline">
                          {item.product_name}
                        </Link>
                        <p className="text-sm text-muted-foreground">
                          {formatCurrency(item.unit_price)} x {item.quantity}
                        </p>
                        {summaryRows.length ? (
                          <ul className="mt-2 space-y-0.5 text-xs text-muted-foreground">
                            {summaryRows.map((row) => (
                              <li key={`${item.id}-${row.label}`}>
                                <span className="font-medium text-foreground/80">{row.label}:</span> {row.value}
                              </li>
                            ))}
                          </ul>
                        ) : null}
                      </div>
                      <span className="shrink-0 font-medium tabular-nums sm:text-right">
                        {formatCurrency(item.line_total)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </CardContent>
          </Card>
        </div>
        <div className="order-2 sm:order-1 lg:order-none lg:col-span-2">
          <Card className="shadow-sm lg:sticky lg:top-[calc(var(--header-height)+1rem)]">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-base sm:text-lg">Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-4 pt-0 sm:p-6 sm:pt-0">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium tabular-nums">{formatCurrency(cart.subtotal)}</span>
              </div>
              {couponToSend && (
                <p className="rounded-md bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
                  Coupon <strong className="text-foreground">{couponToSend}</strong> will be applied.
                </p>
              )}
              <div className="border-t pt-4">
                <Button fullWidth size="lg" onClick={handleCreateOrder} isLoading={submitting}>
                  Place order
                </Button>
              </div>
              <Link href="/cart" className="block text-center text-sm text-muted-foreground hover:text-foreground">
                Back to cart
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </Container>
  );
}
