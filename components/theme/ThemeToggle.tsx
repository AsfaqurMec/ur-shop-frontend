'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { Theme } from './constants';
import { useTheme } from './ThemeProvider';

const options: { value: Theme; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
];

function SunIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
      />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
      />
    </svg>
  );
}

function MonitorIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
      />
    </svg>
  );
}

function IconFor({ theme, resolved }: { theme: Theme; resolved: 'light' | 'dark' }) {
  if (theme === 'system') return <MonitorIcon />;
  return resolved === 'dark' ? <MoonIcon /> : <SunIcon />;
}

export interface ThemeToggleProps {
  /** `header`: compact trigger for nav bars. `menu`: full-width rows for mobile drawer. */
  variant?: 'header' | 'menu';
  className?: string;
}

export function ThemeToggle({ variant = 'header', className = '' }: ThemeToggleProps) {
  const { theme, setTheme, resolved, mounted } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);
  const [menuPos, setMenuPos] = useState({ top: 0, right: 0 });

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      const t = e.target as Node;
      if (ref.current?.contains(t) || menuRef.current?.contains(t)) return;
      setOpen(false);
    };
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [open]);

  useLayoutEffect(() => {
    if (!open) return;
    const update = () => {
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      setMenuPos({ top: r.bottom + 6, right: window.innerWidth - r.right });
    };
    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [open]);

  if (variant === 'menu') {
    return (
      <div className={`space-y-1 ${className}`}>
        <p className="px-3 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Theme</p>
        {options.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => {
              setTheme(value);
              setOpen(false);
            }}
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors ${
              theme === value ? 'bg-accent text-accent-foreground' : 'text-foreground hover:bg-muted'
            }`}
          >
            {value === 'light' && <SunIcon />}
            {value === 'dark' && <MoonIcon />}
            {value === 'system' && <MonitorIcon />}
            {label}
            {theme === value && <span className="ml-auto text-primary">✓</span>}
          </button>
        ))}
      </div>
    );
  }

  const menu = open && (
    <ul
      ref={menuRef}
      className="fixed z-[100] min-w-[10rem] overflow-hidden rounded-xl border border-border bg-popover py-1 text-popover-foreground shadow-lg shadow-black/15 ring-1 ring-black/5 dark:text-popover-foreground dark:shadow-black/50 dark:ring-white/10"
      style={{
        top: menuPos.top,
        right: menuPos.right,
        backgroundColor: 'hsl(var(--popover))',
      }}
      role="listbox"
      aria-label="Choose theme"
    >
      {options.map(({ value, label }) => (
        <li key={value} role="option" aria-selected={theme === value}>
          <button
            type="button"
            onClick={() => {
              setTheme(value);
              setOpen(false);
            }}
            className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium ${
              theme === value
                ? 'bg-accent text-accent-foreground'
                : 'bg-popover text-foreground hover:bg-muted'
            }`}
          >
            {value === 'light' && <SunIcon />}
            {value === 'dark' && <MoonIcon />}
            {value === 'system' && <MonitorIcon />}
            {label}
          </button>
        </li>
      ))}
    </ul>
  );

  return (
    <div className={`relative ${className}`} ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-border bg-muted/60 px-2 text-foreground shadow-sm transition-colors hover:bg-muted hover:text-foreground dark:bg-muted/40 dark:hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={`Theme: ${mounted ? theme : 'system'}. Open menu.`}
      >
        {mounted ? <IconFor theme={theme} resolved={resolved} /> : <MonitorIcon />}
        {/* <span className="text-sm font-medium"></span> */}
      </button>
      {typeof document !== 'undefined' && menu ? createPortal(menu, document.body) : null}
    </div>
  );
}
