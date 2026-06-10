'use client';

import { useState } from 'react';
import { Button } from '@/components/ui';
import { addToCart } from '@/lib/api/cart';
import { createOrder } from '@/lib/api/checkout';
import { guestCheckout } from '@/lib/api/auth';
import { getSafeReturnPath } from '@/lib/auth/returnPath';
import type { AddedToCartSummary } from './AddedToCartModal';
import { useShowAddedToCartModal } from './AddedToCartModalProvider';
import { StorefrontNoticeModal } from './StorefrontNoticeModal';
import { savePendingBuyNowIntent } from '@/lib/storefront/pendingBuyNowIntent';
import { getAuthToken, setAuthToken } from '@/lib/api/client';
import { GuestCheckoutModal, type GuestCheckoutDetails } from './GuestCheckoutModal';
import { OrderPlacedModal } from './OrderPlacedModal';
import { toast } from 'sonner';

const COUPON_STORAGE_KEY = 'checkout_coupon_code';

export interface AddToCartButtonProps {
  productId: number;
  quantity?: number;
  variant?: 'primary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  children?: React.ReactNode;
  /** When set, a confirmation modal is shown after a successful add. */
  productSummary?: AddedToCartSummary;
  /** Purchase variable values (select option keys, email strings). */
  selections?: Record<string, string>;
  /** Prefer this at click time so values match the DOM (e.g. browser autofill). */
  getSelections?: () => Record<string, string>;
  /** When the product uses catalog variations, pass the selected row id. */
  variationId?: number;
  /** Return an error message to block add, or null to proceed. */
  validateBeforeAdd?: () => string | null;
  /** Optional callback after a successful add (e.g. redirect to checkout). */
  onAdded?: () => void | Promise<void>;
  /** If provided, preserves payload for post-login replay and then redirects to this path. */
  resumeAfterLoginRedirect?: string;
  /** When true, unauthenticated buy-now shows a guest form instead of redirecting to login. */
  guestCheckoutOnUnauthorized?: boolean;
  /** When true with guest checkout, places the order immediately after the guest form. */
  placeOrderAfterGuestCheckout?: boolean;
  disabled?: boolean;
}

/** Adds to cart if logged in; redirects to login otherwise. */
export function AddToCartButton({
  productId,
  quantity = 1,
  variant = 'primary',
  size = 'md',
  className = '',
  children = 'Add to cart',
  productSummary,
  selections,
  getSelections,
  variationId,
  validateBeforeAdd,
  onAdded,
  resumeAfterLoginRedirect,
  guestCheckoutOnUnauthorized = false,
  placeOrderAfterGuestCheckout = false,
  disabled = false,
}: AddToCartButtonProps) {
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<{ title: string; message: string } | null>(null);
  const [guestModalOpen, setGuestModalOpen] = useState(false);
  const [guestProcessingMessage, setGuestProcessingMessage] = useState<string | null>(null);
  const [placedOrderId, setPlacedOrderId] = useState<number | null>(null);
  const showAddedToCart = useShowAddedToCartModal();

  const addToCartAndContinue = async () => {
    const payload = getSelections?.() ?? selections;
    await addToCart(productId, quantity, payload, variationId, {
      skip401Redirect: Boolean(resumeAfterLoginRedirect || guestCheckoutOnUnauthorized),
    });
    window.dispatchEvent(new Event('cart:changed'));
    if (onAdded) {
      await onAdded();
      return;
    }
    if (productSummary) {
      showAddedToCart({ name: productSummary.name, imageUrl: productSummary.imageUrl });
    } else {
      toast.success('Added to cart');
    }
  };

  const handleGuestSubmit = async (details: GuestCheckoutDetails) => {
    setGuestProcessingMessage('Creating your account…');
    const result = await guestCheckout(details);
    setAuthToken(result.accessToken);
    window.dispatchEvent(new Event('profile:updated'));

    setGuestProcessingMessage('Adding product to cart…');
    const payload = getSelections?.() ?? selections;
    await addToCart(productId, quantity, payload, variationId, {
      skip401Redirect: true,
    });
    window.dispatchEvent(new Event('cart:changed'));

    if (placeOrderAfterGuestCheckout) {
      setGuestProcessingMessage('Placing your order…');
      const couponCode =
        typeof window !== 'undefined' ? sessionStorage.getItem(COUPON_STORAGE_KEY)?.trim() : '';
      const order = await createOrder({
        coupon_code: couponCode || null,
        payment_method: 'cash_on_delivery',
        payment_type: 'cash_on_delivery',
        sender_number: null,
        transaction_id: null,
        mobile: details.mobile,
        address: details.address,
      });
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem(COUPON_STORAGE_KEY);
      }
      setGuestProcessingMessage(null);
      setPlacedOrderId(order.id);
      return;
    }

    setGuestProcessingMessage(null);
    if (onAdded) {
      await onAdded();
      return;
    }
    toast.success('Added to cart');
  };

  const handleClick = async () => {
    if (validateBeforeAdd) {
      const msg = validateBeforeAdd();
      if (msg) {
        setNotice({ title: "Couldn't add to cart", message: msg });
        return;
      }
    }
    if (guestCheckoutOnUnauthorized && !getAuthToken()) {
      setGuestModalOpen(true);
      return;
    }

    setLoading(true);
    try {
      await addToCartAndContinue();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add to cart';
      if (message.includes('401') || message.includes('Unauthorized')) {
        if (guestCheckoutOnUnauthorized) {
          setGuestModalOpen(true);
          return;
        }
        if (resumeAfterLoginRedirect) {
          savePendingBuyNowIntent({
            productId,
            quantity,
            selections: getSelections?.() ?? selections,
            variationId,
            redirectTo: resumeAfterLoginRedirect,
          });
          window.location.assign('/login?redirect=' + encodeURIComponent(getSafeReturnPath()));
          return;
        }
        return;
      }
      setNotice({
        title: "Couldn't add to cart",
        message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={className}
        onClick={handleClick}
        isLoading={loading}
        disabled={disabled}
      >
        {children}
      </Button>
      <StorefrontNoticeModal
        open={notice !== null}
        title={notice?.title ?? ''}
        message={notice?.message ?? ''}
        onClose={() => setNotice(null)}
      />
      <GuestCheckoutModal
        open={guestModalOpen}
        onClose={() => {
          setGuestModalOpen(false);
          setGuestProcessingMessage(null);
        }}
        onSubmit={handleGuestSubmit}
        processingMessage={guestProcessingMessage}
      />
      <OrderPlacedModal
        open={placedOrderId != null}
        orderId={placedOrderId}
        onClose={() => setPlacedOrderId(null)}
      />
    </>
  );
}
