export const THEME_STORAGE_KEY = 'dp-theme';

export type Theme = 'light' | 'dark' | 'system';

export function isTheme(value: string | null): value is Theme {
  return value === 'light' || value === 'dark' || value === 'system';
}
