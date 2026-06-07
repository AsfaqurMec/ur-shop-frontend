import { cache } from 'react';
import { apiGet } from './client';

export interface SocialLink {
  id: string;
  label: string;
  logo: string;
  link: string;
  accentColor?: string;
}

export interface PublicStoreSettings {
  siteTitle: string;
  siteLogo: string;
  emailHeaderLogo: string;
  emailHeaderSlogan: string;
  emailHeaderSubtitle: string;
  emailFooterSupportEmail: string;
  emailFooterSupportNumber: string;
  /** Present when API supports floating social FAB (home). */
  socialLinks?: SocialLink[];
}

function unwrap<T>(res: { success: boolean; data?: T; error?: string; message?: string }): T {
  if (!res.success || res.data === undefined) {
    throw new Error(res.message || res.error || 'Request failed');
  }
  return res.data;
}

export const getPublicStoreSettings = cache(async (): Promise<PublicStoreSettings> => {
  const res = await apiGet<{ settings: PublicStoreSettings }>('store-settings/public', {
    params: { _t: Date.now() },
  });
  return unwrap(res).settings;
});
