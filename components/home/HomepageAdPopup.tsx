'use client';
import { useState } from 'react';
import type { AdItem } from '@/lib/api/ads';
import { getBannerImageUrl } from '@/lib/imageUrl';
export function HomepageAdPopup({ ads }: { ads: AdItem[] }) {
  const [open, setOpen] = useState(true); const ad = ads[0]; const image = ad ? getBannerImageUrl(ad.image_path) : null;
  if (!open || !image) return null;
  return <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true" aria-label="Promotion"><div className="relative max-h-[90vh] max-w-2xl overflow-hidden rounded-xl bg-background shadow-2xl"><button type="button" onClick={() => setOpen(false)} className="absolute right-2 top-2 z-10 rounded-full bg-black/70 px-3 py-1 text-lg text-white" aria-label="Close ad">×</button><img src={image} alt="Promotion" className="max-h-[90vh] w-full object-contain" /></div></div>;
}
