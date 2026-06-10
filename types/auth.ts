export interface SafeUser {
  id: number;
  email: string;
  name: string;
  mobile: string | null;
  address: string | null;
  email_verified_at: string | null;
  created_at: string;
  updated_at: string;
  role: 'user' | 'admin';
}

export interface LoginResponse {
  user: SafeUser;
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
}

export interface RegisterResponse {
  user: SafeUser;
  message: string;
}

export interface VerifyEmailResponse {
  user: SafeUser;
}

export interface MessageResponse {
  message: string;
}
