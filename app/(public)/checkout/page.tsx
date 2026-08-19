// 'use client';

// import { useEffect, useMemo, useState } from 'react';
// import { useRouter } from 'next/navigation';
// import Link from 'next/link';
// import { getCart, removeCartItem, updateCartItem } from '@/lib/api/cart';
// import { createOrder } from '@/lib/api/checkout';
// import { getProfile, guestAccountExists, guestCheckout, continueCheckout } from '@/lib/api/auth';
// import { getAuthToken, setAuthToken } from '@/lib/api/client';
// import { getGuestCart, removeGuestCartItem, setGuestCartItemThumbnail, transferGuestCartToAccount, updateGuestCartItem } from '@/lib/storefront/guestCart';
// import { fetchProductBySlug } from '@/lib/api/products';
// import { getPublicStoreSettings, type ShippingMethod } from '@/lib/api/storeSettings';
// import type { Cart } from '@/types/cart';
// import type { PaymentMethod } from '@/types/payment';
// import type { CheckoutPaymentMethod } from '@/lib/api/checkout';
// import { CheckoutPaymentMethods } from '@/components/checkout/CheckoutPaymentMethods';
// import { CheckoutShippingMethods } from '@/components/checkout/CheckoutShippingMethods';
// import { CheckoutOrderItemsAccordion } from '@/components/checkout/CheckoutOrderItemsAccordion';
// import { Container, Button, Input, Card, CardContent, CardHeader, CardTitle, Alert, AlertDescription } from '@/components/ui';
// import { formatCurrency } from '@/lib/utils/format';
// import { toast } from 'sonner';
// import { validateCoupon } from '@/lib/api/coupons';
// import type { CouponValidationResult } from '@/types/coupon';

// const COUPON_STORAGE_KEY = 'checkout_coupon_code';
// const CHECKOUT_DRAFT_STORAGE_KEY = 'checkout_guest_draft';

// function validateMobile(value: string) {
//   return /^01[3-9]\d{8}$/.test(value.replace(/\D/g, ''));
// }

// function formatGuestAddress(address: string, addressLine2: string, postalCode: string) {
//   return [address, addressLine2, postalCode].filter(Boolean).join('\n');
// }

// function parseStoredAddress(storedAddress: string) {
//   const parts = storedAddress.split('\n').map((part) => part.trim()).filter(Boolean);
//   return {
//     address: parts[0] ?? '',
//     addressLine2: parts[1] ?? '',
//     postalCode: parts[2] ?? '',
//   };
// }

// export default function CheckoutPage() {
//   const router = useRouter();
//   const [cart, setCart] = useState<Cart | null>(null);
//   const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([]);
//   const [isGuest, setIsGuest] = useState(true);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//   const [submitting, setSubmitting] = useState(false);
//   const [removingId, setRemovingId] = useState<number | null>(null);
//   const [updatingId, setUpdatingId] = useState<number | null>(null);
//   const [name, setName] = useState('');
//   const [mobile, setMobile] = useState('');
//   const [address, setAddress] = useState('');
//   const [addressLine2, setAddressLine2] = useState('');
//   const [postalCode, setPostalCode] = useState('');
//   const [shippingMethodId, setShippingMethodId] = useState('');
//   const [submitError, setSubmitError] = useState<string | null>(null);
//   const [paymentMethods] = useState<PaymentMethod[]>([]);
//   const [paymentMethod, setPaymentMethod] = useState<CheckoutPaymentMethod>('cash_on_delivery');
//   const [senderNumber, setSenderNumber] = useState('');
//   const [transactionId, setTransactionId] = useState('');
//   const [couponInput, setCouponInput] = useState('');
//   const [couponResult, setCouponResult] = useState<CouponValidationResult | null>(null);
//   const [couponLoading, setCouponLoading] = useState(false);
//   const [checkingExistingAccount, setCheckingExistingAccount] = useState(false);

