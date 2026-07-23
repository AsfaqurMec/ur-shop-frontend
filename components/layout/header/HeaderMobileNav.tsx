// 'use client';

// import Link from 'next/link';
// import { createPortal } from 'react-dom';
// import type { Category } from '@/types/category';
// import type { SafeUser } from '@/types/auth';
// import { navLinks } from './constants';
// import { getDrawerUserInitials } from './utils';
// import {
//   BagIcon,
//   ChevronDownIcon,
//   CloseIcon,
//   CollectionIcon,
//   DashboardIcon,
//   HomeIcon,
//   OrdersIcon,
//   ProfileIcon,
//   ShopIcon,
//   SignOutIcon,
//   UserIcon,
// } from './HeaderIcons';

// interface HeaderMobileBottomNavProps {
//   pathname: string;
//   cartCount: number;
//   cartBadgeCount: number;
//   accountHref: string;
//   user: SafeUser | null;
//   portalsReady: boolean;
// }

// export function HeaderMobileBottomNav({
//   pathname,
//   cartCount,
//   cartBadgeCount,
//   accountHref,
//   user,
//   portalsReady,
// }: HeaderMobileBottomNavProps) {
//   const mobileBottomLinks = [
//     { href: '/', label: 'Home', icon: <HomeIcon /> },
//     { href: '/shop', label: 'Shop', icon: <ShopIcon /> },
//     { href: '/dashboard/orders', label: 'Orders', icon: <OrdersIcon /> },
//     { href: '/cart', label: 'Cart', icon: <BagIcon /> },
//     { href: user ? accountHref : '/login', label: 'Profile', icon: <ProfileIcon /> },
//   ] as const;

//   const mobileBottomNav = (
//     <nav
//       className="fixed inset-x-0 bottom-0 z-[70] border-t border-border/80 bg-card/95 px-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-2 shadow-[0_-6px_24px_-12px_rgba(0,0,0,0.35)] backdrop-blur supports-[backdrop-filter]:bg-card/95 md:hidden"
//       aria-label="Mobile bottom navigation"
//     >
//       <ul className="mx-auto grid max-w-xl grid-cols-5 gap-1">
//         {mobileBottomLinks.map(({ href, label, icon }) => {
//           const isActive = href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);
//           return (
//             <li key={href}>
//               <Link
//                 href={href}
//                 className={`relative flex min-h-[56px] flex-col items-center justify-center gap-1 rounded-xl px-1 py-1.5 text-[11px] font-medium transition-colors ${
//                   isActive
//                     ? 'bg-accent text-accent-foreground shadow-sm'
//                     : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
//                 }`}
//               >
//                 {icon}
//                 <span className="leading-none">{label}</span>
//                 {href === '/cart' && cartCount > 0 && (
//                   <span className="absolute right-2 top-1.5 inline-flex min-w-4 items-center justify-center rounded-full bg-primary px-1 py-0.5 text-[10px] font-semibold leading-none text-primary-foreground">
//                     {cartBadgeCount}
//                   </span>
//                 )}
//               </Link>
//             </li>
//           );
//         })}
//       </ul>
//     </nav>
//   );

//   return portalsReady ? createPortal(mobileBottomNav, document.body) : null;
// }

// interface HeaderMobileDrawerProps {
//   open: boolean;
//   onClose: () => void;
//   brandName: string;
//   pathname: string;
//   navCategories: Category[];
//   cartCount: number;
//   cartBadgeCount: number;
//   authReady: boolean;
//   user: SafeUser | null;
//   displayName: string;
//   accountHref: string;
//   accountLabel: string;
//   onSignOut: () => void;
//   portalsReady: boolean;
// }

// const drawerAccordionClass =
//   'group overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] shadow-[0_8px_32px_-8px_rgba(0,0,0,0.8)] transition-all duration-200 hover:border-white/20 hover:bg-white/[0.06]';

// const drawerSummaryClass =
//   'flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3.5 transition-colors hover:bg-white/[0.04] [&::-webkit-details-marker]:hidden';

