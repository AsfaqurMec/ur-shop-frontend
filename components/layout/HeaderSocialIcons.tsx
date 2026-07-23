'use client';

import type { SocialLink } from '@/lib/api/storeSettings';

export function HeaderSocialIcons({ links, footer }: { links: SocialLink[], footer?: boolean }) {
  if (!links.length) return null;

  return (
    <div className="flex items-center gap-2">
      {links.map((item) => {
        const accent = item.accentColor?.trim() || 'hsl(var(--primary))';
        return (
          <a
            key={item.id}
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            title={item.label}
            aria-label={item.label}
            className={`group flex ${footer ? 'h-10 w-10' : 'h-7 w-7'} items-center justify-center overflow-hidden rounded-full border border-white/20 transition-transform hover:scale-110 hover:border-amber-400/60`}
            style={{ backgroundColor: accent }}
          >
            <img src={item.logo} alt="" className="h-full w-full object-cover object-center" />
          </a>
        );
      })}
    </div>
  );
}
