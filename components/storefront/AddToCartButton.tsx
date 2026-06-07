'use client';

import { useState } from 'react';
import { Button } from '@/components/ui';
import { addToCart } from '@/lib/api/cart';
import { getSafeReturnPath } from '@/lib/auth/returnPath';
import type { AddedToCartSummary } from './AddedToCartModal';
import { useShowAddedToCartModal } from './AddedToCartModalProvider';
import { StorefrontNoticeModal } from './StorefrontNoticeModal';
import { savePendingBuyNowIntent } from '@/lib/storefront/pendingBuyNowIntent';
import { toast } from 'sonner';

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
  disabled = false,
}: AddToCartButtonProps) {
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<{ title: string; message: string } | null>(null);
  const showAddedToCart = useShowAddedToCartModal();

  const handleClick = async () => {
    if (validateBeforeAdd) {
      const msg = validateBeforeAdd();
      if (msg) {
        setNotice({ title: "Couldn't add to cart", message: msg });
        return;
      }
    }
    setLoading(true);
    try {
      const payload = getSelections?.() ?? selections;
      await addToCart(productId, quantity, payload, variationId, {
        skip401Redirect: Boolean(resumeAfterLoginRedirect),
      });
      window.dispatchEvent(new Event('cart:changed'));
      if (onAdded) {
        await onAdded();
        return;
      }
      // Do not call router.refresh() here: it revalidates route segments and can remount layout
      // client trees, clearing modal state and/or racing with the dialog open gesture.
      if (productSummary) {
        showAddedToCart({ name: productSummary.name, imageUrl: productSummary.imageUrl });
      } else {
        toast.success('Added to cart');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add to cart';
      if (message.includes('401') || message.includes('Unauthorized')) {
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
        // api client redirects to /login?redirect=…; avoid flashing an error modal during navigation
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
    </>
  );
}
