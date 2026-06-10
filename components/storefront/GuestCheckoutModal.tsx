'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Button, Input } from '@/components/ui';

const DISMISS_SAFE_DELAY_MS = 400;

export interface GuestCheckoutDetails {
  name: string;
  email: string;
  mobile: string;
  address: string;
}

export interface GuestCheckoutModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (details: GuestCheckoutDetails) => Promise<void>;
  processingMessage?: string | null;
}

export function GuestCheckoutModal({ open, onClose, onSubmit, processingMessage }: GuestCheckoutModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [address, setAddress] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dismissSafe, setDismissSafe] = useState(false);

  useEffect(() => {
    if (!open) {
      setDismissSafe(false);
      setError(null);
      return;
    }
    setDismissSafe(false);
    const id = window.setTimeout(() => setDismissSafe(true), DISMISS_SAFE_DELAY_MS);
    return () => clearTimeout(id);
  }, [open]);

  useEffect(() => {
    if (!open || !dismissSafe || submitting) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, dismissSafe, submitting, onClose]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        email: email.trim(),
        mobile: mobile.trim(),
        address: address.trim(),
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not place your order');
    } finally {
      setSubmitting(false);
    }
  };

  const dialog = (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="guest-checkout-title"
    >
      <button
        type="button"
        className="absolute inset-0 z-0 bg-black/50 backdrop-blur-[2px]"
        aria-label="Close dialog"
        tabIndex={dismissSafe && !submitting ? 0 : -1}
        onClick={() => {
          if (!dismissSafe || submitting) return;
          onClose();
        }}
      />
      <div
        className="relative z-[1] max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-2xl border border-border/80 bg-card p-5 shadow-xl sm:rounded-2xl sm:p-6"
        {...(!dismissSafe || submitting ? { inert: true } : {})}
      >
        <h2 id="guest-checkout-title" className="text-lg font-semibold text-foreground">
          Place your order
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Enter your details to order. An account is created with your email (password is your email).
        </p>
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {error && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
          {processingMessage && submitting ? (
            <div className="flex items-center gap-3 rounded-lg border border-border/60 bg-muted/40 px-3 py-3 text-sm text-muted-foreground">
              <span className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <span>{processingMessage}</span>
            </div>
          ) : null}
          <div className="space-y-2">
            <label htmlFor="guest-name" className="text-sm font-medium">
              Name <span className="text-destructive">*</span>
            </label>
            <Input
              id="guest-name"
              type="text"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={255}
              disabled={submitting}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="guest-email" className="text-sm font-medium">
              Email <span className="text-destructive">*</span>
            </label>
            <Input
              id="guest-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={submitting}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="guest-mobile" className="text-sm font-medium">
              Mobile number <span className="text-destructive">*</span>
            </label>
            <Input
              id="guest-mobile"
              type="tel"
              autoComplete="tel"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              required
              maxLength={32}
              disabled={submitting}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="guest-address" className="text-sm font-medium">
              Address <span className="text-destructive">*</span>
            </label>
            <textarea
              id="guest-address"
              autoComplete="street-address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
              maxLength={1000}
              rows={3}
              disabled={submitting}
              className="flex min-h-[5.5rem] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
            />
          </div>
          <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" isLoading={submitting}>
              Place order
            </Button>
          </div>
        </form>
      </div>
      {!dismissSafe || submitting ? (
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
