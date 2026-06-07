'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui';

/**
 * After open, block closing briefly: the bottom-sheet layout places primary actions where the
 * PDP/grid "Add to cart" control was, so the same pointer-up often hits "Continue shopping"
 * and calls onClose. A full-screen shield eats those events until the gesture is finished.
 */
const DISMISS_SAFE_DELAY_MS = 500;

export interface AddedToCartSummary {
  name: string;
  imageUrl: string | null;
}

interface AddedToCartModalProps {
  open: boolean;
  onClose: () => void;
  product: AddedToCartSummary | null;
}

export function AddedToCartModal({ open, onClose, product }: AddedToCartModalProps) {
  const router = useRouter();
  const [dismissSafe, setDismissSafe] = useState(false);

  useEffect(() => {
    if (!open) {
      setDismissSafe(false);
      return;
    }
    setDismissSafe(false);
    const id = window.setTimeout(() => setDismissSafe(true), DISMISS_SAFE_DELAY_MS);
    return () => clearTimeout(id);
  }, [open]);

  useEffect(() => {
    if (!open || !dismissSafe) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, dismissSafe, onClose]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open || !product) return null;

  const dialog = (
    <div
      className="fixed inset-0 z-[200] flex items-end justify-center p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="added-to-cart-title"
    >
      <button
        type="button"
        className="absolute inset-0 z-0 bg-black/50 backdrop-blur-[2px]"
        aria-label="Close dialog"
        tabIndex={dismissSafe ? 0 : -1}
        onClick={() => {
          if (!dismissSafe) return;
          onClose();
        }}
      />
      <div
        className="relative z-[1] w-full max-w-md rounded-t-2xl border border-border/80 bg-card p-5 shadow-xl sm:rounded-2xl sm:p-6"
        {...(!dismissSafe ? { inert: true } : {})}
      >
        <h2 id="added-to-cart-title" className="text-lg font-semibold text-foreground">
          Added to cart
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">{product.name}</p>
        {product.imageUrl ? (
          <div className="relative mt-4 h-36 w-36 overflow-hidden rounded-xl border border-border/60 bg-muted">
            <img
              src={product.imageUrl}
              alt={product.name}
              className="h-full w-full object-cover"
              loading="eager"
              decoding="async"
              referrerPolicy="no-referrer"
            />
          </div>
        ) : null}
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button
            variant="outline"
            type="button"
            onClick={() => dismissSafe && onClose()}
            className="w-full sm:w-auto"
          >
            Continue shopping
          </Button>
          <Button
            type="button"
            tabIndex={dismissSafe ? undefined : -1}
            className="w-full sm:w-auto"
            onClick={() => {
              if (!dismissSafe) return;
              onClose();
              router.push('/cart');
            }}
          >
            View cart
          </Button>
        </div>
      </div>
      {!dismissSafe ? (
        <div
          className="absolute inset-0 z-[30] touch-none"
          aria-hidden
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          onPointerUp={(e) => e.stopPropagation()}
        />
      ) : null}
    </div>
  );

  if (typeof document === 'undefined') return null;
  return createPortal(dialog, document.body);
}