//   useEffect(() => {
//     let cancelled = false;
//     setCouponInput(typeof window !== 'undefined' ? sessionStorage.getItem(COUPON_STORAGE_KEY)?.trim() ?? '' : '');
//     const savedDraft = typeof window !== 'undefined' ? sessionStorage.getItem(CHECKOUT_DRAFT_STORAGE_KEY) : null;
//     if (savedDraft) {
//       try {
//         const draft = JSON.parse(savedDraft) as { name?: string; mobile?: string; address?: string; addressLine2?: string; postalCode?: string };
//         setName(draft.name ?? ''); setMobile(draft.mobile ?? ''); setAddress(draft.address ?? ''); setAddressLine2(draft.addressLine2 ?? ''); setPostalCode(draft.postalCode ?? '');
//       } catch { sessionStorage.removeItem(CHECKOUT_DRAFT_STORAGE_KEY); }
//     }
//     const guest = !getAuthToken();
//     setIsGuest(guest);

//     (async () => {
//       try {
//         const settingsPromise = getPublicStoreSettings().catch(() => ({ shippingMethods: [] as ShippingMethod[] }));
//         if (guest) {
//           const settings = await settingsPromise;
//           if (cancelled) return;
//           const methods = settings.shippingMethods ?? [];
//           setShippingMethods(methods);
//           setShippingMethodId(methods[0]?.id ?? '');
//           const guestCart = getGuestCart();
//           setCart(guestCart);
//           const missingImages = guestCart.items.filter((item) => !item.product_thumbnail);
//           if (missingImages.length) {
//             void Promise.all(missingImages.map(async (item) => {
//               try {
//                 const product = await fetchProductBySlug(item.product_slug);
//                 return setGuestCartItemThumbnail(item.id, product.thumbnail);
//               } catch {
//                 return null;
//               }
//             })).then(() => {
//               if (!cancelled) setCart(getGuestCart());
//             });
//           }
//           setLoading(false);
//           return;
//         }

//         const [cartData, profile, settings] = await Promise.all([
//           getCart(),
//           getProfile().catch(() => null),
//           settingsPromise,
//         ]);
//         if (cancelled) return;
//         const methods = settings.shippingMethods ?? [];
//         setShippingMethods(methods);
//         setShippingMethodId(methods[0]?.id ?? '');
//         setCart(cartData);
//         if (profile?.user) {
//           setName(profile.user.name ?? '');
//           setMobile(profile.user.mobile ?? '');
//           setAddress(profile.user.address ?? '');
//         }
//       } catch (err) {
//         if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load cart');
//       } finally {
//         if (!cancelled) setLoading(false);
//       }
//     })();

//     return () => {
//       cancelled = true;
//     };
//   }, []);

//   const selectedShippingMethod = useMemo(
//     () => shippingMethods.find((method) => method.id === shippingMethodId) ?? null,
//     [shippingMethods, shippingMethodId]
//   );
//   const shippingExtra = selectedShippingMethod?.extraPrice ?? 0;
//   const couponDiscount = couponResult?.valid ? couponResult.discount_amount ?? 0 : 0;
//   const orderTotal = Math.max(0, (cart?.subtotal ?? 0) - couponDiscount + shippingExtra);

//   const applyCoupon = async () => {
//     const code = couponInput.trim();
//     if (!code || !cart) return;
//     setCouponLoading(true);
//     try {
//       const result = await validateCoupon(code, cart.subtotal, cart.items);
//       setCouponResult(result);
//       if (!result.valid) throw new Error(result.message || 'Coupon is not valid.');
//       sessionStorage.setItem(COUPON_STORAGE_KEY, code);
//       toast.success('Coupon added');
//     } catch (err) {
//       sessionStorage.removeItem(COUPON_STORAGE_KEY);
//       toast.error(err instanceof Error ? err.message : 'Could not apply coupon.');
//     } finally {
//       setCouponLoading(false);
//     }
//   };

//   const showCheckoutError = (message: string, targetId?: string) => {
//     setSubmitError(message);
//     toast.error(message);
//     requestAnimationFrame(() => {
//       const target = document.getElementById(targetId ?? 'checkout-error');
//       target?.scrollIntoView({ behavior: 'smooth', block: 'center' });
//       if (target instanceof HTMLElement) target.focus({ preventScroll: true });
//     });
//   };

