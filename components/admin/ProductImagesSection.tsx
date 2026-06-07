'use client';

import { useState } from 'react';
import Image from 'next/image';
import type { AdminProductImage } from '@/lib/api/admin';
import { uploadProductImages, deleteProductImage } from '@/lib/api/admin';
import { getProductImageUrl } from '@/lib/imageUrl';
import { Button } from '@/components/ui';
import { Alert, AlertDescription } from '@/components/ui';
import { toast } from 'sonner';

const ACCEPT = 'image/*,.jpg,.jpeg,.png,.gif,.webp';

export interface ProductImagesSectionProps {
  productId: number;
  images: AdminProductImage[];
  setImages: React.Dispatch<React.SetStateAction<AdminProductImage[]>>;
}

export function ProductImagesSection({ productId, images, setImages }: ProductImagesSectionProps) {
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastPicked, setLastPicked] = useState<string | null>(null);

  const sortedImages = [...images].sort((a, b) => a.sort_order - b.sort_order || a.id - b.id);

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const files = Array.from(input.files ?? []);
    if (files.length === 0) {
      setLastPicked(null);
      return;
    }
    setLastPicked(files.length === 1 ? files[0].name : `${files.length} images`);
    setError(null);
    setUploading(true);
    try {
      const uploaded = await uploadProductImages(productId, files);
      setImages((current) => [...current, ...uploaded].sort((a, b) => a.sort_order - b.sort_order || a.id - b.id));
      toast.success(uploaded.length === 1 ? 'Image uploaded' : 'Images uploaded');
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : typeof err === 'string'
            ? err
            : 'Upload failed. Is the API running and are you logged in as admin?';
      setError(msg);
      toast.error(msg);
    } finally {
      setUploading(false);
      input.value = '';
    }
  };

  const remove = async (imageId: number) => {
    setError(null);
    setDeletingId(imageId);
    try {
      await deleteProductImage(productId, imageId);
      setImages((current) => current.filter((image) => image.id !== imageId));
      toast.success('Image removed');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to remove image';
      setError(msg);
      toast.error(msg);
    } finally {
      setDeletingId(null);
    }
  };

  const invalidId = !Number.isFinite(productId) || productId < 1;

  return (
    <div className="space-y-4 rounded-lg border border-border bg-card/30 p-4">
      {invalidId && (
        <Alert variant="destructive">
          <AlertDescription>Invalid product ID; reload the page or open the product from the list again.</AlertDescription>
        </Alert>
      )}
      <div>
        <label htmlFor={`product-image-file-${productId}`} className="text-sm font-medium">
          Product images
        </label>
        <input
          id={`product-image-file-${productId}`}
          type="file"
          name="image"
          accept={ACCEPT}
          multiple
          disabled={uploading || invalidId}
          onChange={onFileChange}
          className="mt-2 flex w-full max-w-lg cursor-pointer rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground file:mr-4 file:cursor-pointer file:rounded-md file:border file:border-input file:bg-muted file:px-4 file:py-2 file:text-sm file:font-medium file:text-foreground"
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Upload one or more JPEG, PNG, GIF, or WebP images. New images are added to the product gallery.
        </p>
        {lastPicked && (
          <p className="mt-2 text-sm text-foreground">
            {uploading ? 'Uploading...' : 'Last selected: '}
            <span className="font-medium">{uploading ? '' : lastPicked}</span>
          </p>
        )}
      </div>
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {sortedImages.length === 0 ? (
        <p className="text-sm text-muted-foreground">No image yet. Add one for the shop and product page.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {sortedImages.map((image, index) => {
            const previewUrl = getProductImageUrl(image.path);
            return (
              <div key={image.id} className="overflow-hidden rounded-md border border-border bg-muted/40">
                <div className="relative aspect-square w-full">
                  {previewUrl ? (
                    <Image
                      src={previewUrl}
                      alt={image.alt_text ?? ''}
                      fill
                      className="object-cover"
                      sizes="220px"
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center gap-1 p-2 text-center text-xs text-muted-foreground">
                      <span>Preview URL missing</span>
                      <span className="break-all opacity-80">{image.path}</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between gap-2 border-t border-border bg-background/80 px-2 py-1.5">
                  <span className="truncate text-xs text-muted-foreground">
                    {index === 0 ? 'Primary image' : `Gallery image ${index + 1}`}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 shrink-0 text-destructive hover:text-destructive"
                    disabled={deletingId === image.id}
                    onClick={() => remove(image.id)}
                  >
                    {deletingId === image.id ? '...' : 'Remove'}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
