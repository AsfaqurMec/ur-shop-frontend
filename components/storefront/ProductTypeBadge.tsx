import type { ProductType } from '@/types/product';

const LABELS: Record<ProductType, string> = {
  downloadable: 'Download',
  license_key: 'License',
  subscription_manual: 'Subscription',
  digital_service: 'Service',
};

/** Solid fills + shadow so labels stay readable on busy product photos and on UI surfaces. */
const STYLES: Record<ProductType, string> = {
  downloadable:
    'bg-sky-700 text-white shadow-md ring-1 ring-black/20 dark:bg-sky-600 dark:ring-white/15',
  license_key:
    'bg-amber-700 text-white shadow-md ring-1 ring-black/20 dark:bg-amber-600 dark:ring-white/15',
  subscription_manual:
    'bg-gradient-to-br from-violet-600 to-violet-700 text-white shadow-md ring-1 ring-black/20 dark:from-violet-500 dark:to-violet-600 dark:ring-white/15',
  digital_service:
    'bg-emerald-700 text-white shadow-md ring-1 ring-black/20 dark:bg-emerald-600 dark:ring-white/15',
};

export function ProductTypeBadge({ type }: { type: ProductType }) {
  return (
    <span
      className={`inline-flex rounded-md px-2 py-0.5 text-[10px] font-semibold tracking-tight ${STYLES[type]}`}
    >
      {LABELS[type]}
    </span>
  );
}
