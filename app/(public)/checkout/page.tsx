'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getCart, removeCartItem } from '@/lib/api/cart';
import { createOrder } from '@/lib/api/checkout';
import { getProfile, guestCheckout } from '@/lib/api/auth';
import { getAuthToken, setAuthToken } from '@/lib/api/client';
import { getGuestCart, removeGuestCartItem, transferGuestCartToAccount } from '@/lib/storefront/guestCart';
import type { Cart } from '@/types/cart';
import type { PaymentMethod } from '@/types/payment';
import type { CheckoutPaymentMethod } from '@/lib/api/checkout';
import { CheckoutPaymentMethods } from '@/components/checkout/CheckoutPaymentMethods';
import { Container, Button, Input, Card, CardContent, CardHeader, CardTitle, Alert, AlertDescription } from '@/components/ui';
import { formatCurrency } from '@/lib/utils/format';
import { storefrontSelectionsSummary } from '@/lib/utils/selectionsSummary';
import { toast } from 'sonner';

const COUPON_STORAGE_KEY = 'checkout_coupon_code';

function validateMobile(value: string) {
  return /^01[3-9]\d{8}$/.test(value.replace(/\D/g, ''));
}

export default function CheckoutPage() {
  const router = useRouter();
  const [cart, setCart] = useState<Cart | null>(null);
  const [isGuest, setIsGuest] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [removingId, setRemovingId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [address, setAddress] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [paymentMethods] = useState<PaymentMethod[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<CheckoutPaymentMethod>('cash_on_delivery');
  const [senderNumber, setSenderNumber] = useState('');
  const [transactionId, setTransactionId] = useState('');

  useEffect(() => {
    let cancelled = false;
    const guest = !getAuthToken();
    setIsGuest(guest);
    if (guest) {
      if (!cancelled) {
        setCart(getGuestCart());
        setLoading(false);
      }
      return () => { cancelled = true; };
    }
    (async () => {
      try {
        const [cartData, profile] = await Promise.all([getCart(), getProfile().catch(() => null)]);
        if (cancelled) return;
        setCart(cartData);
        if (profile?.user) {
          setName(profile.user.name ?? '');
          setEmail(profile.user.email ?? '');
          setMobile(profile.user.mobile ?? '');
          setAddress(profile.user.address ?? '');
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load cart');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const removeItem = async (itemId: number) => {
    setRemovingId(itemId);
    setSubmitError(null);
    try {
      const updated = itemId < 0 ? removeGuestCartItem(itemId) : await removeCartItem(itemId);
      setCart(updated);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not remove item';
      setSubmitError(message);
      toast.error(message);
    } finally {
      setRemovingId(null);
    }
  };

  const handleCreateOrder = async () => {
    if (!cart?.items.length) return;
    const normalizedMobile = mobile.replace(/\D/g, '');
    if (isGuest && (!name.trim() || !email.trim())) {
      setSubmitError('Name and email are required to continue as a guest.');
      return;
    }
    if (!validateMobile(normalizedMobile)) {
      setSubmitError('Enter a valid Bangladesh mobile number (for example, 01712345678).');
      return;
    }
    if (!address.trim()) {
      setSubmitError('Address is required.');
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    try {
      if (isGuest) {
        const result = await guestCheckout({ name: name.trim(), email: email.trim().toLowerCase(), mobile: normalizedMobile, address: address.trim() });
        setAuthToken(result.accessToken);
        window.dispatchEvent(new Event('profile:updated'));
        await transferGuestCartToAccount();
      }
      const coupon = sessionStorage.getItem(COUPON_STORAGE_KEY)?.trim();
      const order = await createOrder({
        coupon_code: coupon || null,
        payment_method: 'cash_on_delivery',
        payment_type: 'cash_on_delivery',
        sender_number: null,
        transaction_id: null,
        mobile: normalizedMobile,
        address: address.trim(),
      });
      sessionStorage.removeItem(COUPON_STORAGE_KEY);
      window.dispatchEvent(new Event('cart:changed'));
      router.push(`/order-success?orderId=${order.id}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Checkout failed. Please try again.';
      setSubmitError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Container className="py-12"><div className="flex justify-center py-12"><span className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div></Container>;
  if (error && !cart) return <Container className="py-12"><Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert><Link href="/cart" className="mt-4 inline-block"><Button variant="outline">Back to cart</Button></Link></Container>;
  if (!cart?.items.length) return <Container className="py-12"><Card><CardHeader><CardTitle>Checkout</CardTitle><p className="text-sm text-muted-foreground">Your cart is empty.</p></CardHeader><CardContent><Link href="/shop"><Button>Continue shopping</Button></Link></CardContent></Card></Container>;

  return (
    <Container className="max-w-6xl py-6 sm:py-8">
      <h1 className="mb-1 text-xl font-semibold tracking-tight sm:text-2xl">Checkout</h1>
      <p className="mb-6 text-sm text-muted-foreground">{isGuest ? 'Enter your details to create your account and place the order.' : 'Place your order with cash on delivery.'}</p>
      {submitError && <Alert variant="destructive" className="mb-4"><AlertDescription>{submitError}</AlertDescription></Alert>}
      <div className="flex flex-col gap-6 lg:grid lg:grid-cols-5 lg:gap-8">
        <div className="order-2 space-y-4 sm:space-y-6 lg:order-none lg:col-span-3">
          <Card className="overflow-hidden shadow-sm">
            <CardHeader className="p-4 pb-2 sm:p-6 sm:pb-2"><CardTitle className="text-base sm:text-lg">Delivery details</CardTitle><p className="text-sm font-normal text-muted-foreground">{isGuest ? 'We will create your account from these details.' : 'Mobile number and address are required to place your order.'}</p></CardHeader>
            <CardContent className="space-y-4 p-4 pt-2 sm:p-6 sm:pt-2">
              {isGuest && <><div className="space-y-2"><label htmlFor="guest-name" className="text-sm font-medium">Name <span className="text-destructive">*</span></label><Input id="guest-name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} maxLength={255} required /></div><div className="space-y-2"><label htmlFor="guest-email" className="text-sm font-medium">Email <span className="text-destructive">*</span></label><Input id="guest-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={254} required /></div></>}
              <div className="space-y-2"><label htmlFor="checkout-mobile" className="text-sm font-medium">Mobile number <span className="text-destructive">*</span></label><Input id="checkout-mobile" type="tel" autoComplete="tel" value={mobile} onChange={(e) => setMobile(e.target.value.replace(/[^\d\s+-]/g, ''))} maxLength={20} placeholder="017xxxxxxxx" required /><p className="text-xs text-muted-foreground">Enter a valid Bangladesh mobile number.</p></div>
              <div className="space-y-2"><label htmlFor="checkout-address" className="text-sm font-medium">Address <span className="text-destructive">*</span></label><textarea id="checkout-address" autoComplete="street-address" value={address} onChange={(e) => setAddress(e.target.value)} maxLength={1000} rows={3} required className="flex min-h-[5.5rem] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" /></div>
            </CardContent>
          </Card>
          <Card className="overflow-hidden shadow-sm"><CardHeader className="p-4 pb-2 sm:p-6 sm:pb-2"><CardTitle className="text-base sm:text-lg">Payment</CardTitle></CardHeader><CardContent className="p-4 pt-2 sm:p-6 sm:pt-2"><CheckoutPaymentMethods checkoutMethods={paymentMethods} bkashMerchantEnabled={false} paymentMethod={paymentMethod} onPaymentMethodChange={setPaymentMethod} senderNumber={senderNumber} transactionId={transactionId} onSenderNumberChange={setSenderNumber} onTransactionIdChange={setTransactionId} /></CardContent></Card>
          <Card className="overflow-hidden"><CardHeader className="p-4 sm:p-6"><CardTitle className="text-base sm:text-lg">Order items</CardTitle></CardHeader><CardContent className="p-4 pt-0 sm:p-6 sm:pt-0"><ul className="divide-y divide-border/60">{cart.items.map((item) => { const rows = storefrontSelectionsSummary(item.selections_summary); return <li key={item.id} className="flex gap-3 py-3"><div className="min-w-0 flex-1"><Link href={`/products/${item.product_slug}`} className="font-medium text-primary hover:underline">{item.product_name}</Link><p className="text-sm text-muted-foreground">{formatCurrency(item.unit_price)} × {item.quantity}</p>{rows.length > 0 && <ul className="mt-1 text-xs text-muted-foreground">{rows.map((row) => <li key={`${item.id}-${row.label}`}>{row.label}: {row.value}</li>)}</ul>}</div><div className="flex shrink-0 flex-col items-end gap-2"><span className="font-medium tabular-nums">{formatCurrency(item.line_total)}</span><Button size="sm" variant="ghost" disabled={removingId === item.id} onClick={() => removeItem(item.id)} className="h-7 px-2 text-destructive hover:bg-destructive/10 hover:text-destructive">Remove</Button></div></li>; })}</ul></CardContent></Card>
        </div>
        <div className="order-1 lg:order-none lg:col-span-2"><Card className="shadow-sm lg:sticky lg:top-[calc(var(--header-height)+1rem)]"><CardHeader className="p-4 sm:p-6"><CardTitle className="text-base sm:text-lg">Summary</CardTitle></CardHeader><CardContent className="space-y-4 p-4 pt-0 sm:p-6 sm:pt-0"><div className="flex justify-between text-sm"><span className="text-muted-foreground">Subtotal</span><span className="font-medium tabular-nums">{formatCurrency(cart.subtotal)}</span></div><div className="border-t pt-4"><Button fullWidth size="lg" onClick={handleCreateOrder} isLoading={submitting}>{isGuest ? 'Continue as guest' : 'Place order'}</Button></div><Link href="/cart" className="block text-center text-sm text-muted-foreground hover:text-foreground">Back to cart</Link></CardContent></Card></div>
      </div>
    </Container>
  );
}
