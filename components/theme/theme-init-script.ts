import { THEME_STORAGE_KEY } from './constants';

/** Inline before hydration to prevent theme flash. Keep in sync with ThemeProvider. */
export const THEME_INIT_SCRIPT = `(function(){try{var r=document.documentElement;var k=${JSON.stringify(THEME_STORAGE_KEY)};var t=localStorage.getItem(k);var m=window.matchMedia('(prefers-color-scheme: dark)').matches;var d=t==='dark'||(t!=='light'&&m);if(d)r.classList.add('dark');else r.classList.remove('dark');r.style.colorScheme=d?'dark':'light';}catch(e){}})();`;