//   const removeItem = async (itemId: number) => {
//     setRemovingId(itemId);
//     setSubmitError(null);
//     try {
//       const updated = itemId < 0 ? removeGuestCartItem(itemId) : await removeCartItem(itemId);
//       setCart(updated);
//     } catch (err) {
//       const message = err instanceof Error ? err.message : 'Could not remove item';
//       setSubmitError(message);
//       toast.error(message);
//     } finally {
//       setRemovingId(null);
//     }
//   };

//   const updateItemQuantity = async (item: Cart['items'][number], quantity: number) => {
//     const nextQuantity = Math.max(1, Math.min(quantity, item.max_quantity));
//     if (nextQuantity === item.quantity) return;
//     setUpdatingId(item.id);
//     try {
//       const updated = item.id < 0 ? updateGuestCartItem(item.id, nextQuantity) : await updateCartItem(item.id, nextQuantity);
//       setCart(updated);
//     } catch (err) {
//       showCheckoutError(err instanceof Error ? err.message : 'Could not update quantity.');
//     } finally {
//       setUpdatingId(null);
//     }
//   };

//   const saveCheckoutDraft = () => {
//     sessionStorage.setItem(CHECKOUT_DRAFT_STORAGE_KEY, JSON.stringify({ name, mobile, address, addressLine2, postalCode }));
//   };

//   const placeOrderWithStoredAccount = async (normalizedMobile: string) => {
//     const result = await continueCheckout(normalizedMobile);
//     const user = result.user;
//     const storedAddress = user.address?.trim() ?? '';
//     if (!storedAddress) {
//       throw new Error('This account has no saved address. Please log in to update your profile.');
//     }

//     setAuthToken(result.accessToken);
//     window.dispatchEvent(new Event('profile:updated'));
//     await transferGuestCartToAccount();

//     const { address: orderAddress, addressLine2: orderAddressLine2, postalCode: orderPostalCode } =
//       parseStoredAddress(storedAddress);
//     const resolvedAddress = orderAddress || storedAddress;

//     const coupon = sessionStorage.getItem(COUPON_STORAGE_KEY)?.trim();
//     const order = await createOrder({
//       coupon_code: coupon || null,
//       payment_method: 'cash_on_delivery',
//       payment_type: 'cash_on_delivery',
//       sender_number: null,
//       transaction_id: null,
//       mobile: user.mobile ?? normalizedMobile,
//       address: resolvedAddress,
//       postal_code: orderPostalCode || null,
//       address_line2: orderAddressLine2 || null,
//       shipping_method_id: shippingMethodId || null,
//     });
//     sessionStorage.removeItem(COUPON_STORAGE_KEY);
//     sessionStorage.removeItem(CHECKOUT_DRAFT_STORAGE_KEY);
//     window.dispatchEvent(new Event('cart:changed'));
//     router.push(`/order-success?orderId=${order.id}`);
//   };

//   const handleCreateOrder = async () => {
//     if (!cart?.items.length) return;
//     const normalizedMobile = mobile.replace(/\D/g, '');
//     const trimmedAddress = address.trim();
//     const trimmedAddressLine2 = addressLine2.trim();
//     const trimmedPostalCode = postalCode.trim();

//     if (!validateMobile(normalizedMobile)) {
//       showCheckoutError('Enter a valid Bangladesh mobile number (for example, 01712345678).', 'checkout-mobile');
//       return;
//     }
//     if (shippingMethods.length > 0 && !shippingMethodId) {
//       showCheckoutError('Please select a shipping method.', 'checkout-shipping-methods');
//       return;
//     }

