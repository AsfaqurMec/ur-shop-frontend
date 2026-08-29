'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getCart, removeCartItem, updateCartItem } from '@/lib/api/cart';
import { createOrder } from '@/lib/api/checkout';
import { getProfile, guestAccountExists, guestCheckout, continueCheckout } from '@/lib/api/auth';
import { setAuthToken } from '@/lib/api/client';
import { getGuestCart, removeGuestCartItem, setGuestCartItemThumbnail, transferGuestCartToAccount, updateGuestCartItem, updateGuestCartItemVariation, syncGuestCartItemStock } from '@/lib/storefront/guestCart';
import { fetchProductBySlug } from '@/lib/api/products';
import { getPublicStoreSettings, type ShippingMethod } from '@/lib/api/storeSettings';
import type { Cart, CartItem } from '@/types/cart';
import type { PaymentMethod } from '@/types/payment';
import type { CheckoutPaymentMethod } from '@/lib/api/checkout';
import { CheckoutPaymentMethods } from '@/components/checkout/CheckoutPaymentMethods';
import { CheckoutShippingMethods } from '@/components/checkout/CheckoutShippingMethods';
import { CheckoutOrderItemsAccordion } from '@/components/checkout/CheckoutOrderItemsAccordion';
import { EditVariationModal } from '@/components/cart/EditVariationModal';
import { Container, Button, Input, Card, CardContent, CardHeader, CardTitle, Alert, AlertDescription } from '@/components/ui';
import { formatCurrency } from '@/lib/utils/format';
import { toast } from 'sonner';
import { validateCoupon } from '@/lib/api/coupons';
import type { CouponValidationResult } from '@/types/coupon';
import { secureSessionStorage } from '@/lib/utils/secureStorage';
import { normalizeBdMobile, isValidBdMobile } from '@/lib/utils/bengali';

const COUPON_STORAGE_KEY = '_sec_chk_cpn_v2';
const CHECKOUT_DRAFT_STORAGE_KEY = '_sec_chk_draft_v2';

