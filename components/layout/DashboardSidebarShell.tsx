'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { usePathname } from 'next/navigation';
import { ThemeToggle } from '@/components/theme';

const CloseSidebarDrawerContext = createContext<(() => void) | null>(null);

/** Call after navigating (e.g. Link onClick) so the mobile drawer closes. */
export function useCloseSidebarDrawer() {
  return useContext(CloseSidebarDrawerContext);
}

type DashboardSidebarShellProps = {
  children: ReactNode;
  /** Sidebar column content (nav + header controls). */
  sidebar: ReactNode;
  /** Shown next to the menu button on small screens. */
  mobileBarTitle: string;
  /** Tailwind width on md+ (e.g. md:w-64). */
  desktopWidthClass: string;
  /** Extra classes on the aside on md+ (borders, shadow). */
  desktopAsideClassName: string;
  /** Background / main column wrapper classes. */
  mainClassName: string;
  mainInnerClassName: string;
};

export function DashboardSidebarShell({
  children,
  sidebar,
  mobileBarTitle,
  desktopWidthClass,
  desktopAsideClassName,
  mainClassName,
  mainInnerClassName,
}: DashboardSidebarShellProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    close();
  }, [pathname, close]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, close]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <CloseSidebarDrawerContext.Provider value={close}>
      <div className="flex min-h-screen flex-col bg-background md:flex-row">
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between gap-3 border-b border-border/80 bg-card px-4 md:hidden">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border/80 bg-background text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              aria-expanded={open}
              aria-controls="dashboard-sidebar-drawer"
              aria-label="Open menu"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.75}
                aria-hidden
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <span className="truncate font-semibold text-foreground">{mobileBarTitle}</span>
          </div>
          <ThemeToggle />
        </header>

        <div
          className={`fixed inset-0 z-40 bg-background/60 backdrop-blur-sm transition-opacity duration-200 md:hidden ${
            open ? 'opacity-100' : 'pointer-events-none opacity-0'
          }`}
          aria-hidden={!open}
          onClick={open ? close : undefined}
        />

        <aside
          id="dashboard-sidebar-drawer"
          className={`
            fixed inset-y-0 left-0 z-50 flex w-[min(20rem,calc(100vw-2.5rem))] max-w-[min(20rem,100vw)] shrink-0 flex-col
            border-r border-border/80 bg-card shadow-lg transition-transform duration-200 ease-out
            md:sticky md:top-0 md:z-0 md:h-screen md:self-start md:max-w-none md:translate-x-0 md:shadow-none
            ${desktopWidthClass}
            ${desktopAsideClassName}
            ${
              open
                ? 'translate-x-0'
                : '-translate-x-full pointer-events-none md:pointer-events-auto md:translate-x-0'
            }
          `}
        >
          <div className="flex h-14 shrink-0 items-center justify-end border-b border-border/60 px-4 md:hidden">
            <button
              type="button"
              onClick={close}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Close menu"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="scrollbar-delight min-h-0 flex-1 overflow-y-auto p-4">{sidebar}</div>
        </aside>

        <main className={`min-w-0 ${mainClassName}`}>
          <div className={`min-w-0 ${mainInnerClassName}`}>{children}</div>
        </main>
      </div>
    </CloseSidebarDrawerContext.Provider>
  );
}