// const drawerLabelClass =
//   'inline-flex items-center gap-2.5 text-[11px] font-bold uppercase tracking-[0.14em] text-white/90';

// export function HeaderMobileDrawer({
//   open,
//   onClose,
//   brandName,
//   pathname,
//   navCategories,
//   cartCount,
//   cartBadgeCount,
//   authReady,
//   user,
//   displayName,
//   accountHref,
//   accountLabel,
//   onSignOut,
//   portalsReady,
// }: HeaderMobileDrawerProps) {
//   if (!portalsReady || !open) return null;

//   return createPortal(
//     <div
//       id="mobile-nav"
//       className="fixed inset-0 z-[80] flex md:hidden bg-black"
//       role="dialog"
//       aria-modal="true"
//       aria-labelledby="mobile-menu-title"
//     >
//       <div className="relative flex h-[100dvh] min-h-0 w-full flex-col overflow-hidden bg-black">
//         {/* Subtle top glow */}
//         <div
//           className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-primary/10 to-transparent"
//           aria-hidden
//         />

//         {/* Header */}
//         <div className="relative flex shrink-0 items-center justify-between gap-3 border-b border-white/10 px-4 py-4 pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] pt-[max(0.75rem,env(safe-area-inset-top))]">
//           <h2 id="mobile-menu-title" className="min-w-0 truncate text-lg font-bold tracking-tight text-white">
//             {brandName}
//           </h2>
//           <button
//             type="button"
//             className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white transition hover:border-white/30 hover:bg-white/10"
//             onClick={onClose}
//             aria-label="Close menu"
//           >
//             <CloseIcon />
//           </button>
//         </div>

//         <div className="relative min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
//           <nav className="flex flex-col gap-4" aria-label="Mobile main">
//             {/* Quick links */}
//             <div className="grid grid-cols-2 gap-3">
//               {navLinks.map(({ href, label }) => {
//                 const active =
//                   href === '/shop' ? pathname === '/shop' : pathname === href || pathname.startsWith(`${href}/`);
//                 const isCart = label === 'Cart';
//                 return (
//                   <Link
//                     key={href}
//                     href={href}
//                     className={`relative flex items-center gap-3 overflow-hidden rounded-2xl border px-3.5 py-3.5 text-sm font-semibold transition-all ${
//                       active
//                         ? 'border-primary/60 bg-primary/15 text-white shadow-[0_0_20px_-4px_hsl(var(--primary)/0.4)]'
//                         : 'border-white/10 bg-white/[0.04] text-white hover:border-white/20 hover:bg-white/[0.08]'
//                     }`}
//                     onClick={onClose}
//                   >
//                     <span
//                       className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
//                         active ? 'bg-primary/30 text-primary-foreground' : 'bg-white/10 text-white/70'
//                       }`}
//                     >
//                       {isCart ? <BagIcon /> : <ShopIcon />}
//                     </span>
//                     <span className="min-w-0 flex-1 text-left leading-tight">
//                       {isCart ? (
//                         <span className="flex flex-col gap-0.5">
//                           <span>{label}</span>
//                           {cartCount > 0 ? (
//                             <span className="inline-flex w-fit items-center rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary-foreground">
//                               {cartBadgeCount} items
//                             </span>
//                           ) : (
//                             <span className="text-[11px] font-normal text-white/45">Your bag</span>
//                           )}
//                         </span>
//                       ) : (
//                         <span className="flex flex-col gap-0.5">
//                           <span>{label}</span>
//                           <span className="text-[11px] font-normal text-white/45">Browse store</span>
//                         </span>
//                       )}
//                     </span>
//                   </Link>
//                 );
//               })}
//             </div>

