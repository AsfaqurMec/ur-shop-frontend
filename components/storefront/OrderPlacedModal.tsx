'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { Button } from '@/components/ui';

const DISMISS_SAFE_DELAY_MS = 400;

export interface OrderPlacedModalProps {
  open: boolean;
  orderId: number | null;
  onClose: () => void;
}

export function OrderPlacedModal({ open, orderId, onClose }: OrderPlacedModalProps) {
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

  if (!open || orderId == null) return null;

  const dialog = (
    <div
      className="fixed inset-0 z-[200] flex items-end justify-center p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="order-placed-title"
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
        <h2 id="order-placed-title" className="text-xl font-semibold text-foreground">
          Order placed
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Thank you. Your order has been created and is pending admin review.
        </p>
        <p className="mt-4 text-sm text-foreground">
          Order reference: <strong>#{orderId}</strong>
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Link href="/shop" className="w-full sm:w-auto" onClick={onClose}>
            <Button variant="outline" type="button" className="w-full">
              Continue shopping
            </Button>
          </Link>
          <Link href="/dashboard/orders" className="w-full sm:w-auto" onClick={onClose}>
            <Button type="button" className="w-full">
              View my orders
            </Button>
          </Link>
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
