'use client';

import { useCallback, useEffect, useState } from 'react';
import type { SocialLink } from '@/lib/api/storeSettings';

function ChatBubbleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
      />
    </svg>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.25} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

export interface SocialSpeedDialProps {
  links: SocialLink[];
}

/**
 * Bottom-right floating action button; expands into a vertical list of social links (managed in admin settings).
 */
export function SocialSpeedDial({ links }: SocialSpeedDialProps) {
  const [open, setOpen] = useState(false);

  const close = useCallback(() => setOpen(false), []);
  const toggle = useCallback(() => setOpen((o) => !o), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, close]);

  if (!links.length) return null;

  const staggerMs = 52;
  const collapseStaggerMs = 28;

  return (
    <div className="pointer-events-none fixed bottom-[calc(6.8rem+env(safe-area-inset-bottom))] right-3 z-[100] md:bottom-8 md:right-3">
      {open ? (
        <button
          type="button"
          className="fixed inset-0 z-0 bg-black/25 opacity-100 backdrop-blur-[1px] transition-opacity duration-300 ease-out md:bg-black/20"
          aria-label="Close social menu"
          onClick={close}
        />
      ) : null}
      <div className="pointer-events-auto relative z-[1] flex flex-col items-end gap-3">
        <div
          className={`flex flex-col items-end gap-3 ${open ? '' : 'pointer-events-none'}`}
          aria-hidden={!open}
        >
          {links.map((item, index) => {
            const accent = item.accentColor?.trim() || 'hsl(var(--primary))';
            const n = links.length;
            /** Bottom row (closest to FAB) appears first when opening */
            const openDelay = Math.min((n - 1 - index) * staggerMs, 320);
            const closeDelay = Math.min(index * collapseStaggerMs, 200);
            return (
              <a
                key={item.id}
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className={`group flex origin-bottom-right items-center gap-2.5 outline-none transition-[transform,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                  open ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-3 scale-95 opacity-0'
                }`}
                style={{
                  transitionDelay: open ? `${openDelay}ms` : `${closeDelay}ms`,
                }}
                onClick={() => setOpen(false)}
              >
                <span
                  className="max-w-[11rem] truncate rounded-full px-3.5 py-1.5 text-sm font-bold text-white shadow-md shadow-black/15"
                  style={{ backgroundColor: accent }}
                >
                  {item.label}
                </span>
                <span
                  className="relative flex h-12 w-12 shrink-0 overflow-hidden rounded-full border-2 border-white/90 shadow-lg shadow-black/20"
                  style={{ backgroundColor: accent }}
                >
                  <img
                    src={item.logo}
                    alt=""
                    className="block h-full w-full rounded-full object-cover object-center"
                  />
                </span>
              </a>
            );
          })}
        </div>

        <div className="relative">
          <div
            className="pointer-events-none absolute inset-0 scale-125 rounded-full bg-primary/25 blur-xl dark:bg-primary/30"
            aria-hidden
          />
          <button
            type="button"
            onClick={toggle}
            className="relative flex h-14 w-14 items-center justify-center rounded-full border-2 border-white/90 bg-primary text-primary-foreground shadow-xl shadow-primary/35 transition-[transform,box-shadow] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-primary/95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-95"
            aria-expanded={open}
            aria-haspopup="true"
            aria-label={open ? 'Close social links menu' : 'Open social links menu'}
          >
            <span className="inline-flex transition-opacity duration-200 ease-out">
              {open ? <CloseIcon className="h-7 w-7" /> : <ChatBubbleIcon className="h-7 w-7" />}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
