'use client';

import { useMemo, type CSSProperties } from 'react';
import type { SocialLink } from '@/lib/api/storeSettings';
import { useTheme } from '@/components/theme';

function PhoneHandsetIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
      />
    </svg>
  );
}

function presetClasses(item: SocialLink): { wrap: string; label: string } {
  if (item.accentColor?.trim()) {
    return { wrap: '', label: 'font-semibold' };
  }
  const t = item.label.toLowerCase();
  const href = item.link.toLowerCase();
  if (t.includes('whatsapp') || href.includes('whatsapp') || href.includes('wa.me')) {
    return {
      wrap:
        'border border-emerald-600/35 bg-emerald-50 hover:bg-emerald-100/90 dark:border-emerald-400 dark:bg-emerald-950 dark:hover:bg-emerald-900',
      label: 'text-emerald-900 dark:text-white',
    };
  }
  if (t.includes('messenger') || href.includes('m.me')) {
    return {
      wrap:
        'border border-sky-500/40 bg-sky-50 hover:bg-sky-100/90 dark:border-sky-400 dark:bg-[#0a1628] dark:hover:bg-[#0d1e35]',
      label: 'text-sky-950 dark:text-white',
    };
  }
  if (t.includes('facebook') || href.includes('facebook.com')) {
    return {
      wrap:
        'border border-blue-600/35 bg-sky-50 hover:bg-sky-100/90 dark:border-blue-400 dark:bg-blue-950 dark:hover:bg-blue-900',
      label: 'text-blue-900 dark:text-white',
    };
  }
  if (t.includes('telegram') || href.includes('t.me') || href.includes('telegram')) {
    return {
      wrap:
        'border border-border/80 bg-background hover:bg-muted/50 dark:border-border/70 dark:bg-muted/50 dark:hover:bg-muted/70',
      label: 'font-semibold text-foreground',
    };
  }
  if (item.link.trim().toLowerCase().startsWith('tel:')) {
    return {
      wrap:
        'border border-border/80 bg-background hover:bg-muted/50 dark:border-border/70 dark:bg-muted/50 dark:hover:bg-muted/70',
      label: 'font-semibold text-foreground tabular-nums',
    };
  }
  return {
    wrap:
      'border border-border/70 bg-muted/30 hover:bg-muted/45 dark:border-border/60 dark:bg-muted/40 dark:hover:bg-muted/55',
    label: 'font-semibold text-foreground',
  };
}

export interface ProductSocialContactStripProps {
  links: SocialLink[];
  supportNumber?: string;
}

function toPhoneHref(value: string): string {
  const compact = value.replace(/[^\d+]/g, '');
  if (!compact) return '';
  if (compact.startsWith('+')) return `tel:${compact}`;
  return `tel:${compact.replace(/\+/g, '')}`;
}

/** Contact row for PDP; uses the same admin “floating social” links as the home FAB. Sits below the price card. */
export function ProductSocialContactStrip({ links, supportNumber = '' }: ProductSocialContactStripProps) {
  const { resolved, mounted } = useTheme();
  const supportNumberText = supportNumber.trim();
  const supportNumberHref = toPhoneHref(supportNumberText);

  const accentStyles = useMemo(() => {
    const map = new Map<string, CSSProperties>();
    for (const item of links) {
      const accent = item.accentColor?.trim();
      if (!accent) continue;
      const isDark = mounted && resolved === 'dark';
      map.set(item.id, {
        borderColor: accent,
        backgroundColor: isDark
          ? `color-mix(in srgb, ${accent} 38%, hsl(var(--background)))`
          : `color-mix(in srgb, ${accent} 14%, white)`,
      });
    }
    return map;
  }, [links, mounted, resolved]);

  if (!links.length && !supportNumberHref) return null;

  return (
    <div className="rounded-lg border border-border/80 bg-card px-3 py-2.5 shadow-sm dark:border-border/70 dark:bg-card/90">
      <div className="mb-2 flex items-center gap-2">
        <PhoneHandsetIcon className="h-5 w-5 shrink-0 text-muted-foreground" />
        <p className="text-sm md:text-base lg:text-lg font-bold tracking-tight text-foreground">Contact Us</p>
      </div>
      <div className="mt-3 flex gap-3 md:gap-2 pb-1 flex-wrap ">
        {supportNumberHref ? (
          <a
            href={supportNumberHref}
            className="inline-flex max-w-full shrink-0 items-center gap-1 rounded-md border border-border/80 bg-background px-1 md:px-2.5 py-1.5 text-[10px] md:text-xs font-semibold text-foreground shadow-sm transition-colors hover:bg-muted/50 dark:border-border/70 dark:bg-muted/30 dark:hover:bg-muted/50"
          >
            <PhoneHandsetIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="truncate tabular-nums">{supportNumberText}</span>
          </a>
        ) : null}
        {links.map((item) => {
          const preset = presetClasses(item);
          const accent = item.accentColor?.trim();
          const style = accent ? accentStyles.get(item.id) : undefined;
          const isTel = item.link.trim().toLowerCase().startsWith('tel:');

          return (
            <a
              key={item.id}
              href={item.link}
              {...(isTel ? {} : { target: '_blank' as const, rel: 'noopener noreferrer' })}
              className={`inline-flex max-w-full shrink-0 items-center gap-1 md:gap-1.5 rounded-md px-1 md:px-2 py-1 text-[10px] md:text-xs font-semibold shadow-sm transition-[transform,box-shadow,background-color] hover:shadow active:scale-[0.99] ${accent ? `border ${preset.wrap}` : preset.wrap}`}
              style={style}
            >
              <span className="relative flex h-5 w-5 shrink-0 overflow-hidden rounded-full border border-black/10 bg-white dark:border-white/20 dark:bg-white">
                <img
                  src={item.logo}
                  alt=""
                  className="h-full w-full object-cover object-center"
                />
              </span>
              <span className={`min-w-0 truncate leading-tight ${accent ? 'text-foreground' : preset.label}`}>
                {item.label}
              </span>
            </a>
          );
        })}
      </div>
    </div>
  );
}