export default function CheckoutPage() {
  const router = useRouter();
  const [cart, setCart] = useState<Cart | null>(null);
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([]);
  const [isGuest, setIsGuest] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [removingId, setRemovingId] = useState<number | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [editingItem, setEditingItem] = useState<CartItem | null>(null);
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [address, setAddress] = useState('');
  const [shippingMethodId, setShippingMethodId] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [paymentMethods] = useState<PaymentMethod[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<CheckoutPaymentMethod>('cash_on_delivery');
  const [senderNumber, setSenderNumber] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [couponInput, setCouponInput] = useState('');
  const [couponResult, setCouponResult] = useState<CouponValidationResult | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [checkingExistingAccount, setCheckingExistingAccount] = useState(false);

  useEffect(() => {
    let cancelled = false;
    // Purge any legacy unencrypted keys
    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem('checkout_coupon_code');
      window.sessionStorage.removeItem('checkout_guest_draft');
    }
    const savedCoupon = secureSessionStorage.getItem<string>(COUPON_STORAGE_KEY);
    setCouponInput(typeof savedCoupon === 'string' ? savedCoupon.trim() : '');
    const savedDraft = secureSessionStorage.getItem<{ name?: string; mobile?: string; address?: string }>(CHECKOUT_DRAFT_STORAGE_KEY);
    if (savedDraft) {
      setName(savedDraft.name ?? '');
      setMobile(savedDraft.mobile ?? '');
      setAddress(savedDraft.address ?? '');
      secureSessionStorage.removeItem(CHECKOUT_DRAFT_STORAGE_KEY);
    }
    (async () => {
      try {
        const settingsPromise = getPublicStoreSettings().catch(() => ({ shippingMethods: [] as ShippingMethod[] }));
        const profilePromise = getProfile().catch(() => null);

        const [settings, profile] = await Promise.all([settingsPromise, profilePromise]);
        if (cancelled) return;

        const methods = settings.shippingMethods ?? [];
        setShippingMethods(methods);
        setShippingMethodId(methods[0]?.id ?? '');

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
            ).then(() => {
              if (!cancelled) setCart(getGuestCart());
            });
          }
          setLoading(false);
          return;
        }

        const guestCart = getGuestCart();
        if (guestCart.items.length > 0) {
          try {
            await transferGuestCartToAccount();
          } catch {}
        }

        const cartData = await getCart();
        if (cancelled) return;
        setCart(cartData);
        // Pre-fill with user profile data as defaults (can be edited for this order)
        if (profile?.user) {
          setName((prev) => (prev ? prev : profile.user.name || ''));
          setMobile((prev) => (prev ? prev : profile.user.mobile || ''));
          setAddress((prev) => (prev ? prev : profile.user.address || ''));
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

  const selectedShippingMethod = useMemo(
    () => shippingMethods.find((method) => method.id === shippingMethodId) ?? null,
    [shippingMethods, shippingMethodId]
  );
  const shippingExtra = selectedShippingMethod?.extraPrice ?? 0;
  const couponDiscount = couponResult?.valid ? couponResult.discount_amount ?? 0 : 0;
  const orderTotal = Math.max(0, (cart?.subtotal ?? 0) - couponDiscount + shippingExtra);

  const applyCoupon = async () => {
    const code = couponInput.trim();
    if (!code || !cart) return;
    setCouponLoading(true);
    try {
      const result = await validateCoupon(code, cart.subtotal, cart.items);
      setCouponResult(result);
      if (!result.valid) throw new Error(result.message || 'Coupon is not valid.');
      secureSessionStorage.setItem(COUPON_STORAGE_KEY, code);
      toast.success('Coupon added');
    } catch (err) {
      secureSessionStorage.removeItem(COUPON_STORAGE_KEY);
      toast.error(err instanceof Error ? err.message : 'Could not apply coupon.');
    } finally {
      setCouponLoading(false);
    }
  };

  const showCheckoutError = (message: string, targetId?: string) => {
    setSubmitError(message);
    toast.error(message);
    requestAnimationFrame(() => {
      const target = document.getElementById(targetId ?? 'checkout-error');
      target?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      if (target instanceof HTMLElement) target.focus({ preventScroll: true });
    });
  };

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

  const updateItemQuantity = async (item: Cart['items'][number], quantity: number) => {
    const nextQuantity = Math.max(1, Math.min(quantity, item.max_quantity));
    if (nextQuantity === item.quantity) return;
    setUpdatingId(item.id);
    try {
      const updated = item.id < 0 ? updateGuestCartItem(item.id, nextQuantity) : await updateCartItem(item.id, nextQuantity);
      setCart(updated);
    } catch (err) {
      showCheckoutError(err instanceof Error ? err.message : 'Could not update quantity.');
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
    setSubmitError(null);
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

  const handleCreateOrder = async () => {
    if (!cart?.items.length) return;
    const normalizedMobile = normalizeBdMobile(mobile);
    const trimmedAddress = address.trim();
    const trimmedName = name.trim();

    if (!isValidBdMobile(normalizedMobile)) {
      showCheckoutError('Enter a valid Bangladesh mobile number (for example, 01712345678 or ০১৭১২৩৪৫৬৭৮).', 'checkout-mobile');
      return;
    }
    if (shippingMethods.length > 0 && !shippingMethodId) {
      showCheckoutError('Please select a shipping method.', 'checkout-shipping-methods');
      return;
    }
    if (!trimmedName) {
      showCheckoutError('Name is required.', 'checkout-name');
      return;
    }
    if (!trimmedAddress) {
      showCheckoutError('Address is required.', 'checkout-address');
      return;
    }

    const hasOutOfStock = cart?.items.some((item) => (item.max_quantity ?? 99) <= 0);
    if (hasOutOfStock) {
      showCheckoutError('One or more items in your cart are out of stock. Please remove them to place your order.');
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    try {
      if (isGuest) {
        // Check if account exists
        if (await guestAccountExists(normalizedMobile)) {
          // Use existing account but with form data
          const result = await continueCheckout(normalizedMobile);
          setAuthToken(result.accessToken);
          window.dispatchEvent(new Event('profile:updated'));
          await transferGuestCartToAccount();
        } else {
          // Create new account with form data
          const result = await guestCheckout({
            name: trimmedName,
            mobile: normalizedMobile,
            address: trimmedAddress,
          });
          setAuthToken(result.accessToken);
          window.dispatchEvent(new Event('profile:updated'));
          await transferGuestCartToAccount();
        }
      }

      const coupon = secureSessionStorage.getItem<string>(COUPON_STORAGE_KEY)?.trim();
      // Always use current form data (name, mobile, address) for the order
      const order = await createOrder({
        name: trimmedName,
        coupon_code: coupon || null,
        payment_method: 'cash_on_delivery',
        payment_type: 'cash_on_delivery',
        sender_number: null,
        transaction_id: null,
        mobile: normalizedMobile,
        address: trimmedAddress,
        postal_code: null,
        address_line2: null,
        shipping_method_id: shippingMethodId || null,
      });
      secureSessionStorage.removeItem(COUPON_STORAGE_KEY);
      secureSessionStorage.removeItem(CHECKOUT_DRAFT_STORAGE_KEY);
      window.dispatchEvent(new Event('cart:changed'));
      router.push(`/order-success?orderId=${order.id}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Checkout failed. Please try again.';
      showCheckoutError(message);
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

  if (!cart?.items.length) {
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

  const hasOutOfStockItems = cart ? cart.items.some((item) => (item.max_quantity ?? 99) <= 0) : false;

  return (
    <Container className="max-w-6xl py-6 sm:py-8">
      <h1 className="mb-3 text-md text-center font-bold tracking-tight sm:text-2xl uppercase [word-spacing:3px]">Please fill in the form to order</h1>
      {submitError ? (
        <Alert id="checkout-error" variant="destructive" className="mb-4" tabIndex={-1}>
          <AlertDescription>{submitError}</AlertDescription>
        </Alert>
      ) : null}
      {hasOutOfStockItems && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>
            One or more items in your cart are currently out of stock. Please remove them to proceed with your order.
          </AlertDescription>
        </Alert>
      )}
      <div className="flex flex-col-reverse gap-6 lg:grid lg:grid-cols-5 lg:gap-8">
        <div className="order-2 space-y-4 sm:space-y-6 lg:order-none lg:col-span-3">
          <Card className="overflow-hidden shadow-sm">
            <CardHeader className="p-4 pb-2 sm:p-6 sm:pb-2">
              <CardTitle className="text-base sm:text-lg">Delivery details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-4 pt-2 sm:p-6 sm:pt-2">
              <div className="space-y-2">
                <label htmlFor="checkout-name" className="text-sm font-medium">
                  Name <span className="text-destructive">*</span>
                </label>
                <Input
                  id="checkout-name"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setSubmitError(null);
                  }}
                  placeholder="Your full name"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="checkout-mobile" className="text-sm font-medium">
                  Mobile number <span className="text-destructive">*</span>
                </label>
                <Input
                  id="checkout-mobile"
                  type="tel"
                  autoComplete="tel"
                  value={mobile}
                  onChange={(e) => {
                    setMobile(e.target.value);
                    setSubmitError(null);
                  }}
                  placeholder="01XXXXXXXXX"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="checkout-address" className="text-sm font-medium">
                  Delivery address <span className="text-destructive">*</span>
                </label>
                <Input
                  id="checkout-address"
                  autoComplete="street-address"
                  value={address}
                  onChange={(e) => {
                    setAddress(e.target.value);
                    setSubmitError(null);
                  }}
                  placeholder="House, road, area, city"
                />
              </div>
            </CardContent>
          </Card>

          {shippingMethods.length > 0 && (
            <Card className="shadow-sm">
              <CardHeader className="p-4 pb-2 sm:p-6 sm:pb-2">
                <CardTitle className="text-base sm:text-lg">Shipping method</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-2 sm:p-6 sm:pt-2">
                <CheckoutShippingMethods
                  methods={shippingMethods}
                  selectedId={shippingMethodId}
                  onSelect={setShippingMethodId}
                />
              </CardContent>
            </Card>
          )}

          <Card className="shadow-sm">
            <CardHeader className="p-4 pb-2 sm:p-6 sm:pb-2">
              <CardTitle className="text-base sm:text-lg">Payment</CardTitle>
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
        </div>

        <div className="order-1 space-y-4 lg:order-none lg:col-span-2">
          <CheckoutOrderItemsAccordion
            items={cart.items}
            removingId={removingId}
            updatingId={updatingId}
            onRemoveItem={removeItem}
            onUpdateItem={updateItemQuantity}
            onEditItem={setEditingItem}
          />
          <Card className="shadow-sm lg:sticky lg:top-[calc(var(--header-height)+1rem)]">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-base sm:text-lg">Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-4 pt-0 sm:p-6 sm:pt-0">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium tabular-nums">{formatCurrency(cart.subtotal)}</span>
              </div>
              {shippingExtra > 0 ? (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Shipping{selectedShippingMethod ? ` (${selectedShippingMethod.title})` : ''}
                  </span>
                  <span className="font-medium tabular-nums">{formatCurrency(shippingExtra)}</span>
                </div>
              ) : selectedShippingMethod ? (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Shipping ({selectedShippingMethod.title})</span>
                  <span className="font-medium tabular-nums">Free</span>
                </div>
              ) : null}
              <div className="space-y-2 border-t pt-4">
                <label htmlFor="checkout-coupon" className="text-sm font-medium">Coupon code</label>
                <div className="flex gap-2">
                  <Input id="checkout-coupon" value={couponInput} onChange={(e) => { setCouponInput(e.target.value); setCouponResult(null); }} placeholder="Enter code" />
                  <Button type="button" variant="success" onClick={() => void applyCoupon()} isLoading={couponLoading} disabled={!couponInput.trim()}>Apply</Button>
                </div>
                {couponResult?.valid ? <p className="text-xs text-green-600">Coupon discount applied.</p> : null}
                {couponResult && !couponResult.valid ? <p className="text-xs text-destructive">{couponResult.message || 'Coupon is not valid.'}</p> : null}
              </div>
              {couponDiscount > 0 ? (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount</span><span className="font-medium tabular-nums">-{formatCurrency(couponDiscount)}</span>
                </div>
              ) : null}
              <div className="flex justify-between border-t pt-4 text-base font-semibold">
                <span>Total</span>
                <span className="tabular-nums">{formatCurrency(orderTotal)}</span>
              </div>
              <Button
                fullWidth
                size="lg"
                variant={hasOutOfStockItems ? 'secondary' : 'success'}
                disabled={hasOutOfStockItems || submitting || checkingExistingAccount}
                onClick={() => void handleCreateOrder()}
                isLoading={submitting || checkingExistingAccount}
                className={hasOutOfStockItems ? 'cursor-not-allowed opacity-60' : ''}
              >
                {hasOutOfStockItems ? 'Item(s) out of stock' : 'Place order'}
              </Button>
              <Link href="/cart" className="block text-center text-sm text-muted-foreground hover:text-foreground">
                Back to cart
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