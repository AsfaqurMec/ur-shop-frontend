'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { getAuthToken, clearAuthToken } from '@/lib/api/client';
import { getProfile } from '@/lib/api/auth';
import { getCart } from '@/lib/api/cart';
import { getGuestCart } from '@/lib/storefront/guestCart';
import { fetchCategories } from '@/lib/api/categories';
import { getPublicStoreSettings } from '@/lib/api/storeSettings';
import type { SafeUser } from '@/types/auth';
import type { Category } from '@/types/category';
import { SITE_NAME } from '@/lib/seo/site';
import type { PublicStoreSettings } from '@/lib/api/storeSettings';
import { getNavCategories } from './utils';

export function usePublicHeader(settings?: PublicStoreSettings | null) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<SafeUser | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [liveSettings, setLiveSettings] = useState<PublicStoreSettings | null>(settings ?? null);
  const [categories, setCategories] = useState<Category[]>([]);
  const accountTriggerRef = useRef<HTMLButtonElement>(null);
  const accountMenuRef = useRef<HTMLUListElement>(null);
  const [accountMenuPos, setAccountMenuPos] = useState({ top: 0, right: 0 });
  const [portalsReady, setPortalsReady] = useState(false);

  useEffect(() => {
    setPortalsReady(true);
  }, []);

  useEffect(() => {
    let cancelled = false;
    getPublicStoreSettings()
      .then((data) => {
        if (!cancelled) setLiveSettings(data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchCategories()
      .then((data) => {
        if (!cancelled) setCategories(data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      setUser(null);
      setAuthReady(true);
      return;
    }
    let cancelled = false;
    getProfile()
      .then((data) => {
        if (!cancelled) setUser(data.user);
      })
      .catch(() => {
        if (!cancelled) setUser(null);
      })
      .finally(() => {
        if (!cancelled) setAuthReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [mobileOpen]);

  useEffect(() => {
    const onProfileUpdated = () => {
      const token = getAuthToken();
      if (!token) return;
      void getProfile()
        .then((data) => setUser(data.user))
        .catch(() => setUser(null));
    };
    window.addEventListener('profile:updated', onProfileUpdated);
    return () => window.removeEventListener('profile:updated', onProfileUpdated);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const loadCartCount = async () => {
      const token = getAuthToken();
      if (!token) {
        if (!cancelled) setCartCount(getGuestCart().item_count);
        return;
      }
      try {
        const cart = await getCart();
        if (!cancelled) setCartCount(cart.item_count);
      } catch {
        if (!cancelled) setCartCount(0);
      }
    };
    const handleCartChanged = () => {
      void loadCartCount();
    };
    void loadCartCount();
    window.addEventListener('cart:changed', handleCartChanged);
    return () => {
      cancelled = true;
      window.removeEventListener('cart:changed', handleCartChanged);
    };
  }, [pathname]);

  const handleSignOut = () => {
    clearAuthToken();
    setUser(null);
    setMobileOpen(false);
    setAccountMenuOpen(false);
    router.refresh();
  };

  useEffect(() => {
    if (!accountMenuOpen) return;
    const close = (e: MouseEvent) => {
      const t = e.target as Node;
      if (accountTriggerRef.current?.contains(t) || accountMenuRef.current?.contains(t)) return;
      setAccountMenuOpen(false);
    };
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [accountMenuOpen]);

  useLayoutEffect(() => {
    if (!accountMenuOpen) return;
    const update = () => {
      const el = accountTriggerRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      setAccountMenuPos({ top: r.bottom + 6, right: window.innerWidth - r.right });
    };
    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [accountMenuOpen]);

  const accountHref = user?.role === 'admin' ? '/admin' : '/dashboard';
  const accountLabel = user?.role === 'admin' ? 'Admin Dashboard' : 'Dashboard';
  const displayName = user ? user.name || user.email : '';
  const cartBadgeCount = Math.min(cartCount, 99);
  const brandName = liveSettings?.siteTitle?.trim() || SITE_NAME;
  const brandLogo = liveSettings?.siteLogo?.trim() || '/icon.png';
  const navCategories = getNavCategories(categories);
  const socialLinks = liveSettings?.socialLinks ?? [];
  const contactEmail =
    liveSettings?.contactEmail?.trim() ||
    liveSettings?.emailFooterSupportEmail?.trim() ||
    '';
  const contactPhone = liveSettings?.emailFooterSupportNumber?.trim() || '';

  return {
    pathname,
    mobileOpen,
    setMobileOpen,
    user,
    authReady,
    accountMenuOpen,
    setAccountMenuOpen,
    cartCount,
    cartBadgeCount,
    accountTriggerRef,
    accountMenuRef,
    accountMenuPos,
    portalsReady,
    handleSignOut,
    accountHref,
    accountLabel,
    displayName,
    brandName,
    brandLogo,
    navCategories,
    categories,
    socialLinks,
    contactEmail,
    contactPhone,
  };
}

export type PublicHeaderState = ReturnType<typeof usePublicHeader>;
