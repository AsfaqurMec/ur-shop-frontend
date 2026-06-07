'use client';

import { useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';

export interface AdminAccordionSectionProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  defaultOpen?: boolean;
  badge?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}

export function AdminAccordionSection({
  title,
  description,
  icon,
  defaultOpen = true,
  badge,
  children,
  className,
  contentClassName,
}: AdminAccordionSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section
      className={cn(
        'overflow-hidden rounded-xl border border-border/80 bg-card/40 shadow-sm backdrop-blur-sm transition-shadow',
        open && 'ring-1 ring-border/60 shadow-md',
        className
      )}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-start gap-3 px-4 py-3.5 text-left transition-colors hover:bg-muted/30"
        aria-expanded={open}
      >
        {icon ? (
          <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            {icon}
          </span>
        ) : null}
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className="text-base font-semibold tracking-tight text-foreground">{title}</span>
            {badge}
          </span>
          {description ? (
            <span className="mt-0.5 block text-sm text-muted-foreground">{description}</span>
          ) : null}
        </span>
        <span
          className={cn(
            'mt-1 flex size-8 shrink-0 items-center justify-center rounded-md border border-border/60 bg-background/80 text-muted-foreground transition-transform',
            open && 'rotate-180'
          )}
          aria-hidden
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </button>
      {open && (
        <div className={cn('border-t border-border/60 bg-card/30 px-4 py-4', contentClassName)}>{children}</div>
      )}
    </section>
  );
}
