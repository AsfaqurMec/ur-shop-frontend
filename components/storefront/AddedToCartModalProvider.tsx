'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { AddedToCartModal, type AddedToCartSummary } from './AddedToCartModal';

type ShowAddedToCartFn = (summary: AddedToCartSummary) => void;

const AddedToCartModalContext = createContext<ShowAddedToCartFn | null>(null);

/**
 * Lives in the root layout so route revalidation / layout re-renders do not remount it
 * and clear modal state. Renders the dialog with a body portal for stable stacking.
 */
export function AddedToCartModalProvider({ children }: { children: ReactNode }) {
  const [summary, setSummary] = useState<AddedToCartSummary | null>(null);

  const show = useCallback((s: AddedToCartSummary) => {
    setSummary({ name: s.name, imageUrl: s.imageUrl });
  }, []);

  const close = useCallback(() => setSummary(null), []);

  const value = useMemo(() => show, [show]);

  return (
    <AddedToCartModalContext.Provider value={value}>
      {children}
      <AddedToCartModal open={summary !== null} product={summary} onClose={close} />
    </AddedToCartModalContext.Provider>
  );
}

export function useShowAddedToCartModal(): ShowAddedToCartFn {
  const ctx = useContext(AddedToCartModalContext);
  if (!ctx) {
    throw new Error('useShowAddedToCartModal must be used within AddedToCartModalProvider');
  }
  return ctx;
}
