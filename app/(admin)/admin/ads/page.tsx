'use client';
import { useEffect, useState } from 'react';
import { createAd, deleteAd, getAdminAds, updateAd, type AdItem } from '@/lib/api/ads';
import { getBannerImageUrl } from '@/lib/imageUrl';
import { AdminPageHeader } from '@/components/admin/PageHeader';
import { Button } from '@/components/ui';
import { IconTrash } from '@/components/admin/admin-icons';
import { toast } from 'sonner';

export default function AdminAdsPage() {
  const [ads, setAds] = useState<AdItem[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [active, setActive] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = () =>
    getAdminAds()
      .then(setAds)
      .catch((e) => toast.error(e.message));

  useEffect(() => {
    load();
  }, []);

  const add = async () => {
    if (!file) return toast.error('Choose an ad image');
    setBusy(true);
    try {
      await createAd(file, active);
      setFile(null);
      await load();
      toast.success('Homepage ad created');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not create ad');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <AdminPageHeader
        title="Popup Ads"
        description="Upload an image to show as a popup on the homepage."
      />
      <div className="mb-8 rounded-xl border border-border bg-card p-5">
        <div className="flex flex-wrap items-end gap-4">
          <label className="text-sm font-medium">
            Ad image
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="mt-2 block text-sm"
            />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
            />{' '}
            Active
          </label>
          <Button type="button" onClick={() => void add()} disabled={busy}>
            {busy ? 'Uploading...' : 'Add popup ad'}
          </Button>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ads.map((ad) => (
          <div
            key={ad.id}
            className="overflow-hidden rounded-xl border border-border bg-card"
          >
            <img
              src={getBannerImageUrl(ad.image_path) ?? undefined}
              alt="Ad"
              className="h-48 w-full object-cover"
            />
            <div className="flex items-center justify-between gap-2 p-3">
              <label className="flex items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={ad.is_active}
                  onChange={async (e) => {
                    await updateAd(ad.id, null, e.target.checked);
                    await load();
                  }}
                />{' '}
                Active
              </label>
              <button
                type="button"
                onClick={async () => {
                  await deleteAd(ad.id);
                  await load();
                  toast.success('Ad deleted');
                }}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors shadow-sm"
                title="Delete Ad"
                aria-label="Delete Ad"
              >
                <IconTrash className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
