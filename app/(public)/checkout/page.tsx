'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getCart } from '@/lib/api/cart';
import { createOrder } from '@/lib/api/checkout';
import { getProfile } from '@/lib/api/auth';
import type { Cart } from '@/types/cart';
import type { PaymentMethod } from '@/types/payment';
import type { CheckoutPaymentMethod } from '@/lib/api/checkout';
import { CheckoutPaymentMethods } from '@/components/checkout/CheckoutPaymentMethods';
import { Container } from '@/components/ui';
import { Button, Input } from '@/components/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { Alert, AlertDescription } from '@/components/ui';
import { formatCurrency } from '@/lib/utils/format';
import { storefrontSelectionsSummary } from '@/lib/utils/selectionsSummary';
import { toast } from 'sonner';

const COUPON_STORAGE_KEY = 'checkout_coupon_code';

// Bangladesh mobile number validation function
const validateBangladeshMobile = (number: string): { isValid: boolean; errorMessage?: string } => {
  // Remove any non-digit characters
  const cleaned = number.replace(/\D/g, '');
  
  // Check if empty
  if (!cleaned) {
    return { isValid: false, errorMessage: 'Mobile number is required' };
  }
  
  // Bangladesh mobile number pattern: 01 followed by 9 digits (total 11 digits)
  // Valid prefixes: 013, 014, 015, 016, 017, 018, 019
  const bangladeshMobileRegex = /^01[3-9]\d{8}$/;
  
  if (!bangladeshMobileRegex.test(cleaned)) {
    return { 
      isValid: false, 
      errorMessage: 'Please enter a valid Bangladesh mobile number (e.g., 01712345678)' 
    };
  }
  
  // Additional validation for specific operator prefixes
  const validPrefixes = ['013', '014', '015', '016', '017', '018', '019'];
  const prefix = cleaned.substring(0, 3);
  
  if (!validPrefixes.includes(prefix)) {
    return {
      isValid: false,
      errorMessage: 'Invalid mobile operator prefix. Valid prefixes: 013, 014, 015, 016, 017, 018, 019'
    };
  }
  
  return { isValid: true };
};

// Format mobile number for display
const formatBangladeshMobile = (number: string): string => {
  const cleaned = number.replace(/\D/g, '');
  if (cleaned.length === 11) {
    return cleaned;
  }
  return number;
};

