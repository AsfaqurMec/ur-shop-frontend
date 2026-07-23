'use client';

import type { PublicStoreSettings } from '@/lib/api/storeSettings';
import {
  HeaderBrand,
  HeaderCategoryNav,
  HeaderDesktopActions,
  HeaderMobileDrawer,
  HeaderTopBar,
  usePublicHeader,
} from '@/components/layout/header';
import { BagIcon, DashboardIcon, MenuIcon, SignOutIcon, UserIcon } from '@/components/layout/header/HeaderIcons';
import Link from 'next/link';
import { createPortal } from 'react-dom';
import { accountMenuItemClass } from './header/constants';

export function PublicHeader({ settings }: { settings?: PublicStoreSettings | null }) {
  const header = usePublicHeader(settings);

  const accountDropdown =
  header.accountMenuOpen && header.user ? (
    <ul
      ref={header.accountMenuRef}
      id="header-account-menu"
      className="fixed z-[100] min-w-[11rem] overflow-hidden rounded-xl border border-border bg-popover py-1 text-popover-foreground shadow-lg shadow-black/15 ring-1 ring-black/5 dark:shadow-black/50 dark:ring-white/10"
      style={{ top: header.accountMenuPos.top, right: header.accountMenuPos.right, backgroundColor: 'hsl(var(--popover))' }}
      role="menu"
      aria-label="Account"
    >
      <li role="none">
        <Link
          href={header.accountHref}
          role="menuitem"
          className={accountMenuItemClass}
          onClick={() => header.setAccountMenuOpen(false)}
        >
          <DashboardIcon /> {header.accountLabel}
        </Link>
      </li>
      <li role="none">
        <button type="button" role="menuitem" className={accountMenuItemClass} onClick={header.handleSignOut}>
          <SignOutIcon /> Sign out
        </button>
      </li>
    </ul>
  ) : null;

  return (
    <>
      <HeaderTopBar
        contactEmail={header.contactEmail}
        contactPhone={header.contactPhone}
        socialLinks={header.socialLinks}
      />

      <header className="sticky top-0 z-50 w-full border-b border-border/80 bg-card/80 backdrop-blur-md supports-[backdrop-filter]:bg-card/70">
        <div className="pattern-header pointer-events-none absolute inset-0 opacity-50 dark:opacity-40" aria-hidden />

        <div className="relative mx-auto flex h-[var(--header-height)] w-full sm:max-w-7xl items-center gap-4 px-1 sm:px-6 lg:px-8">
          <HeaderBrand
            brandName={header.brandName}
            brandLogo={header.brandLogo}
            onNavigate={() => header.setMobileOpen(false)}
          />

          <HeaderCategoryNav pathname={header.pathname} navCategories={header.navCategories} />
          
          <div className='flex'>
           <div className="flex md:hidden">

           <button
              type="button"
              className="relative inline-flex items-center justify-center rounded-lg p-2 text-foreground hover:bg-muted"
              onClick={() => header.setMobileOpen((o) => !o)}
              aria-expanded={header.mobileOpen}
              aria-controls="mobile-nav"
              aria-label={header.mobileOpen ? 'Close menu' : 'Open menu'}
            >
              <MenuIcon open={header.mobileOpen} />
            </button>

           </div>

          <HeaderDesktopActions
            categories={header.categories}
            cartCount={header.cartCount}
            cartBadgeCount={header.cartBadgeCount}
            authReady={header.authReady}
            user={header.user}
            displayName={header.displayName}
            accountHref={header.accountHref}
            accountLabel={header.accountLabel}
            accountMenuOpen={header.accountMenuOpen}
            setAccountMenuOpen={header.setAccountMenuOpen}
            accountTriggerRef={header.accountTriggerRef}
            accountMenuRef={header.accountMenuRef}
            accountMenuPos={header.accountMenuPos}
            portalsReady={header.portalsReady}
            onSignOut={header.handleSignOut}
          />
       </div>


          <Link href={'/'}>
            <span className="pointer absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-2xl font-extrabold italic uppercase tracking-[0.0em] text-red-600 md:hidden">
               UR SHOP
            </span>
          </Link>

          <div className="flex flex-1 items-center justify-end gap-1 md:hidden">

          <Link
        href="/cart"
        className="relative rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        aria-label="Cart"
      >
        <BagIcon />
        {header.cartCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 inline-flex min-w-5 items-center justify-center rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold leading-none text-primary-foreground">
            {header.cartBadgeCount}
          </span>
        )}
      </Link>

      {!header.authReady ? (
        <span className="inline-flex h-9 w-9 items-center justify-center" aria-hidden />
      ) : header.user ? (
        <>
          <button
            type="button"
            ref={header.accountTriggerRef}
            className="relative inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/60 text-foreground shadow-sm transition-colors hover:bg-muted dark:bg-muted/40 dark:hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            aria-expanded={header.accountMenuOpen}
            aria-haspopup="menu"
            aria-controls="header-account-menu"
            title={header.displayName || header.user.email}
            onClick={() => header.setAccountMenuOpen((o) => !o)}
          >
            <UserIcon />
          </button>
          {header.portalsReady && accountDropdown ? createPortal(accountDropdown, document.body) : null}
        </>
      ) : (
        <Link
          href="/login"
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Sign in"
          title="Sign in"
        >
          <UserIcon />
        </Link>
      )}
        
            
          </div>
        </div>

        <HeaderMobileDrawer
          open={header.mobileOpen}
          onClose={() => header.setMobileOpen(false)}
          brandName={header.brandName}
          brandlogo={header.brandLogo}
          pathname={header.pathname}
          navCategories={header.navCategories}
         // cartCount={header.cartCount}
        //  cartBadgeCount={header.cartBadgeCount}
        //  authReady={header.authReady}
        //  user={header.user}
        //  displayName={header.displayName}
        //  accountHref={header.accountHref}
        //  accountLabel={header.accountLabel}
        //  onSignOut={header.handleSignOut}
          portalsReady={header.portalsReady}
        />

        {/* <HeaderMobileBottomNav
          pathname={header.pathname}
          cartCount={header.cartCount}
          cartBadgeCount={header.cartBadgeCount}
          accountHref={header.accountHref}
          user={header.user}
          portalsReady={header.portalsReady}
        /> */}
      </header>
    </>
  );
}
