'use client';

import Link from 'next/link';
import { createPortal } from 'react-dom';
import type { Category } from '@/types/category';
import {
  CloseIcon,
} from './HeaderIcons';
import Image from 'next/image';

// Sporty icon components
const TrophyIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
    <path d="M4 22h16" />
    <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
    <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
  </svg>
);

const SoccerBallIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 2L9.5 9.5L2 12L9.5 14.5L12 22L14.5 14.5L22 12L14.5 9.5L12 2Z" />
    <path d="M12 2L12 9.5" />
    <path d="M22 12L14.5 9.5" />
    <path d="M2 12L9.5 14.5" />
    <path d="M12 22L14.5 14.5" />
  </svg>
);

const JerseyIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4l4-2 4 2 4-2 4 2v16H4V4z" />
    <path d="M8 7h8" />
    <path d="M8 11h8" />
    <path d="M8 15h4" />
  </svg>
);

const FlagIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 21V3" />
    <path d="M4 3h12l-1.5 4.5L16 12H4" />
  </svg>
);

const ShoeIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 16c0-2 1.5-4 4-4h8c2.5 0 4 2 4 4" />
    <path d="M4 16l-2 3h20l-2-3" />
    <path d="M8 12V8" />
    <path d="M16 12V8" />
  </svg>
);

const BackpackIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 10a8 8 0 0 1 16 0v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8z" />
    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <path d="M8 14h8" />
    <path d="M8 18h4" />
  </svg>
);

const CapIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 4a8 8 0 0 0-8 8v4h16v-4a8 8 0 0 0-8-8z" />
    <path d="M6 16v2a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-2" />
    <path d="M10 8l2 2 2-2" />
  </svg>
);

const WatchIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="7" />
    <path d="M12 9v3l2 2" />
    <path d="M9 2l1 3" />
    <path d="M15 2l-1 3" />
    <path d="M9 22l1-3" />
    <path d="M15 22l-1-3" />
  </svg>
);

// Map category names to icons
const getCategoryIcon = (categoryName: string) => {
  const name = categoryName.toLowerCase();
  if (name.includes('world cup') || name.includes('trophy')) return <TrophyIcon />;
  if (name.includes('men') || name.includes('male')) return <SoccerBallIcon />;
  if (name.includes('women') || name.includes('female')) return <SoccerBallIcon />;
  if (name.includes('kid') || name.includes('child') || name.includes('youth')) return <SoccerBallIcon />;
  if (name.includes('shoe') || name.includes('footwear') || name.includes('boot')) return <ShoeIcon />;
  if (name.includes('bag') || name.includes('backpack') || name.includes('duffel')) return <BackpackIcon />;
  if (name.includes('cap') || name.includes('hat') || name.includes('headwear')) return <CapIcon />;
  if (name.includes('watch') || name.includes('accessory')) return <WatchIcon />;
  if (name.includes('jersey') || name.includes('kit') || name.includes('apparel')) return <JerseyIcon />;
  if (name.includes('accessory') || name.includes('gear')) return <WatchIcon />;
  return <FlagIcon />;
};

interface HeaderMobileDrawerProps {
  open: boolean;
  onClose: () => void;
  brandName: string;
  brandlogo: string;
  pathname: string;
  navCategories: Category[];
  portalsReady: boolean;
}

