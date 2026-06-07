'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui';

interface StorefrontNoticeModalProps {
  open: boolean;
  title: string;
  message: string;
  onClose: () => void;
  /** Primary button label */
  confirmLabel?: string;
}

export function StorefrontNoticeModal({
  open,
  title,
  message,
  onClose,
  confirmLabel = 'OK',
}: StorefrontNoticeModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center p-0 sm:items-center sm:p-4"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="storefront-notice-title"
      aria-describedby="storefront-notice-desc"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
        aria-label="Close dialog"
        onClick={onClose}
      />
      <div className="relative z-[1] w-full max-w-md rounded-t-2xl border border-border/80 bg-card p-5 shadow-xl sm:rounded-2xl sm:p-6">
        <h2 id="storefront-notice-title" className="text-lg font-semibold text-foreground">
          {title}
        </h2>
        <p id="storefront-notice-desc" className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {message}
        </p>
        <div className="mt-6 flex justify-end">
          <Button type="button" className="w-full sm:w-auto" onClick={onClose}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
