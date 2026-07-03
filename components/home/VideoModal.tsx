'use client';

import Link from 'next/link';
import { Play, X } from 'lucide-react';
import { Button } from '@/components/ui';
import { PROMO_VIDEO_EMBED_URL } from './constants';

interface VideoModalProps {
  open: boolean;
  onClose: () => void;
}

export function VideoModal({ open, onClose }: VideoModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Product showcase video"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl overflow-hidden rounded-2xl border border-border/50 bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/80"
          aria-label="Close video"
        >
          <X className="h-5 w-5" />
        </button>
        {PROMO_VIDEO_EMBED_URL ? (
          <div className="aspect-video w-full">
            <iframe
              src={PROMO_VIDEO_EMBED_URL}
              title="Product showcase video"
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : (
          <div className="flex aspect-video flex-col items-center justify-center gap-4 bg-muted/50 p-8 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Play className="h-8 w-8 fill-current" />
            </div>
            <div>
              <p className="text-lg font-semibold text-foreground">Video coming soon</p>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                Add your promo video URL to enable playback.
              </p>
            </div>
            <Link href="/shop" onClick={onClose}>
              <Button variant="primary">Explore Products Instead</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