//     if (isGuest) {
//       setCheckingExistingAccount(true);
//       try {
//         if (await guestAccountExists(normalizedMobile)) {
//           setSubmitting(true);
//           setSubmitError(null);
//           try {
//             await placeOrderWithStoredAccount(normalizedMobile);
//           } catch (err) {
//             showCheckoutError(err instanceof Error ? err.message : 'Could not place order with your saved account.');
//           } finally {
//             setSubmitting(false);
//           }
//           return;
//         }
//       } catch (err) {
//         showCheckoutError(err instanceof Error ? err.message : 'Could not check the account for this mobile number.');
//         return;
//       } finally {
//         setCheckingExistingAccount(false);
//       }
//     }

//     if (isGuest && !name.trim()) {
//       showCheckoutError('Name is required to continue as a guest.', 'guest-name');
//       return;
//     }
//     if (!trimmedAddress) {
//       showCheckoutError('Address is required.', 'checkout-address');
//       return;
//     }

//     setSubmitting(true);
//     setSubmitError(null);
//     try {
//       const formattedAddress = formatGuestAddress(
//         trimmedAddress,
//         trimmedAddressLine2,
//         trimmedPostalCode
//       );

//       if (isGuest) {
//         const result = await guestCheckout({
//           name: name.trim(),
//           mobile: normalizedMobile,
//           address: formattedAddress,
//         });
//         setAuthToken(result.accessToken);
//         window.dispatchEvent(new Event('profile:updated'));
//         await transferGuestCartToAccount();
//       }