export function HeaderMobileDrawer({
  open,
  onClose,
  brandName,
  brandlogo,
  pathname,
  navCategories,
  portalsReady,
}: HeaderMobileDrawerProps) {
  if (!portalsReady || !open) return null;

  // Group categories - you can customize this based on your category structure
  const mainCategories = navCategories.filter(cat => 
    !cat.parent_id && !cat.name.toLowerCase().includes('collection')
  );
  
  const subCategories = navCategories.filter(cat => 
    cat.parent_id || cat.name.toLowerCase().includes('collection')
  );

  return createPortal(
    <div
      id="mobile-nav"
      className="fixed inset-0 z-[80] flex md:hidden"
      role="dialog"
      aria-modal="true"
      aria-labelledby="mobile-menu-title"
    >
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      
      <div className="relative flex h-[100dvh] min-h-0 w-[85%] max-w-sm flex-col overflow-hidden bg-white shadow-2xl">
        {/* Header with close button */}
        <div className="relative flex shrink-0 items-center justify-between gap-3 border-b border-gray-100 px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center text-primary border rounded-md shadow-sm">
              {/* <TrophyIcon /> */}
              <Image src={brandlogo} alt="" width={60} height={60} className="object-contain rounded-md" priority unoptimized />
            </div>
            <div>
              <h2 id="mobile-menu-title" className="text-lg font-bold tracking-tight text-gray-900 uppercase">
                {brandName}
              </h2>
              <p className="text-[10px] font-medium uppercase tracking-[0.15em] text-primary">
                Premium Men's Collections
              </p>
            </div>
          </div>
          <button
            type="button"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 transition hover:border-gray-300 hover:bg-gray-50 hover:scale-105"
            onClick={onClose}
            aria-label="Close menu"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="relative min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-6">
          <nav className="flex flex-col gap-2" aria-label="Mobile main">
            {/* Main Categories */}
            {mainCategories.map((category) => {
              const href = `/shop/category/${category.slug}`;
              const active = pathname === href || pathname.startsWith(`${href}/`);
              const icon = getCategoryIcon(category.name);
              
              return (
                <Link
                  key={category.id}
                  href={href}
                  className={`group border flex items-center gap-4 rounded-md px-4 py-4 text-base font-semibold transition-all ${
                    active
                      ? 'bg-primary/10 text-primary shadow-md'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-primary'
                  }`}
                  onClick={onClose}
                >
                  <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
                    active
                      ? 'bg-primary/20 text-primary'
                      : 'bg-gray-100 text-gray-500 group-hover:bg-primary/10 group-hover:text-primary'
                  }`}>
                    {icon}
                  </span>
                  <span className="min-w-0 flex-1 text-left">
                    {category.name}
                  </span>
                  <span className={`transition-transform group-hover:translate-x-1 ${
                    active ? 'text-primary' : 'text-gray-600'
                  }`}>
                    <svg width="16" color='#00000' height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </span>
                </Link>
              );
            })}

            {/* Sub Categories / Collections */}
            {subCategories.length > 0 && (
              <>
                <div className="my-2 border-t border-gray-100" />
                <div className="space-y-1">
                  <p className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-gray-400">
                    Collections
                  </p>
                  {subCategories.map((category) => {
                    const href = `/shop/category/${category.slug}`;
                    const active = pathname === href || pathname.startsWith(`${href}/`);
                    const icon = getCategoryIcon(category.name);
                    
                    return (
                      <Link
                        key={category.id}
                        href={href}
                        className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                          active
                            ? 'bg-primary/10 text-primary'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-primary'
                        }`}
                        onClick={onClose}
                      >
                        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                          active
                            ? 'bg-primary/15 text-primary'
                            : 'bg-gray-100 text-gray-400 group-hover:bg-primary/10'
                        }`}>
                          {icon}
                        </span>
                        {category.name}
                      </Link>
                    );
                  })}
                </div>
              </>
            )}

            {/* View All Products */}
            <div className="mt-2 border-t border-gray-100 pt-4">
              <Link
                href="/shop"
                className="flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-3.5 text-center text-sm font-bold text-white shadow-lg shadow-primary/30 transition hover:brightness-110 hover:shadow-primary/50"
                onClick={onClose}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  {/* <path d="M6 9l6 6 6-6" /> */}
                </svg>
                View All Products
              </Link>
            </div>
          </nav>
        </div>

        {/* Footer with brand */}
        <div className="border-t border-gray-100 px-6 py-4">
          <p className="text-center text-[10px] font-medium uppercase tracking-widest text-gray-400">
            {brandName} • {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>,
    document.body
  );
}