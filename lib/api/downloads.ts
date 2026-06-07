import { apiGet, apiPost } from './client';
import type { DownloadableItem } from './dashboard';

function unwrap<T>(res: { success: boolean; data?: T; error?: string }): T {
  if (!res.success || res.data === undefined) throw new Error(res.error ?? 'Request failed');
  return res.data as T;
}

export interface DownloadTokenResponse {
  token: string;
  expires_at: string;
  url: string;
}

export async function listDownloadables(): Promise<{ items: DownloadableItem[] }> {
  const res = await apiGet<{ items: DownloadableItem[] }>('downloads');
  return unwrap(res);
}

export async function createDownloadToken(entitlementId: number): Promise<DownloadTokenResponse> {
  const res = await apiPost<DownloadTokenResponse>('downloads/token', { entitlement_id: entitlementId });
  return unwrap(res);
}
