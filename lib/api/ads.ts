import { apiGet, apiPostFormData, apiPutFormData, apiDelete } from './client';

export type AdItem = { id: number; image_path: string; is_active: boolean; created_at: string };

function unwrap<T>(r: { success: boolean; data?: T; error?: string }) {
  if (!r.success || r.data === undefined) throw new Error(r.error ?? 'Request failed');
  return r.data;
}

export async function fetchPublicAds() {
  return unwrap(await apiGet<{ ads: AdItem[] }>('promotions', { skipAuth: true, cache: 'no-store' })).ads;
}

export async function getAdminAds() {
  return unwrap(await apiGet<{ ads: AdItem[] }>('promotions/admin/all')).ads;
}

export async function createAd(image: File, isActive: boolean) {
  const f = new FormData();
  f.append('background_image', image);
  f.append('is_active', String(isActive));
  return unwrap(await apiPostFormData('promotions', f));
}

export async function updateAd(id: number, image: File | null, isActive: boolean) {
  const f = new FormData();
  if (image) f.append('background_image', image);
  f.append('is_active', String(isActive));
  return unwrap(await apiPutFormData(`promotions/${id}`, f));
}

export async function deleteAd(id: number) {
  return unwrap(await apiDelete(`promotions/${id}`));
}
