'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  getCart,
  updateCartItem,
  removeCartItem,
} from '@/lib/api/cart';
import { getAuthToken } from '@/lib/api/client';
import { getGuestCart, removeGuestCartItem, setGuestCartItemThumbnail, updateGuestCartItem } from '@/lib/storefront/guestCart';
import { fetchProductBySlug } from '@/lib/api/products';
import { validateCoupon } from '@/lib/api/coupons';
import type { Cart, CartItem } from '@/types/cart';
import type { CouponValidationResult } from '@/types/coupon';
import { Container } from '@/components/ui';
import { Button } from '@/components/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { Alert, AlertDescription } from '@/components/ui';
import { formatCurrency } from '@/lib/utils/format';
import { storefrontSelectionsSummary } from '@/lib/utils/selectionsSummary';
import { getProductImageUrl } from '@/lib/imageUrl';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';

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
  const isGuest = !getAuthToken();

  const loadCart = async () => {
    setLoading(true);
    setError(null);
    if (!getAuthToken()) {
      const guestCart = getGuestCart();
      setCart(guestCart);
      const missingImages = guestCart.items.filter((item) => !item.product_thumbnail);
      if (missingImages.length) {
        void Promise.all(missingImages.map(async (item) => {
          try {
            const product = await fetchProductBySlug(item.product_slug);
            return setGuestCartItemThumbnail(item.id, product.thumbnail);
          } catch {
            return null;
          }
        })).then(() => setCart(getGuestCart()));
      }
      setLoading(false);
      return;
    }
    try {
      const data = await getCart({ skip401Redirect: true });
      setCart(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load cart';
      if (/unauthorized/i.test(msg)) {
        setCart(getGuestCart());
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
      const updated = item.id < 0
        ? updateGuestCartItem(item.id, quantity)
        : await updateCartItem(item.id, quantity);
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
      const updated = itemId < 0 ? removeGuestCartItem(itemId) : await removeCartItem(itemId);
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
    if (!code || !cart || isGuest) return;
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
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
  {/* Product info */}
  <div className="flex min-w-0 flex-1 items-start gap-3">
    <img
      src={getProductImageUrl(item.product_thumbnail) ?? '/icon.png'}
      alt={item.product_name}
      className="h-20 w-20 shrink-0 rounded-lg border border-border object-cover"
    />

    <div className="min-w-0 flex-1">
      <Link
        href={`/products/${item.product_slug}`}
        className="line-clamp-2 font-medium text-primary hover:underline"
      >
        {item.product_name}
      </Link>

      <p className="mt-0.5 text-sm text-muted-foreground">
        {formatCurrency(item.unit_price)} × {item.quantity}
      </p>

      {summaryRows.length ? (
        <ul className="mt-2 space-y-0.5 text-xs text-muted-foreground">
          {summaryRows.map((row) => (
            <li key={`${item.id}-${row.label}`}>
              <span className="font-medium text-foreground/80">
                {row.label}:
              </span>{' '}
              {row.value}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  </div>

  {/* Controls */}
  <div className="flex w-full shrink-0 items-center justify-between gap-3 sm:w-auto sm:justify-end">
    <div className="flex items-center gap-3">
      <label className="sr-only" htmlFor={`qty-${item.id}`}>
        Quantity
      </label>

      {maxQ < 1 ? (
        <span className="whitespace-nowrap text-xs text-destructive">
          Out of stock
        </span>
      ) : (
        <select
          id={`qty-${item.id}`}
          value={displayQty}
          onChange={(e) =>
            handleUpdateQuantity(item, Number(e.target.value))
          }
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

      <span className="w-auto min-w-[80px] text-right font-medium tabular-nums">
        {formatCurrency(item.line_total)}
      </span>
    </div>

    <Button
      variant="ghost"
      size="sm"
      onClick={() => handleRemove(item.id)}
      disabled={updatingId === item.id}
      className="h-12 w-12 shrink-0 bg-red-50 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
      aria-label={`Remove ${item.product_name}`}
    >
      <Trash2 className="h-9 w-9 text-primary" aria-hidden />
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
              {/* {isGuest ? (
                <p className="rounded-md bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
                  Coupon codes are available after signing in.
                </p>
              ) : */}
               <div className="space-y-2">
                {/* <div className="flex min-w-0 flex-col gap-2 sm:flex-row">
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
                    variant="success"
                    className="w-full bg-green-600 text-white hover:bg-green-800 shrink-0 sm:w-auto"
                    onClick={handleApplyCoupon}
                    disabled={couponLoading || !couponInput.trim()}
                    isLoading={couponLoading}
                  >
                    Apply
                  </Button>
                </div> */}
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
                <Button fullWidth size="lg" variant='success' className='bg-green-600 text-white hover:bg-green-800'>
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
