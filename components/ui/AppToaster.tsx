'use client';

import { Toaster } from 'sonner';
import { useTheme } from '@/components/theme';

/** Global toast host — place once inside `ThemeProvider`. */
export function AppToaster() {
  const { resolved } = useTheme();
  return (
    <Toaster
      position="top-center"
      theme={resolved}
      richColors
      closeButton
      toastOptions={{ classNames: { toast: 'font-sans' } }}
    />
  );
}
