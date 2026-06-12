'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { THEME_STORAGE_KEY, type Theme, isTheme } from './constants';

type ThemeContextValue = {
  theme: Theme;
  setTheme: (t: Theme) => void;
  /** Effective appearance for icons (not "system" — resolved). */
  resolved: 'light' | 'dark';
  mounted: boolean;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function applyDom(theme: Theme, systemDark: boolean) {
  const root = document.documentElement;
  // FORCE TOTALLY WHITE: always remove dark class
  root.classList.remove('dark');
  root.style.colorScheme = 'light';
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // FORCE TOTALLY WHITE: always keep as 'light'
  const [theme, setThemeState] = useState<Theme>('light');
  const [systemDark, setSystemDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // FORCE TOTALLY WHITE: ignore localStorage completely
    // const stored = localStorage.getItem(THEME_STORAGE_KEY);
    // if (isTheme(stored)) setThemeState(stored);
    
    // Always ensure it's light
    setThemeState('light');
    
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    setSystemDark(mq.matches);
    setMounted(true);
    
    // Force apply white theme immediately
    applyDom('light', false);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    applyDom(theme, systemDark);
  }, [theme, systemDark, mounted]);

  // Disable system theme listener
  useEffect(() => {
    if (!mounted) return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => {
      setSystemDark(mq.matches);
      // Ignore system changes, always light
      applyDom('light', mq.matches);
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [mounted]);

  const setTheme = useCallback((t: Theme) => {
    // FORCE TOTALLY WHITE: completely ignore theme changes
    // Do nothing - always keep light theme
    // Optionally you could console.log to debug:
    // console.log('Theme changes are disabled - using light theme only');
    
    // If you want to pretend it works but always stay light:
    setThemeState('light');
    try {
      localStorage.setItem(THEME_STORAGE_KEY, 'light');
    } catch {
      /* ignore */
    }
    applyDom('light', window.matchMedia('(prefers-color-scheme: dark)').matches);
  }, []);

  // FORCE TOTALLY WHITE: resolved is always 'light'
  const resolved: 'light' | 'dark' = 'light';

  const value = useMemo(
    () => ({ theme: 'light' as Theme, setTheme, resolved, mounted }),
    [setTheme, mounted]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}


// 'use client';

// import {
//   createContext,
//   useCallback,
//   useContext,
//   useEffect,
//   useMemo,
//   useState,
// } from 'react';
// import { THEME_STORAGE_KEY, type Theme, isTheme } from './constants';

// type ThemeContextValue = {
//   theme: Theme;
//   setTheme: (t: Theme) => void;
//   /** Effective appearance for icons (not "system" — resolved). */
//   resolved: 'light' | 'dark';
//   mounted: boolean;
// };

// const ThemeContext = createContext<ThemeContextValue | null>(null);

// function applyDom(theme: Theme, systemDark: boolean) {
//   const root = document.documentElement;
//   const dark = theme === 'dark' || (theme === 'system' && systemDark);
//   if (dark) root.classList.add('dark');
//   else root.classList.remove('dark');
//   root.style.colorScheme = dark ? 'dark' : 'light';
// }

// export function ThemeProvider({ children }: { children: React.ReactNode }) {
//   const [theme, setThemeState] = useState<Theme>('light');
//   const [systemDark, setSystemDark] = useState(false);
//   const [mounted, setMounted] = useState(false);

//   useEffect(() => {
//     const stored = localStorage.getItem(THEME_STORAGE_KEY);
//     if (isTheme(stored)) setThemeState(stored);
//     const mq = window.matchMedia('(prefers-color-scheme: dark)');
//     setSystemDark(mq.matches);
//     setMounted(true);
//   }, []);

//   useEffect(() => {
//     if (!mounted) return;
//     applyDom(theme, systemDark);
//   }, [theme, systemDark, mounted]);

//   useEffect(() => {
//     if (!mounted) return;
//     const mq = window.matchMedia('(prefers-color-scheme: dark)');
//     const onChange = () => {
//       setSystemDark(mq.matches);
//       if (theme === 'system') applyDom('system', mq.matches);
//     };
//     mq.addEventListener('change', onChange);
//     return () => mq.removeEventListener('change', onChange);
//   }, [mounted, theme]);

//   const setTheme = useCallback((t: Theme) => {
//     setThemeState(t);
//     try {
//       localStorage.setItem(THEME_STORAGE_KEY, t);
//     } catch {
//       /* ignore */
//     }
//     const mq = window.matchMedia('(prefers-color-scheme: dark)');
//     applyDom(t, mq.matches);
//   }, []);

//   const resolved: 'light' | 'dark' = theme === 'dark' || (theme === 'system' && systemDark) ? 'dark' : 'light';

//   const value = useMemo(
//     () => ({ theme, setTheme, resolved, mounted }),
//     [theme, setTheme, resolved, mounted]
//   );

//   return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
// }

// export function useTheme() {
//   const ctx = useContext(ThemeContext);
//   if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
//   return ctx;
// }