export default function CheckoutPage() {
  const router = useRouter();
  const [cart, setCart] = useState<Cart | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<CheckoutPaymentMethod>('cash_on_delivery');
  const [senderNumber, setSenderNumber] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mobile, setMobile] = useState('');
  const [mobileError, setMobileError] = useState<string | null>(null);
  const [address, setAddress] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const couponCode =
    typeof window !== 'undefined' ? sessionStorage.getItem(COUPON_STORAGE_KEY) : null;
  const couponToSend = couponCode?.trim() || undefined;


  useEffect(() => {
    if (!cart || cart.items.length === 0) return;
  
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', 'InitiateCheckout', {
        value: Number(cart.subtotal),
        currency: 'BDT',
        num_items: cart.items.reduce((sum, item) => sum + item.quantity, 0),
        contents: cart.items.map((item) => ({
          id: String(item.product_id ?? item.id),
          quantity: item.quantity,
        })),
        content_type: 'product',
      });
    }
  }, [cart]);




  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [cartData, profileRes] = await Promise.all([getCart(), getProfile().catch(() => null)]);
        if (!cancelled) {
          setCart(cartData);
          setPaymentMethods([]);
          setPaymentMethod('cash_on_delivery');
          if (profileRes?.user) {
            const userMobile = profileRes.user.mobile ?? '';
            setMobile(userMobile);
            // Validate stored mobile number
            if (userMobile) {
              const validation = validateBangladeshMobile(userMobile);
              if (!validation.isValid) {
                setMobileError(validation.errorMessage || 'Invalid mobile number');
              }
            }
            setAddress(profileRes.user.address ?? '');
          }
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

  const handleMobileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow only digits, spaces, plus sign, and hyphen
    const filtered = value.replace(/[^\d\s\+-]/g, '');
    setMobile(filtered);
    
    // Clear mobile error when user starts typing
    if (mobileError) {
      setMobileError(null);
    }
  };

  const handleMobileBlur = () => {
    if (mobile.trim()) {
      const validation = validateBangladeshMobile(mobile);
      if (!validation.isValid) {
        setMobileError(validation.errorMessage || 'Invalid mobile number');
      } else {
        // Format the number on blur
        setMobile(formatBangladeshMobile(mobile));
        setMobileError(null);
      }
    } else {
      setMobileError('Mobile number is required');
    }
  };

  const handleCreateOrder = async () => {
    if (!cart || cart.items.length === 0) return;
    
    const trimmedMobile = mobile.trim();
    const trimmedAddress = address.trim();
    
    // Validate mobile number before submission
    const mobileValidation = validateBangladeshMobile(trimmedMobile);
    if (!mobileValidation.isValid) {
      const errorMsg = mobileValidation.errorMessage || 'Please enter a valid Bangladesh mobile number';
      setMobileError(errorMsg);
      setSubmitError(errorMsg);
      toast.error(errorMsg);
      return;
    }
    
    if (!trimmedAddress) {
      const msg = 'Address is required';
      setSubmitError(msg);
      toast.error(msg);
      return;
    }
    
    setSubmitting(true);
    setSubmitError(null);
    try {
      const order = await createOrder({
        coupon_code: couponToSend ?? null,
        payment_method: 'cash_on_delivery',
        payment_type: 'cash_on_delivery',
        sender_number: null,
        transaction_id: null,
        mobile: formatBangladeshMobile(trimmedMobile),
        address: trimmedAddress,
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
              <CardTitle className="text-base sm:text-lg">Delivery details</CardTitle>
              <p className="text-sm font-normal leading-relaxed text-muted-foreground text-pretty">
                Mobile number and address are required to place your order.
              </p>
            </CardHeader>
            <CardContent className="space-y-4 p-4 pt-2 sm:p-6 sm:pt-2">
              <div className="space-y-2">
                <label htmlFor="checkout-mobile" className="text-sm font-medium">
                  Mobile number <span className="text-destructive">*</span>
                </label>
                <Input
                  id="checkout-mobile"
                  type="tel"
                  autoComplete="tel"
                  value={mobile}
                  onChange={handleMobileChange}
                  onBlur={handleMobileBlur}
                  required
                  maxLength={20}
                  placeholder="017xxxxxxxx"
                  className={mobileError ? 'border-destructive' : ''}
                />
                {mobileError && (
                  <p className="mt-1 text-xs text-destructive">
                    {mobileError}
                  </p>
                )}
                <p className="mt-1 text-xs text-muted-foreground">
                  Enter a valid Bangladesh mobile number
                </p>
              </div>
              <div className="space-y-2">
                <label htmlFor="checkout-address" className="text-sm font-medium">
                  Address <span className="text-destructive">*</span>
                </label>
                <textarea
                  id="checkout-address"
                  autoComplete="street-address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required
                  maxLength={1000}
                  rows={3}
                  className="flex min-h-[5.5rem] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
            </CardContent>
          </Card>

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

// 'use client';

// import { useEffect, useState } from 'react';
// import { useRouter } from 'next/navigation';
// import Link from 'next/link';
// import { getCart } from '@/lib/api/cart';
// import { createOrder } from '@/lib/api/checkout';
// import { getProfile } from '@/lib/api/auth';
// import type { Cart } from '@/types/cart';
// import type { PaymentMethod } from '@/types/payment';
// import type { CheckoutPaymentMethod } from '@/lib/api/checkout';
// import { CheckoutPaymentMethods } from '@/components/checkout/CheckoutPaymentMethods';
// import { Container } from '@/components/ui';
// import { Button, Input } from '@/components/ui';
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
// import { Alert, AlertDescription } from '@/components/ui';
// import { formatCurrency } from '@/lib/utils/format';
// import { storefrontSelectionsSummary } from '@/lib/utils/selectionsSummary';
// import { toast } from 'sonner';

// const COUPON_STORAGE_KEY = 'checkout_coupon_code';

// export default function CheckoutPage() {
//   const router = useRouter();
//   const [cart, setCart] = useState<Cart | null>(null);
//   const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
//   const [paymentMethod, setPaymentMethod] = useState<CheckoutPaymentMethod>('cash_on_delivery');
//   const [senderNumber, setSenderNumber] = useState('');
//   const [transactionId, setTransactionId] = useState('');
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//   const [mobile, setMobile] = useState('');
//   const [address, setAddress] = useState('');
//   const [submitting, setSubmitting] = useState(false);
//   const [submitError, setSubmitError] = useState<string | null>(null);

//   const couponCode =
//     typeof window !== 'undefined' ? sessionStorage.getItem(COUPON_STORAGE_KEY) : null;
//   const couponToSend = couponCode?.trim() || undefined;

//   useEffect(() => {
//     let cancelled = false;
//     (async () => {
//       try {
//         const [cartData, profileRes] = await Promise.all([getCart(), getProfile().catch(() => null)]);
//         if (!cancelled) {
//           setCart(cartData);
//           setPaymentMethods([]);
//           setPaymentMethod('cash_on_delivery');
//           if (profileRes?.user) {
//             setMobile(profileRes.user.mobile ?? '');
//             setAddress(profileRes.user.address ?? '');
//           }
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

//   const handleCreateOrder = async () => {
//     if (!cart || cart.items.length === 0) return;
//     const trimmedMobile = mobile.trim();
//     const trimmedAddress = address.trim();
//     if (!trimmedMobile || !trimmedAddress) {
//       const msg = 'Mobile number and address are required';
//       setSubmitError(msg);
//       toast.error(msg);
//       return;
//     }
//     setSubmitting(true);
//     setSubmitError(null);
//     try {
//       const order = await createOrder({
//         coupon_code: couponToSend ?? null,
//         payment_method: 'cash_on_delivery',
//         payment_type: 'cash_on_delivery',
//         sender_number: null,
//         transaction_id: null,
//         mobile: trimmedMobile,
//         address: trimmedAddress,
//       });
//       sessionStorage.removeItem(COUPON_STORAGE_KEY);
//       router.push(`/order-success?orderId=${order.id}`);
//     } catch (err) {
//       const msg = err instanceof Error ? err.message : 'Checkout failed. Please try again.';
//       setSubmitError(msg);
//       toast.error(msg);
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

//   if (!cart || cart.items.length === 0) {
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
//       <h1 className="mb-1 text-xl font-semibold tracking-tight sm:text-2xl">Checkout</h1>
//       <p className="mb-6 text-sm leading-relaxed text-muted-foreground text-pretty">
//         Place your order with cash on delivery. Admin will review and update the order status.
//       </p>
//       {submitError && (
//         <Alert variant="destructive" className="mb-4">
//           <AlertDescription>{submitError}</AlertDescription>
//         </Alert>
//       )}
//       <div className="flex flex-col gap-6 lg:grid lg:grid-cols-5 lg:gap-8">
//         <div className="order-2 space-y-4 sm:space-y-6 lg:order-none lg:col-span-3">
//           <Card className="overflow-hidden shadow-sm">
//             <CardHeader className="p-4 pb-2 sm:p-6 sm:pb-2">
//               <CardTitle className="text-base sm:text-lg">Delivery details</CardTitle>
//               <p className="text-sm font-normal leading-relaxed text-muted-foreground text-pretty">
//                 Mobile number and address are required to place your order.
//               </p>
//             </CardHeader>
//             <CardContent className="space-y-4 p-4 pt-2 sm:p-6 sm:pt-2">
//               <div className="space-y-2">
//                 <label htmlFor="checkout-mobile" className="text-sm font-medium">
//                   Mobile number <span className="text-destructive">*</span>
//                 </label>
//                 <Input
//                   id="checkout-mobile"
//                   type="tel"
//                   autoComplete="tel"
//                   value={mobile}
//                   onChange={(e) => setMobile(e.target.value)}
//                   required
//                   maxLength={32}
//                 />
//               </div>
//               <div className="space-y-2">
//                 <label htmlFor="checkout-address" className="text-sm font-medium">
//                   Address <span className="text-destructive">*</span>
//                 </label>
//                 <textarea
//                   id="checkout-address"
//                   autoComplete="street-address"
//                   value={address}
//                   onChange={(e) => setAddress(e.target.value)}
//                   required
//                   maxLength={1000}
//                   rows={3}
//                   className="flex min-h-[5.5rem] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
//                 />
//               </div>
//             </CardContent>
//           </Card>

//           <Card className="overflow-hidden shadow-sm">
//             <CardHeader className="p-4 pb-2 sm:p-6 sm:pb-2">
//               <CardTitle className="text-base sm:text-lg">Payment</CardTitle>
//               <p className="text-sm font-normal leading-relaxed text-muted-foreground text-pretty">
//                 Cash on delivery is currently the only available payment option.
//               </p>
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

//           <Card className="overflow-hidden">
//             <CardHeader className="p-4 sm:p-6">
//               <CardTitle className="text-base sm:text-lg">Order items</CardTitle>
//             </CardHeader>
//             <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
//               <ul className="divide-y divide-border/60">
//                 {cart.items.map((item) => {
//                   const summaryRows = storefrontSelectionsSummary(item.selections_summary);
//                   return (
//                     <li
//                       key={item.id}
//                       className="flex flex-col gap-1 py-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4"
//                     >
//                       <div className="min-w-0">
//                         <Link href={`/products/${item.product_slug}`} className="font-medium text-primary hover:underline">
//                           {item.product_name}
//                         </Link>
//                         <p className="text-sm text-muted-foreground">
//                           {formatCurrency(item.unit_price)} x {item.quantity}
//                         </p>
//                         {summaryRows.length ? (
//                           <ul className="mt-2 space-y-0.5 text-xs text-muted-foreground">
//                             {summaryRows.map((row) => (
//                               <li key={`${item.id}-${row.label}`}>
//                                 <span className="font-medium text-foreground/80">{row.label}:</span> {row.value}
//                               </li>
//                             ))}
//                           </ul>
//                         ) : null}
//                       </div>
//                       <span className="shrink-0 font-medium tabular-nums sm:text-right">
//                         {formatCurrency(item.line_total)}
//                       </span>
//                     </li>
//                   );
//                 })}
//               </ul>
//             </CardContent>
//           </Card>
//         </div>
//         <div className="order-2 sm:order-1 lg:order-none lg:col-span-2">
//           <Card className="shadow-sm lg:sticky lg:top-[calc(var(--header-height)+1rem)]">
//             <CardHeader className="p-4 sm:p-6">
//               <CardTitle className="text-base sm:text-lg">Summary</CardTitle>
//             </CardHeader>
//             <CardContent className="space-y-4 p-4 pt-0 sm:p-6 sm:pt-0">
//               <div className="flex justify-between text-sm">
//                 <span className="text-muted-foreground">Subtotal</span>
//                 <span className="font-medium tabular-nums">{formatCurrency(cart.subtotal)}</span>
//               </div>
//               {couponToSend && (
//                 <p className="rounded-md bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
//                   Coupon <strong className="text-foreground">{couponToSend}</strong> will be applied.
//                 </p>
//               )}
//               <div className="border-t pt-4">
//                 <Button fullWidth size="lg" onClick={handleCreateOrder} isLoading={submitting}>
//                   Place order
//                 </Button>
//               </div>
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
