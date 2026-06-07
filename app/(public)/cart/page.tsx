'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  getCart,
  updateCartItem,
  removeCartItem,
} from '@/lib/api/cart';
import { getAuthToken } from '@/lib/api/client';
import { validateCoupon } from '@/lib/api/coupons';
import type { Cart, CartItem } from '@/types/cart';
import type { CouponValidationResult } from '@/types/coupon';
import { Container } from '@/components/ui';
import { Button } from '@/components/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { Alert, AlertDescription } from '@/components/ui';
import { formatCurrency } from '@/lib/utils/format';
import { storefrontSelectionsSummary } from '@/lib/utils/selectionsSummary';
import { toast } from 'sonner';

const COUPON_STORAGE_KEY = 'checkout_coupon_code';

export default function CartPage() {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [couponInput, setCouponInput] = useState('');
  const [couponResult, setCouponResult] = useState<CouponValidationResult | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [needsSignIn, setNeedsSignIn] = useState(false);

  const cartReturnPath = '/cart';
  const loginHref = `/login?redirect=${encodeURIComponent(cartReturnPath)}`;
  const registerHref = `/register?redirect=${encodeURIComponent(cartReturnPath)}`;

  const loadCart = async () => {
    setLoading(true);
    setError(null);
    setNeedsSignIn(false);
    if (!getAuthToken()) {
      setNeedsSignIn(true);
      setCart(null);
      setLoading(false);
      return;
    }
    try {
      const data = await getCart({ skip401Redirect: true });
      setCart(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load cart';
      if (/unauthorized/i.test(msg)) {
        setNeedsSignIn(true);
        setCart(null);
      } else {
        setError(msg);
        setCart(null);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCart();
    const stored = typeof window !== 'undefined' ? sessionStorage.getItem(COUPON_STORAGE_KEY) : null;
    if (stored) setCouponInput(stored);
  }, []);

  const handleUpdateQuantity = async (item: CartItem, quantity: number) => {
    if (quantity < 1) return;
    setUpdatingId(item.id);
    setCouponResult(null);
    try {
      const updated = await updateCartItem(item.id, quantity);
      setCart(updated);
      window.dispatchEvent(new Event('cart:changed'));
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update quantity';
      setError(msg);
      toast.error(msg);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRemove = async (itemId: number) => {
    setUpdatingId(itemId);
    setCouponResult(null);
    try {
      const updated = await removeCartItem(itemId);
      setCart(updated);
      window.dispatchEvent(new Event('cart:changed'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove item');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleApplyCoupon = async () => {
    const code = couponInput.trim();
    if (!code || !cart) return;
    setCouponLoading(true);
    setCouponError(null);
    setCouponResult(null);
    try {
      const result = await validateCoupon(code, cart.subtotal, cart.items);
      setCouponResult(result);
      if (result.valid) {
        sessionStorage.setItem(COUPON_STORAGE_KEY, code);
        toast.success('Coupon applied');
      } else {
        sessionStorage.removeItem(COUPON_STORAGE_KEY);
        if (result.message) toast.error(result.message);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to validate coupon';
      setCouponError(msg);
      toast.error(msg);
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => {
    setCouponInput('');
    setCouponResult(null);
    setCouponError(null);
    sessionStorage.removeItem(COUPON_STORAGE_KEY);
  };

  const discount = couponResult?.valid && couponResult.discount_amount != null ? couponResult.discount_amount : 0;
  const estimatedTotal = cart ? Math.round((cart.subtotal - discount) * 100) / 100 : 0;

  if (loading) {
    return (
      <Container className="py-12">
        <div className="flex justify-center py-12">
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      </Container>
    );
  }

  if (needsSignIn) {
    return (
      <Container className="py-12">
        <Card className="mx-auto max-w-lg">
          <CardHeader className="space-y-1">
            <CardTitle>Sign in to view your cart</CardTitle>
            <p className="text-muted-foreground text-sm font-normal leading-relaxed">
              Your cart is tied to your account so items stay saved across devices. Sign in to see what
              you have added, change quantities, and continue to checkout.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <ul className="text-muted-foreground list-disc space-y-1.5 pl-5 text-sm">
              <li>Access your saved cart from any device</li>
              <li>Apply coupons and complete checkout securely</li>
              <li>New here? Create an account in a minute</li>
            </ul>
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <Link href={loginHref} className="block w-full sm:w-auto">
                <Button size="lg" fullWidth className="sm:w-auto">
                  Sign in
                </Button>
              </Link>
              <Link href={registerHref} className="block w-full sm:w-auto">
                <Button variant="outline" size="lg" fullWidth className="sm:w-auto">
                  Create account
                </Button>
              </Link>
            </div>
            <Link href="/shop" className="text-muted-foreground hover:text-foreground inline-block text-sm underline-offset-4 hover:underline">
              Continue shopping without signing in
            </Link>
          </CardContent>
        </Card>
      </Container>
    );
  }

  if (error && !cart) {
    return (
      <Container className="py-12">
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Link href="/shop" className="mt-4 inline-block">
          <Button variant="outline">Continue shopping</Button>
        </Link>
      </Container>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <Container className="py-12">
        <Card>
          <CardHeader>
            <CardTitle>Shopping cart</CardTitle>
            <p className="text-muted-foreground text-sm">Your cart is empty.</p>
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
    <Container className="py-8">
      <h1 className="text-2xl font-semibold tracking-tight mb-6">Shopping cart</h1>
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          {cart.items.map((item) => {
            const maxQ = item.max_quantity ?? 99;
            const selectMax = Math.max(1, maxQ);
            const displayQty = maxQ > 0 ? Math.min(item.quantity, maxQ) : item.quantity;
            const summaryRows = storefrontSelectionsSummary(item.selections_summary);
            return (
            <Card key={item.id}>
              <CardContent className="p-4 pt-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/products/${item.product_slug}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {item.product_name}
                    </Link>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {formatCurrency(item.unit_price)} × {item.quantity}
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
                  <div className="flex flex-shrink-0 flex-wrap items-center gap-3 sm:flex-nowrap">
                    <label className="sr-only" htmlFor={`qty-${item.id}`}>
                      Quantity
                    </label>
                    {maxQ < 1 ? (
                      <span className="text-xs text-destructive whitespace-nowrap">Out of stock</span>
                    ) : (
                    <select
                      id={`qty-${item.id}`}
                      value={displayQty}
                      onChange={(e) => handleUpdateQuantity(item, Number(e.target.value))}
                      disabled={updatingId === item.id}
                      className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                    >
                      {Array.from({ length: selectMax }, (_, i) => i + 1).map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </select>
                    )}
                    <span className="w-20 text-right font-medium tabular-nums">
                      {formatCurrency(item.line_total)}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemove(item.id)}
                      disabled={updatingId === item.id}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            );
          })}
        </div>
        <div className="lg:col-span-1">
          <Card className="lg:sticky lg:top-[calc(var(--header-height)+1rem)]">
            <CardHeader>
              <CardTitle>Order summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span className="tabular-nums">{formatCurrency(cart.subtotal)}</span>
              </div>
              {/* Coupon */}
              <div className="space-y-2">
                <div className="flex min-w-0 flex-col gap-2 sm:flex-row">
                  <input
                    type="text"
                    value={couponInput}
                    onChange={(e) => {
                      setCouponInput(e.target.value);
                      setCouponError(null);
                    }}
                    placeholder="Coupon code"
                    className="min-h-9 min-w-0 flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                  <Button
                    variant="outline"
                    className="w-full shrink-0 sm:w-auto"
                    onClick={handleApplyCoupon}
                    disabled={couponLoading || !couponInput.trim()}
                    isLoading={couponLoading}
                  >
                    Apply
                  </Button>
                </div>
                {couponError && (
                  <p className="text-sm text-red-600 dark:text-red-400">{couponError}</p>
                )}
                {couponResult && !couponResult.valid && couponResult.message && (
                  <p className="text-sm text-red-600 dark:text-red-400">{couponResult.message}</p>
                )}
                {couponResult?.valid && couponResult.discount_amount != null && (
                  <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-2">
                    Discount applied: −{formatCurrency(couponResult.discount_amount)}
                    <button
                      type="button"
                      onClick={removeCoupon}
                      className="underline hover:no-underline"
                    >
                      Remove
                    </button>
                  </p>
                )}
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-sm">
                  <span>Discount</span>
                  <span className="tabular-nums text-green-600 dark:text-green-400">
                    −{formatCurrency(discount)}
                  </span>
                </div>
              )}
              <div className="border-t pt-4 flex justify-between font-medium">
                <span>Estimated total</span>
                <span className="tabular-nums">{formatCurrency(estimatedTotal)}</span>
              </div>
              <Link href="/checkout" className="block">
                <Button fullWidth size="lg">
                  Proceed to checkout
                </Button>
              </Link>
              <Link href="/shop" className="block text-center text-sm text-muted-foreground hover:text-foreground">
                Continue shopping
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </Container>
  );
}
