'use client';

import { useState } from 'react';
import { Button } from '@/components/ui';
import { addToCart } from '@/lib/api/cart';
import { guestCheckout } from '@/lib/api/auth';
import { getSafeReturnPath } from '@/lib/auth/returnPath';
import type { AddedToCartSummary } from './AddedToCartModal';
import { useShowAddedToCartModal } from './AddedToCartModalProvider';
import { StorefrontNoticeModal } from './StorefrontNoticeModal';
import { savePendingBuyNowIntent } from '@/lib/storefront/pendingBuyNowIntent';
import { getAuthToken, setAuthToken } from '@/lib/api/client';
import { GuestCheckoutModal, type GuestCheckoutDetails } from './GuestCheckoutModal';
import { toast } from 'sonner';
import { addGuestCartItem, type GuestCartItemInput } from '@/lib/storefront/guestCart';

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
  /** Item snapshot used when a guest adds this configured product to their local cart. */
  getGuestCartItem?: () => GuestCartItemInput;
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
  getGuestCartItem,
  disabled = false,
}: AddToCartButtonProps) {
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<{ title: string; message: string } | null>(null);
  const [guestModalOpen, setGuestModalOpen] = useState(false);
  const [guestProcessingMessage, setGuestProcessingMessage] = useState<string | null>(null);
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
    if (!getAuthToken() && getGuestCartItem) {
      setLoading(true);
      try {
        addGuestCartItem(getGuestCartItem());
        if (onAdded) {
          await onAdded();
        } else if (productSummary) {
          showAddedToCart({ name: productSummary.name, imageUrl: productSummary.imageUrl });
        } else {
          toast.success('Added to cart');
        }
      } catch (err) {
        setNotice({ title: "Couldn't add to cart", message: err instanceof Error ? err.message : 'Failed to add to cart' });
      } finally {
        setLoading(false);
      }
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
    </>
  );
}
