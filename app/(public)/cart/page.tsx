'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  getCart,
  updateCartItem,
  removeCartItem,
} from '@/lib/api/cart';
import { getProfile } from '@/lib/api/auth';
import {
  getGuestCart,
  removeGuestCartItem,
  setGuestCartItemThumbnail,
  updateGuestCartItem,
  updateGuestCartItemVariation,
  syncGuestCartItemStock,
  transferGuestCartToAccount,
} from '@/lib/storefront/guestCart';
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
import { Trash2, SlidersHorizontal, Loader2 } from 'lucide-react';
import { secureSessionStorage } from '@/lib/utils/secureStorage';
import { EditVariationModal } from '@/components/cart/EditVariationModal';

const COUPON_STORAGE_KEY = '_sec_chk_cpn_v2';

export default function CartPage() {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [couponInput, setCouponInput] = useState('');
  const [couponResult, setCouponResult] = useState<CouponValidationResult | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [editingItem, setEditingItem] = useState<CartItem | null>(null);
  const [isGuest, setIsGuest] = useState(true);

  const loadCart = async () => {
    setLoading(true);
    setError(null);
    try {
      const profile = await getProfile().catch(() => null);
      const loggedIn = Boolean(profile?.user);
      setIsGuest(!loggedIn);

      if (!loggedIn) {
        const guestCart = getGuestCart();
        setCart(guestCart);
        if (guestCart.items.length) {
          void Promise.all(
            guestCart.items.map(async (item) => {
              try {
                const product = await fetchProductBySlug(item.product_slug);
                if (!item.product_thumbnail && product.thumbnail) {
                  setGuestCartItemThumbnail(item.id, product.thumbnail);
                }
                let liveStock: number | null = null;
                if (item.product_variation_id && product.catalog_variations) {
                  const v = product.catalog_variations.find((vr) => vr.id === item.product_variation_id);
                  if (v && v.quantity != null) liveStock = v.quantity;
                } else if (product.product_type === 'license_key' && product.license_available_count != null) {
                  liveStock = product.license_available_count;
                } else if (product.quantity != null && Number(product.quantity) > 0) {
                  liveStock = product.quantity;
                } else {
                  liveStock = 99;
                }
                if (liveStock != null) {
                  syncGuestCartItemStock(item.product_id, item.product_variation_id, liveStock);
                }
              } catch {
                // ignore
              }
            })
          ).then(() => setCart(getGuestCart()));
        }
        setLoading(false);
        return;
      }

      // Logged in: transfer any guest items to account first
      const guestCart = getGuestCart();
      if (guestCart.items.length > 0) {
        try {
          await transferGuestCartToAccount();
        } catch {}
      }

      const data = await getCart({ skip401Redirect: true });
      setCart(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load cart';
      if (/unauthorized/i.test(msg)) {
        setIsGuest(true);
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
    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem('checkout_coupon_code');
    }
    const stored = secureSessionStorage.getItem<string>(COUPON_STORAGE_KEY);
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

  const handleSaveVariation = async (data: {
    itemId: number;
    variationId?: number | null;
    selections: Record<string, string>;
    selectionsSummary: Array<{ label: string; value: string }>;
    unitPrice: number;
    maxQuantity: number;
    quantity: number;
    productThumbnail?: string | null;
  }) => {
    setCouponResult(null);
    if (data.itemId < 0) {
      const updated = updateGuestCartItemVariation(data.itemId, {
        variationId: data.variationId,
        selections: data.selections,
        selectionsSummary: data.selectionsSummary,
        unitPrice: data.unitPrice,
        maxQuantity: data.maxQuantity,
        quantity: data.quantity,
        productThumbnail: data.productThumbnail,
      });
      setCart(updated);
      toast.success('Options updated');
      window.dispatchEvent(new Event('cart:changed'));
    } else {
      const updated = await updateCartItem(
        data.itemId,
        data.quantity,
        data.selections,
        data.variationId
      );
      setCart(updated);
      toast.success('Options updated');
      window.dispatchEvent(new Event('cart:changed'));
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
        secureSessionStorage.setItem(COUPON_STORAGE_KEY, code);
        toast.success('Coupon applied');
      } else {
        secureSessionStorage.removeItem(COUPON_STORAGE_KEY);
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
    secureSessionStorage.removeItem(COUPON_STORAGE_KEY);
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

  const hasOutOfStockItems = cart ? cart.items.some((item) => (item.max_quantity ?? 99) <= 0) : false;

  return (
    <Container className="py-8">
      <h1 className="text-2xl font-semibold tracking-tight mb-6">Shopping cart</h1>
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {hasOutOfStockItems && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>
            One or more items in your cart are currently out of stock. Please remove them before proceeding to checkout.
          </AlertDescription>
        </Alert>
      )}
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          {cart.items.map((item) => {
            const maxQ = item.max_quantity ?? 99;
            const selectMax = Math.max(1, maxQ);
            const displayQty = maxQ > 0 ? Math.min(item.quantity, maxQ) : item.quantity;
            const isOutOfStock = maxQ < 1;
            const summaryRows = storefrontSelectionsSummary(item.selections_summary);
            return (
            <Card key={item.id} className={isOutOfStock ? 'border-destructive/40 bg-destructive/[0.02]' : ''}>
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

      <div className="mt-2">
        <button
          type="button"
          onClick={() => setEditingItem(item)}
          className="inline-flex items-center gap-1.5 rounded-md bg-red-600 px-2.5 py-1 text-xs font-semibold text-white shadow-xs hover:bg-red-700 active:bg-red-800 transition-colors"
        >
          <SlidersHorizontal className="size-3 text-white" />
          Edit item
        </button>
      </div>
    </div>
  </div>

  {/* Controls */}
  <div className="flex w-full shrink-0 items-center justify-between gap-3 sm:w-auto sm:justify-end">
    <div className="flex items-center gap-3">
      {isOutOfStock ? (
        <span className="inline-flex items-center rounded-full bg-destructive/10 px-2.5 py-1 text-xs font-semibold text-destructive whitespace-nowrap">
          Out of stock
        </span>
      ) : (
        <div className="inline-flex items-center rounded-md border border-border bg-background shadow-xs">
          <button
            type="button"
            aria-label={`Decrease ${item.product_name} quantity`}
            onClick={() => handleUpdateQuantity(item, item.quantity - 1)}
            disabled={updatingId === item.id || item.quantity <= 1}
            className="flex h-8 w-8 items-center justify-center text-sm font-semibold hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40 transition-colors"
          >
            −
          </button>
          <span className="flex min-w-9 items-center justify-center text-center text-sm font-medium tabular-nums">
            {updatingId === item.id ? (
              <Loader2 className="size-3.5 animate-spin text-primary" />
            ) : (
              item.quantity
            )}
          </span>
          <button
            type="button"
            aria-label={`Increase ${item.product_name} quantity`}
            onClick={() => handleUpdateQuantity(item, item.quantity + 1)}
            disabled={updatingId === item.id || item.quantity >= (item.max_quantity ?? 99)}
            className="flex h-8 w-8 items-center justify-center text-sm font-semibold hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40 transition-colors"
          >
            +
          </button>
        </div>
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
               <div className="space-y-2">
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
              {hasOutOfStockItems ? (
                <Button fullWidth size="lg" disabled variant="secondary" className="cursor-not-allowed opacity-60">
                  Item(s) out of stock
                </Button>
              ) : (
                <Link href="/checkout" className="block">
                  <Button fullWidth size="lg" variant="success" className="bg-green-600 text-white hover:bg-green-800">
                    Proceed to checkout
                  </Button>
                </Link>
              )}
              <Link href="/shop" className="block text-center text-sm text-muted-foreground hover:text-foreground">
                Continue shopping
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
      <EditVariationModal
        open={Boolean(editingItem)}
        onClose={() => setEditingItem(null)}
        item={editingItem}
        onSave={handleSaveVariation}
      />
    </Container>
  );
}
