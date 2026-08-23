/**
 * Secure client-side storage utility that encrypts sensitive data
 * so that inspecting LocalStorage, SessionStorage, or cookies reveals only opaque ciphertext.
 */

const STORAGE_SECRET_SALT = 'UR_SHOP_SECURE_VAULT_KEY_2026_x89f';

function deriveKey(salt: string): number[] {
  const key: number[] = [];
  for (let i = 0; i < salt.length; i++) {
    key.push((salt.charCodeAt(i) * 31 + (i % 7) * 17) & 0xff);
  }
  return key;
}

/**
 * Encrypt a plaintext string or object to an opaque Base64-encoded encrypted blob.
 */
export function encryptData(data: unknown): string {
  try {
    const jsonStr = JSON.stringify(data);
    if (!jsonStr) return '';
    const key = deriveKey(STORAGE_SECRET_SALT);
    const keyLen = key.length;

    // UTF-8 encode string to byte array
    const utf8Bytes = new TextEncoder().encode(jsonStr);
    const encrypted = new Uint8Array(utf8Bytes.length + 4);

    // Dynamic 4-byte random nonce prefix
    const nonce0 = (Math.random() * 255) | 0;
    const nonce1 = (Math.random() * 255) | 0;
    const nonce2 = (Math.random() * 255) | 0;
    const nonce3 = (Math.random() * 255) | 0;
    encrypted[0] = nonce0;
    encrypted[1] = nonce1;
    encrypted[2] = nonce2;
    encrypted[3] = nonce3;

    for (let i = 0; i < utf8Bytes.length; i++) {
      const k = key[(i + nonce0 + nonce1) % keyLen];
      encrypted[i + 4] = utf8Bytes[i] ^ k ^ ((nonce2 + i) & 0xff);
    }

    // Convert to binary string for btoa
    let binary = '';
    const len = encrypted.length;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(encrypted[i]);
    }
    return btoa(binary);
  } catch {
    return '';
  }
}

/**
 * Decrypt an encrypted blob back to its original object/value.
 */
export function decryptData<T = unknown>(ciphertext: string | null): T | null {
  if (!ciphertext || typeof ciphertext !== 'string') return null;
  try {
    const binary = atob(ciphertext);
    const len = binary.length;
    if (len < 5) return null;

    const encrypted = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      encrypted[i] = binary.charCodeAt(i);
    }

    const nonce0 = encrypted[0];
    const nonce1 = encrypted[1];
    const nonce2 = encrypted[2];
    const key = deriveKey(STORAGE_SECRET_SALT);
    const keyLen = key.length;

    const payloadLen = len - 4;
    const utf8Bytes = new Uint8Array(payloadLen);
    for (let i = 0; i < payloadLen; i++) {
      const k = key[(i + nonce0 + nonce1) % keyLen];
      utf8Bytes[i] = encrypted[i + 4] ^ k ^ ((nonce2 + i) & 0xff);
    }

    const jsonStr = new TextDecoder().decode(utf8Bytes);
    return JSON.parse(jsonStr) as T;
  } catch {
    return null;
  }
}

/**
 * Secure LocalStorage getter/setter/remover with encrypted payloads.
 */
export const secureLocalStorage = {
  getItem<T = unknown>(key: string): T | null {
    if (typeof window === 'undefined') return null;
    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) return null;
      return decryptData<T>(raw);
    } catch {
      return null;
    }
  },
  setItem(key: string, value: unknown): void {
    if (typeof window === 'undefined') return;
    try {
      const encrypted = encryptData(value);
      window.localStorage.setItem(key, encrypted);
    } catch {}
  },
  removeItem(key: string): void {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.removeItem(key);
    } catch {}
  },
};

/**
 * Secure SessionStorage getter/setter/remover with encrypted payloads.
 */
export const secureSessionStorage = {
  getItem<T = unknown>(key: string): T | null {
    if (typeof window === 'undefined') return null;
    try {
      const raw = window.sessionStorage.getItem(key);
      if (!raw) return null;
      return decryptData<T>(raw);
    } catch {
      return null;
    }
  },
  setItem(key: string, value: unknown): void {
    if (typeof window === 'undefined') return;
    try {
      const encrypted = encryptData(value);
      window.sessionStorage.setItem(key, encrypted);
    } catch {}
  },
  removeItem(key: string): void {
    if (typeof window === 'undefined') return;
    try {
      window.sessionStorage.removeItem(key);
    } catch {}
  },
};