//       const coupon = sessionStorage.getItem(COUPON_STORAGE_KEY)?.trim();
//       const order = await createOrder({
//         coupon_code: coupon || null,
//         payment_method: 'cash_on_delivery',
//         payment_type: 'cash_on_delivery',
//         sender_number: null,
//         transaction_id: null,
//         mobile: normalizedMobile,
//         address: trimmedAddress,
//         postal_code: trimmedPostalCode || null,
//         address_line2: trimmedAddressLine2 || null,
//         shipping_method_id: shippingMethodId || null,
//       });
//       sessionStorage.removeItem(COUPON_STORAGE_KEY);
//       sessionStorage.removeItem(CHECKOUT_DRAFT_STORAGE_KEY);
//       window.dispatchEvent(new Event('cart:changed'));
//       router.push(`/order-success?orderId=${order.id}`);
//     } catch (err) {
//       const message = err instanceof Error ? err.message : 'Checkout failed. Please try again.';
//       showCheckoutError(message);
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   if (loading) {
//     return (
//       <Container className="py-12">
//         <div className="flex justify-center py-12">
//           <span className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
//         </div>
//       </Container>
//     );
//   }

//   if (error && !cart) {
//     return (
//       <Container className="py-12">
//         <Alert variant="destructive">
//           <AlertDescription>{error}</AlertDescription>
//         </Alert>
//         <Link href="/cart" className="mt-4 inline-block">
//           <Button variant="outline">Back to cart</Button>
//         </Link>
//       </Container>
//     );
//   }

//   if (!cart?.items.length) {
//     return (
//       <Container className="py-12">
//         <Card>
//           <CardHeader>
//             <CardTitle>Checkout</CardTitle>
//             <p className="text-sm text-muted-foreground">Your cart is empty.</p>
//           </CardHeader>
//           <CardContent>
//             <Link href="/shop">
//               <Button>Continue shopping</Button>
//             </Link>
//           </CardContent>
//         </Card>
//       </Container>
//     );
//   }

//   return (
//     <Container className="max-w-6xl py-6 sm:py-8">
//       <h1 className="mb-3 text-xl text-center font-semibold tracking-tight sm:text-2xl">Please fill in the form to order</h1>
//       {/* <p className="mb-6 text-sm text-muted-foreground">
//         {isGuest
//           ? 'Enter your details to create your account and place the order.'
//           : 'Place your order with cash on delivery.'}
//       </p>*/}
//       {submitError ? (
//         <Alert id="checkout-error" variant="destructive" className="mb-4" tabIndex={-1}>
//           <AlertDescription>{submitError}</AlertDescription>
//         </Alert>
//       ) : null}
//       <div className="flex flex-col-reverse gap-6 lg:grid lg:grid-cols-5 lg:gap-8">
//         <div className="order-2 space-y-4 sm:space-y-6 lg:order-none lg:col-span-3">
//           <Card className="overflow-hidden shadow-sm">
//             <CardHeader className="p-4 pb-2 sm:p-6 sm:pb-2">
//               <CardTitle className="text-base sm:text-lg">Delivery details</CardTitle>
//               {/* <p className="text-sm font-normal text-muted-foreground">
//                 {isGuest
//                   ? 'We will create your account from these details.'
//                   : 'Mobile number and delivery address are required to place your order.'}
//               </p> */}
//             </CardHeader>
//             <CardContent className="space-y-4 p-4 pt-2 sm:p-6 sm:pt-2">
//               {isGuest ? (
//                 <>
//                   <div className="space-y-2">
//                     <label htmlFor="guest-name" className="text-sm font-medium">
//                       Name <span className="text-destructive">*</span>
//                     </label>
//                     <Input
//                       id="guest-name"
//                       autoComplete="name"
//                       value={name}
//                       onChange={(e) => setName(e.target.value)}
//                       maxLength={255}
//                       required
//                     />
//                   </div>
//                 </>
//               ) : null}
//               <div className="space-y-2">
//                 <label htmlFor="checkout-mobile" className="text-sm font-medium">
//                   Mobile number <span className="text-destructive">*</span>
//                 </label>
//                 <Input
//                   id="checkout-mobile"
//                   type="tel"
//                   autoComplete="tel"
//                   value={mobile}
//                   onChange={(e) => setMobile(e.target.value.replace(/[^\d\s+-]/g, ''))}
//                   maxLength={20}
//                   placeholder="017xxxxxxxx"
//                   required
//                 />
//                 <p className="text-xs text-muted-foreground">Enter a valid Bangladesh mobile number.</p>
//               </div>
//               <div className="space-y-2">
//                 <label htmlFor="checkout-address" className="text-sm font-medium">
//                   Address <span className="text-destructive">*</span>
//                 </label>
//                 <Input
//                   id="checkout-address"
//                   autoComplete="street-address"
//                   value={address}
//                   onChange={(e) => setAddress(e.target.value)}
//                   maxLength={255}
//                   required
//                   placeholder="House no., road, area"
//                 />
//               </div>
//               {/* <div className="space-y-2">
//                 <label htmlFor="checkout-address-line2" className="text-sm font-medium">
//                   Apartment, suite, etc.
//                 </label>
//                 <Input
//                   id="checkout-address-line2"
//                   autoComplete="address-line2"
//                   value={addressLine2}
//                   onChange={(e) => setAddressLine2(e.target.value)}
//                   maxLength={255}
//                   placeholder="Apartment, suite, unit, floor, etc."
//                 />
//               </div> */}
//               {/* <div className="grid gap-4 sm:grid-cols-2">
//                 <div className="space-y-2">
//                   <label htmlFor="checkout-postal-code" className="text-sm font-medium">
//                     Postal code
//                   </label>
//                   <Input
//                     id="checkout-postal-code"
//                     autoComplete="postal-code"
//                     value={postalCode}
//                     onChange={(e) => setPostalCode(e.target.value)}
//                     maxLength={32}
//                     placeholder="Optional"
//                   />
//                 </div>
//               </div> */}
//             </CardContent>
//           </Card>

//           {shippingMethods.length > 0 ? (
//             <Card className="overflow-hidden shadow-sm">
//               <CardHeader className="p-2 pb-2 sm:p-6 sm:pb-2">
//                 <CardTitle className="text-base sm:text-lg">Shipping method</CardTitle>
//                 {/* <p className="text-sm font-normal text-muted-foreground">
//                   Choose how you would like your order delivered.
//                 </p> */}
//               </CardHeader>
//               <CardContent className="p-0 pt-2 sm:p-6 sm:pt-2">
//                 <CheckoutShippingMethods
//                   methods={shippingMethods}
//                   selectedId={shippingMethodId}
//                   onSelect={setShippingMethodId}
//                 />
//               </CardContent>
//             </Card>
//           ) : null}

//           <Card className="overflow-hidden shadow-sm hidden sm:flex flex-col">
//             <CardHeader className="p-4 pb-2 sm:p-6 sm:pb-2">
//               <CardTitle className="text-base sm:text-lg">Payment</CardTitle>
//             </CardHeader>
//             <CardContent className="p-4 pt-2 sm:p-6 sm:pt-2">
//               <CheckoutPaymentMethods
//                 checkoutMethods={paymentMethods}
//                 bkashMerchantEnabled={false}
//                 paymentMethod={paymentMethod}
//                 onPaymentMethodChange={setPaymentMethod}
//                 senderNumber={senderNumber}
//                 transactionId={transactionId}
//                 onSenderNumberChange={setSenderNumber}
//                 onTransactionIdChange={setTransactionId}
//               />
//             </CardContent>
//           </Card>
//         </div>

//         <div className="order-1 space-y-4 lg:order-none lg:col-span-2">
//           <CheckoutOrderItemsAccordion items={cart.items} removingId={removingId} updatingId={updatingId} onRemoveItem={removeItem} onUpdateItem={updateItemQuantity} />
//           <Card className="shadow-sm lg:sticky lg:top-[calc(var(--header-height)+1rem)]">
//             <CardHeader className="p-4 sm:p-6">
//               <CardTitle className="text-base sm:text-lg">Summary</CardTitle>
//             </CardHeader>
//             <CardContent className="space-y-4 p-4 pt-0 sm:p-6 sm:pt-0">
//               <div className="flex justify-between text-sm">
//                 <span className="text-muted-foreground">Subtotal</span>
//                 <span className="font-medium tabular-nums">{formatCurrency(cart.subtotal)}</span>
//               </div>
//               {shippingExtra > 0 ? (
//                 <div className="flex justify-between text-sm">
//                   <span className="text-muted-foreground">
//                     Shipping{selectedShippingMethod ? ` (${selectedShippingMethod.title})` : ''}
//                   </span>
//                   <span className="font-medium tabular-nums">{formatCurrency(shippingExtra)}</span>
//                 </div>
//               ) : selectedShippingMethod ? (
//                 <div className="flex justify-between text-sm">
//                   <span className="text-muted-foreground">Shipping ({selectedShippingMethod.title})</span>
//                   <span className="font-medium tabular-nums">Free</span>
//                 </div>
//               ) : null}
//               <div className="space-y-2 border-t pt-4">
//                 <label htmlFor="checkout-coupon" className="text-sm font-medium">Coupon code</label>
//                 <div className="flex gap-2">
//                   <Input id="checkout-coupon" value={couponInput} onChange={(e) => { setCouponInput(e.target.value); setCouponResult(null); }} placeholder="Enter code" />
//                   <Button type="button" variant="success" onClick={() => void applyCoupon()} isLoading={couponLoading} disabled={!couponInput.trim()}>Apply</Button>
//                 </div>
//                 {couponResult?.valid ? <p className="text-xs text-green-600">Coupon discount applied.</p> : null}
//                 {couponResult && !couponResult.valid ? <p className="text-xs text-destructive">{couponResult.message || 'Coupon is not valid.'}</p> : null}
//               </div>
//               {couponDiscount > 0 ? (
//                 <div className="flex justify-between text-sm text-green-600">
//                   <span>Discount</span><span className="font-medium tabular-nums">-{formatCurrency(couponDiscount)}</span>
//                 </div>
//               ) : null}
//               <div className="flex justify-between border-t pt-4 text-base font-semibold">
//                 <span>Total</span>
//                 <span className="tabular-nums">{formatCurrency(orderTotal)}</span>
//               </div>
//               <Button fullWidth size="lg" variant="success" onClick={() => void handleCreateOrder()} isLoading={submitting || checkingExistingAccount}>
//                 {isGuest ? 'Place order' : 'Place order'}
//               </Button>
//               <Link href="/cart" className="block text-center text-sm text-muted-foreground hover:text-foreground">
//                 Back to cart
//               </Link>
//             </CardContent>
//           </Card>
//         </div>
//       </div>
//     </Container>
//   );
// }

'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getCart, removeCartItem, updateCartItem } from '@/lib/api/cart';
import { createOrder } from '@/lib/api/checkout';
import { getProfile, guestAccountExists, guestCheckout, continueCheckout } from '@/lib/api/auth';
import { getAuthToken, setAuthToken } from '@/lib/api/client';
import { getGuestCart, removeGuestCartItem, setGuestCartItemThumbnail, transferGuestCartToAccount, updateGuestCartItem } from '@/lib/storefront/guestCart';
import { fetchProductBySlug } from '@/lib/api/products';
import { getPublicStoreSettings, type ShippingMethod } from '@/lib/api/storeSettings';
import type { Cart } from '@/types/cart';
import type { PaymentMethod } from '@/types/payment';
import type { CheckoutPaymentMethod } from '@/lib/api/checkout';
import { CheckoutPaymentMethods } from '@/components/checkout/CheckoutPaymentMethods';
import { CheckoutShippingMethods } from '@/components/checkout/CheckoutShippingMethods';
import { CheckoutOrderItemsAccordion } from '@/components/checkout/CheckoutOrderItemsAccordion';
import { Container, Button, Input, Card, CardContent, CardHeader, CardTitle, Alert, AlertDescription } from '@/components/ui';
import { formatCurrency } from '@/lib/utils/format';
import { toast } from 'sonner';
import { validateCoupon } from '@/lib/api/coupons';
import type { CouponValidationResult } from '@/types/coupon';

const COUPON_STORAGE_KEY = 'checkout_coupon_code';
const CHECKOUT_DRAFT_STORAGE_KEY = 'checkout_guest_draft';

function validateMobile(value: string) {
  return /^01[3-9]\d{8}$/.test(value.replace(/\D/g, ''));
}

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
    setCouponInput(typeof window !== 'undefined' ? sessionStorage.getItem(COUPON_STORAGE_KEY)?.trim() ?? '' : '');
    const savedDraft = typeof window !== 'undefined' ? sessionStorage.getItem(CHECKOUT_DRAFT_STORAGE_KEY) : null;
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft) as { name?: string; mobile?: string; address?: string };
        setName(draft.name ?? ''); 
        setMobile(draft.mobile ?? ''); 
        setAddress(draft.address ?? '');
      } catch { 
        sessionStorage.removeItem(CHECKOUT_DRAFT_STORAGE_KEY); 
      }
    }
    const guest = !getAuthToken();
    setIsGuest(guest);

    (async () => {
      try {
        const settingsPromise = getPublicStoreSettings().catch(() => ({ shippingMethods: [] as ShippingMethod[] }));
        if (guest) {
          const settings = await settingsPromise;
          if (cancelled) return;
          const methods = settings.shippingMethods ?? [];
          setShippingMethods(methods);
          setShippingMethodId(methods[0]?.id ?? '');
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
            })).then(() => {
              if (!cancelled) setCart(getGuestCart());
            });
          }
          setLoading(false);
          return;
        }

        const [cartData, profile, settings] = await Promise.all([
          getCart(),
          getProfile().catch(() => null),
          settingsPromise,
        ]);
        if (cancelled) return;
        const methods = settings.shippingMethods ?? [];
        setShippingMethods(methods);
        setShippingMethodId(methods[0]?.id ?? '');
        setCart(cartData);
        // Pre-fill with user profile data as defaults (can be changed)
        if (profile?.user) {
          setName(profile.user.name ?? '');
          setMobile(profile.user.mobile ?? '');
          setAddress(profile.user.address ?? '');
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
      sessionStorage.setItem(COUPON_STORAGE_KEY, code);
      toast.success('Coupon added');
    } catch (err) {
      sessionStorage.removeItem(COUPON_STORAGE_KEY);
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

  const saveCheckoutDraft = () => {
    sessionStorage.setItem(CHECKOUT_DRAFT_STORAGE_KEY, JSON.stringify({ name, mobile, address }));
  };

  const handleCreateOrder = async () => {
    if (!cart?.items.length) return;
    const normalizedMobile = mobile.replace(/\D/g, '');
    const trimmedAddress = address.trim();
    const trimmedName = name.trim();

    if (!validateMobile(normalizedMobile)) {
      showCheckoutError('Enter a valid Bangladesh mobile number (for example, 01712345678).', 'checkout-mobile');
      return;
    }
    if (shippingMethods.length > 0 && !shippingMethodId) {
      showCheckoutError('Please select a shipping method.', 'checkout-shipping-methods');
      return;
    }
    if (!trimmedName) {
      showCheckoutError('Name is required.', 'guest-name');
      return;
    }
    if (!trimmedAddress) {
      showCheckoutError('Address is required.', 'checkout-address');
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

      const coupon = sessionStorage.getItem(COUPON_STORAGE_KEY)?.trim();
      // Always use current form data for the order
      const order = await createOrder({
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
      sessionStorage.removeItem(COUPON_STORAGE_KEY);
      sessionStorage.removeItem(CHECKOUT_DRAFT_STORAGE_KEY);
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

  return (
    <Container className="max-w-6xl py-6 sm:py-8">
      <h1 className="mb-3 text-md text-center font-bold tracking-tight sm:text-2xl uppercase [word-spacing:3px]">Please fill in the form to order</h1>
      {submitError ? (
        <Alert id="checkout-error" variant="destructive" className="mb-4" tabIndex={-1}>
          <AlertDescription>{submitError}</AlertDescription>
        </Alert>
      ) : null}
      <div className="flex flex-col-reverse gap-6 lg:grid lg:grid-cols-5 lg:gap-8">
        <div className="order-2 space-y-4 sm:space-y-6 lg:order-none lg:col-span-3">
          <Card className="overflow-hidden shadow-sm">
            <CardHeader className="p-4 pb-2 sm:p-6 sm:pb-2">
              <CardTitle className="text-base sm:text-lg">Delivery details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-4 pt-2 sm:p-6 sm:pt-2">
              <div className="space-y-2">
                <label htmlFor="guest-name" className="text-sm font-medium">
                  Name <span className="text-destructive">*</span>
                </label>
                <Input
                  id="guest-name"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={255}
                  required
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
                  onChange={(e) => setMobile(e.target.value.replace(/[^\d\s+-]/g, ''))}
                  maxLength={20}
                  placeholder="017xxxxxxxx"
                  required
                />
                <p className="text-xs text-muted-foreground">Enter a valid Bangladesh mobile number.</p>
              </div>
              <div className="space-y-2">
                <label htmlFor="checkout-address" className="text-sm font-medium">
                  Address <span className="text-destructive">*</span>
                </label>
                <Input
                  id="checkout-address"
                  autoComplete="street-address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  maxLength={255}
                  required
                  placeholder="House no., road, area"
                />
              </div>
            </CardContent>
          </Card>

          {shippingMethods.length > 0 ? (
            <Card className="overflow-hidden shadow-sm">
              <CardHeader className="p-2 pb-2 sm:p-6 sm:pb-2">
                <CardTitle className="text-base sm:text-lg">Shipping method</CardTitle>
              </CardHeader>
              <CardContent className="p-0 pt-2 sm:p-6 sm:pt-2">
                <CheckoutShippingMethods
                  methods={shippingMethods}
                  selectedId={shippingMethodId}
                  onSelect={setShippingMethodId}
                />
              </CardContent>
            </Card>
          ) : null}

          <Card className="overflow-hidden shadow-sm hidden sm:flex flex-col">
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
          <CheckoutOrderItemsAccordion items={cart.items} removingId={removingId} updatingId={updatingId} onRemoveItem={removeItem} onUpdateItem={updateItemQuantity} />
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
              <Button fullWidth size="lg" variant="success" onClick={() => void handleCreateOrder()} isLoading={submitting || checkingExistingAccount}>
                Place order
              </Button>
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