//             {/* Categories accordion */}
//             <details className={drawerAccordionClass} open>
//               <summary className={drawerSummaryClass}>
//                 <span className={drawerLabelClass}>
//                   <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/25 text-primary ring-1 ring-primary/40">
//                     <CollectionIcon />
//                   </span>
//                   Categories
//                 </span>
//                 <span className="text-white/50">
//                   <ChevronDownIcon />
//                 </span>
//               </summary>
//               <div className="space-y-2 border-t border-white/10 p-4">
//                 <Link
//                   href="/shop"
//                   className="block rounded-xl border border-primary/50 bg-primary/15 px-4 py-3 text-center text-sm font-bold text-white transition hover:bg-primary/25"
//                   onClick={onClose}
//                 >
//                   View all products
//                 </Link>
//                 <div className="flex flex-col gap-1.5">
//                   {navCategories.map((category) => {
//                     const href = `/shop/category/${category.slug}`;
//                     const active = pathname === href || pathname.startsWith(`${href}/`);
//                     return (
//                       <Link
//                         key={category.id}
//                         href={href}
//                         className={`group/cat relative overflow-hidden rounded-xl border px-4 py-2.5 text-sm font-medium transition-all ${
//                           active
//                             ? 'border-primary/50 bg-primary/10 pl-5 text-white'
//                             : 'border-white/8 bg-white/[0.03] text-white/70 hover:border-white/15 hover:bg-white/[0.06] hover:pl-5 hover:text-white'
//                         }`}
//                         onClick={onClose}
//                       >
//                         <span
//                           className={`absolute inset-y-2 left-0 w-0.5 rounded-full bg-primary transition-all ${
//                             active ? 'opacity-100' : 'opacity-0 group-hover/cat:opacity-60'
//                           }`}
//                         />
//                         {category.name}
//                       </Link>
//                     );
//                   })}
//                 </div>
//               </div>
//             </details>

//             {/* Account section */}
//             {!authReady ? null : user ? (
//               <details className={drawerAccordionClass} open>
//                 <summary className={drawerSummaryClass}>
//                   <span className={drawerLabelClass}>
//                     <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/25 text-primary ring-1 ring-primary/40">
//                       <UserIcon />
//                     </span>
//                     Account
//                   </span>
//                   <span className="text-white/50">
//                     <ChevronDownIcon />
//                   </span>
//                 </summary>
//                 <div className="space-y-3 border-t border-white/10 p-4">
//                   <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-3">
//                     <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/70 text-base font-bold text-primary-foreground shadow-md ring-2 ring-primary/40">
//                       {getDrawerUserInitials(displayName || user.email)}
//                     </span>
//                     <div className="min-w-0 flex-1">
//                       <p className="truncate text-sm font-semibold text-white" title={user.email}>
//                         {displayName}
//                       </p>
//                       <p className="truncate text-xs text-white/45" title={user.email}>
//                         {user.email}
//                       </p>
//                     </div>
//                   </div>
//                   <Link
//                     href={accountHref}
//                     className="flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-left text-sm font-semibold text-white transition hover:border-white/20 hover:bg-white/[0.08]"
//                     onClick={onClose}
//                   >
//                     <DashboardIcon /> {accountLabel}
//                   </Link>
//                   <button
//                     type="button"
//                     className="flex w-full items-center gap-3 rounded-xl border border-transparent px-4 py-3 text-left text-sm font-medium text-white/55 transition hover:border-white/10 hover:bg-white/[0.05] hover:text-white"
//                     onClick={onSignOut}
//                   >
//                     <SignOutIcon /> Sign out
//                   </button>
//                 </div>
//               </details>
//             ) : (
//               <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
//                 <p className="text-center text-xs font-medium text-white/50">Sign in to track orders and manage your account</p>
//                 <div className="mt-3 grid gap-2.5">
//                   <Link
//                     href="/login"
//                     className="rounded-xl border border-white/15 bg-white/[0.06] px-4 py-3.5 text-center text-sm font-semibold text-white transition hover:border-white/25 hover:bg-white/10"
//                     onClick={onClose}
//                   >
//                     Sign in
//                   </Link>
//                   <Link
//                     href="/register"
//                     className="rounded-xl bg-primary px-4 py-3.5 text-center text-sm font-bold text-primary-foreground shadow-lg shadow-primary/30 transition hover:brightness-110"
//                     onClick={onClose}
//                   >
//                     Create account
//                   </Link>
//                 </div>
//               </div>
//             )}
//           </nav>
//         </div>
//       </div>
//     </div>,
//     document.body
//   );
// }

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