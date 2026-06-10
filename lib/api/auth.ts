import { apiPost, apiGet, apiPatch } from './client';
import { setAuthToken } from './client';
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

export async function login(email: string, password: string): Promise<LoginResponse> {
  const res = await apiPost<LoginResponse>('auth/login', { email, password }, { skipAuth: true });
  const data = unwrap(res);
  setAuthToken(data.accessToken);
  return data;
}

export async function register(
  email: string,
  password: string,
  name: string,
  verificationBaseUrl?: string
): Promise<RegisterResponse> {
  const body: { email: string; password: string; name: string; verificationBaseUrl?: string } = {
    email,
    password,
    name: name.trim() || email,
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

export async function getProfile(): Promise<{ user: import('@/types/auth').SafeUser }> {
  const res = await apiGet<{ user: import('@/types/auth').SafeUser }>('auth/me');
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
  email: string;
  mobile: string;
  address: string;
}): Promise<LoginResponse> {
  const res = await apiPost<LoginResponse>('auth/guest-checkout', body, { skipAuth: true });
  return unwrap(res);
}
