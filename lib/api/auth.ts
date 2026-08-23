import { apiPost, apiGet, apiPatch, setAuthToken, clearAuthToken } from './client';
import { normalizeBengaliNumerals, normalizeBdMobile } from '@/lib/utils/bengali';
import type {
  LoginResponse,
  RegisterResponse,
  VerifyEmailResponse,
  MessageResponse,
} from '@/types/auth';

function unwrap<T>(res: { success: boolean; data?: T; error?: string; message?: string }): T {
  if (!res.success || res.data === undefined) {
    throw new Error(res.message || res.error || 'Request failed');
  }
  return res.data;
}

export async function login(identifier: string, password: string): Promise<LoginResponse> {
  const normId = normalizeBengaliNumerals(identifier.trim());
  const res = await apiPost<LoginResponse>('auth/login', { identifier: normId, password }, { skipAuth: true });
  const data = unwrap(res);
  setAuthToken(data.accessToken);
  return data;
}

export async function register(
  identifier: string,
  password: string,
  name: string,
  verificationBaseUrl?: string
): Promise<RegisterResponse> {
  const normId = normalizeBengaliNumerals(identifier.trim());
  const body: { identifier: string; password: string; name: string; verificationBaseUrl?: string } = {
    identifier: normId,
    password,
    name: name.trim() || normId,
  };
  if (verificationBaseUrl) body.verificationBaseUrl = verificationBaseUrl;
  const res = await apiPost<RegisterResponse>('auth/register', body, { skipAuth: true });
  return unwrap(res);
}

export async function verifyEmail(token: string): Promise<VerifyEmailResponse> {
  const res = await apiPost<VerifyEmailResponse>('auth/verify-email', { token }, { skipAuth: true });
  return unwrap(res);
}

export async function verifyEmailGet(token: string): Promise<VerifyEmailResponse> {
  const res = await apiGet<VerifyEmailResponse>('auth/verify-email', {
    params: { token },
    skipAuth: true,
  });
  return unwrap(res);
}

export async function forgotPassword(
  email: string,
  resetBaseUrl?: string
): Promise<MessageResponse> {
  const body: { email: string; resetBaseUrl?: string } = { email };
  if (resetBaseUrl) body.resetBaseUrl = resetBaseUrl;
  const res = await apiPost<MessageResponse>('auth/forgot-password', body, { skipAuth: true });
  return unwrap(res);
}

export async function resetPassword(token: string, password: string): Promise<MessageResponse> {
  const res = await apiPost<MessageResponse>('auth/reset-password', { token, password }, {
    skipAuth: true,
  });
  return unwrap(res);
}

export async function getProfile(options?: { skip401Redirect?: boolean }): Promise<{ user: import('@/types/auth').SafeUser }> {
  const res = await apiGet<{ user: import('@/types/auth').SafeUser }>('auth/me', {
    skip401Redirect: options?.skip401Redirect ?? true,
  });
  return unwrap(res);
}

export interface UpdateProfileBody {
  name: string;
  mobile?: string | null;
  address?: string | null;
}

export async function updateProfile(
  body: UpdateProfileBody
): Promise<{ user: import('@/types/auth').SafeUser }> {
  const res = await apiPatch<{ user: import('@/types/auth').SafeUser }>('auth/me', body);
  return unwrap(res);
}

export async function guestCheckout(body: {
  name: string;
  mobile: string;
  address: string;
}): Promise<LoginResponse> {
  const normMobile = normalizeBdMobile(body.mobile) || body.mobile.trim();
  const payload = {
    ...body,
    name: body.name.trim(),
    mobile: normMobile,
    address: body.address.trim(),
  };
  const res = await apiPost<LoginResponse>('auth/guest-checkout', payload, { skipAuth: true });
  return unwrap(res);
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<MessageResponse> {
  const res = await apiPost<MessageResponse>('auth/change-password', { current_password: currentPassword, new_password: newPassword });
  return unwrap(res);
}

export async function guestAccountExists(mobile: string): Promise<boolean> {
  const normMobile = normalizeBdMobile(mobile) || mobile.trim();
  const res = await apiPost<{ exists: boolean }>('auth/guest-account-status', { mobile: normMobile }, { skipAuth: true });
  return unwrap(res).exists;
}

export async function continueCheckout(mobile: string): Promise<LoginResponse> {
  const normMobile = normalizeBdMobile(mobile) || mobile.trim();
  const res = await apiPost<LoginResponse>('auth/continue-checkout', { mobile: normMobile }, { skipAuth: true });
  return unwrap(res);
}

export async function logout(): Promise<void> {
  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {}

  // Expire cookies on document level as client-side fallback
  if (typeof document !== 'undefined') {
    document.cookie = 'auth_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
    document.cookie = 'refresh_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
  }

  clearAuthToken();
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('profile:updated'));
    window.dispatchEvent(new Event('cart:changed'));
  }
}
