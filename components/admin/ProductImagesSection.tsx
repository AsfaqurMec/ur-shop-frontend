'use client';

import { useState } from 'react';
import Image from 'next/image';
import type { AdminProductImage } from '@/lib/api/admin';
import { uploadProductImages, deleteProductImage, reorderProductImages, setProductPrimaryImage } from '@/lib/api/admin';
import { getProductImageUrl } from '@/lib/imageUrl';
import { Button } from '@/components/ui';
import { Alert, AlertDescription } from '@/components/ui';
import { IconGripVertical, IconTrash } from '@/components/admin/admin-icons';
import { toast } from 'sonner';

const ACCEPT = 'image/*,.jpg,.jpeg,.png,.gif,.webp';
const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export interface ProductImagesSectionProps {
  productId: number;
  images: AdminProductImage[];
  setImages: React.Dispatch<React.SetStateAction<AdminProductImage[]>>;
}

export function ProductImagesSection({ productId, images, setImages }: ProductImagesSectionProps) {
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [settingPrimaryId, setSettingPrimaryId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastPicked, setLastPicked] = useState<string | null>(null);
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  const sortedImages = [...images].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.id - b.id);

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const files = Array.from(input.files ?? []);
    if (files.length === 0) {
      setLastPicked(null);
      return;
    }

    // Client-side file size check
    const oversized = files.filter((f) => f.size > MAX_FILE_SIZE_BYTES);
    if (oversized.length > 0) {
      const msg = `Some files exceed the ${MAX_FILE_SIZE_MB}MB size limit: ${oversized
        .map((f) => `${f.name} (${(f.size / (1024 * 1024)).toFixed(1)}MB)`)
        .join(', ')}`;
      setError(msg);
      toast.error(msg);
      input.value = '';
      return;
    }

    setLastPicked(files.length === 1 ? files[0].name : `${files.length} images selected`);
    setError(null);
    setUploading(true);
    try {
      const uploaded = await uploadProductImages(productId, files);
      setImages((current) => [...current, ...uploaded].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.id - b.id));
      toast.success(uploaded.length === 1 ? '1 image uploaded successfully' : `${uploaded.length} images uploaded successfully`);
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
      toast.success('Image removed from gallery');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to remove image';
      setError(msg);
      toast.error(msg);
    } finally {
      setDeletingId(null);
    }
  };

  const handleSetPrimary = async (imageId: number) => {
    setSettingPrimaryId(imageId);
    try {
      const updated = await setProductPrimaryImage(productId, imageId);
      setImages(updated);
      toast.success('Primary image updated');
    } catch (err) {
      // Fallback optimistic reorder
      const target = sortedImages.find((img) => img.id === imageId);
      if (target) {
        const remaining = sortedImages.filter((img) => img.id !== imageId);
        const reordered = [target, ...remaining].map((img, idx) => ({ ...img, sort_order: idx }));
        setImages(reordered);
        try {
          await reorderProductImages(productId, reordered.map((img) => img.id));
          toast.success('Primary image updated');
        } catch {
          toast.error('Failed to set primary image');
        }
      }
    } finally {
      setSettingPrimaryId(null);
    }
  };

  // Drag & Drop handlers
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    setDraggedIdx(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIdx !== index) {
      setDragOverIdx(index);
    }
  };

  const handleDragLeave = () => {
    setDragOverIdx(null);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>, targetIdx: number) => {
    e.preventDefault();
    setDragOverIdx(null);
    if (draggedIdx === null || draggedIdx === targetIdx) {
      setDraggedIdx(null);
      return;
    }

    const reordered = [...sortedImages];
    const [moved] = reordered.splice(draggedIdx, 1);
    reordered.splice(targetIdx, 0, moved);

    const updatedWithOrder = reordered.map((img, idx) => ({ ...img, sort_order: idx }));
    setImages(updatedWithOrder);
    setDraggedIdx(null);

    const isNowPrimary = targetIdx === 0;

    try {
      await reorderProductImages(productId, updatedWithOrder.map((img) => img.id));
      if (isNowPrimary) {
        toast.success('Primary image updated');
      } else {
        toast.success('Image gallery reordered');
      }
    } catch (err) {
      toast.error('Failed to save image order on server');
    }
  };

  const invalidId = !Number.isFinite(productId) || productId < 1;

  return (
    <div className="space-y-5 rounded-xl border border-border bg-card/40 p-4 sm:p-5">
      {invalidId && (
        <Alert variant="destructive">
          <AlertDescription>Invalid product ID; reload the page or open the product from the list again.</AlertDescription>
        </Alert>
      )}

      {/* Upload Box & Size Guidelines */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label htmlFor={`product-image-file-${productId}`} className="text-sm font-semibold text-foreground">
            Product Gallery & Images
          </label>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-2.5 py-0.5 text-xs font-semibold text-primary">
            Upload limit: Max {MAX_FILE_SIZE_MB} MB / image
          </span>
        </div>

        <input
          id={`product-image-file-${productId}`}
          type="file"
          name="images"
          accept={ACCEPT}
          multiple
          disabled={uploading || invalidId}
          onChange={onFileChange}
          className="flex w-full cursor-pointer rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm file:mr-4 file:cursor-pointer file:rounded-md file:border-0 file:bg-primary file:px-3.5 file:py-1.5 file:text-xs file:font-semibold file:text-primary-foreground hover:file:bg-primary/90"
        />

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span>• <strong>Size Limit:</strong> Max {MAX_FILE_SIZE_MB} MB per file</span>
          <span>• <strong>Formats:</strong> JPEG, PNG, GIF, WebP</span>
          <span>• <strong>Multiple:</strong> Select multiple images at once (up to 20 images)</span>
        </div>

        {lastPicked && (
          <p className="rounded-md border border-border bg-muted/40 px-3 py-1.5 text-xs text-foreground">
            {uploading ? (
              <span className="flex items-center gap-2 text-primary font-medium">
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                Uploading images to gallery...
              </span>
            ) : (
              <span>Last selected: <span className="font-semibold">{lastPicked}</span></span>
            )}
          </p>
        )}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Gallery Header & Image Grid */}
      <div className="space-y-3 border-t border-border/60 pt-4">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-medium text-muted-foreground">
          <span className="font-semibold text-foreground">Uploaded Images ({sortedImages.length})</span>
          {sortedImages.length > 0 && (
            <span className="flex items-center gap-1.5 text-primary">
              <IconGripVertical className="size-3.5" />
              <span><strong>Drag image to #1</strong> to make it the Primary Image</span>
            </span>
          )}
        </div>

        {sortedImages.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border/80 bg-muted/20 p-6 text-center text-sm text-muted-foreground">
            No images uploaded yet. Select and upload product images above.
          </div>
        ) : (
          <div className="grid gap-3.5 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4">
            {sortedImages.map((image, index) => {
              const previewUrl = getProductImageUrl(image.path);
              const isPrimary = index === 0;
              const isDragging = draggedIdx === index;
              const isDragOver = dragOverIdx === index;

              return (
                <div
                  key={image.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, index)}
                  className={`group relative flex flex-col overflow-hidden rounded-xl border bg-card/60 shadow-sm transition-all duration-200 cursor-grab active:cursor-grabbing ${
                    isPrimary
                      ? 'border-primary ring-2 ring-primary/30 shadow-md'
                      : isDragOver
                        ? 'border-primary border-2 ring-4 ring-primary/20 scale-[1.02] shadow-lg'
                        : 'border-border hover:border-border/80 hover:shadow-md'
                  } ${isDragging ? 'opacity-40 scale-95' : 'opacity-100'}`}
                >
                  {/* Top Header / Grip & Primary Badge */}
                  <div className="flex items-center justify-between border-b border-border/50 bg-background/90 px-2 py-1.5 backdrop-blur-sm">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold shadow-sm ${
                        isPrimary
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground border border-border/80'
                      }`}
                    >
                      {isPrimary ? '★ Primary Image' : `Gallery #${index + 1}`}
                    </span>
                    <div className="flex items-center gap-1 text-muted-foreground group-hover:text-foreground">
                      <span className="text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">Drag</span>
                      <IconGripVertical className="size-4" />
                    </div>
                  </div>

                  {/* Thumbnail Image */}
                  <div className="relative aspect-square w-full bg-muted/30">
                    {previewUrl ? (
                      <Image
                        src={previewUrl}
                        alt={image.alt_text ?? `Product image ${index + 1}`}
                        fill
                        className="object-cover pointer-events-none transition-transform duration-300 group-hover:scale-105"
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        unoptimized
                      />
                    ) : (
                      <div className="flex h-full flex-col items-center justify-center gap-1 p-2 text-center text-xs text-muted-foreground">
                        <span>Preview URL missing</span>
                        <span className="break-all opacity-80">{image.path}</span>
                      </div>
                    )}

                    {/* Overlay "Make Primary" button on hover for non-primary images */}
                    {!isPrimary && (
                      <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 opacity-0 backdrop-blur-[1px] transition-opacity duration-200 group-hover:opacity-100">
                        <button
                          type="button"
                          disabled={settingPrimaryId === image.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            void handleSetPrimary(image.id);
                          }}
                          className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-lg hover:bg-primary/90 active:scale-95 transition-all"
                        >
                          {settingPrimaryId === image.id ? 'Setting...' : '★ Set as Primary'}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Action Bar */}
                  <div className="flex items-center justify-between border-t border-border bg-card/95 px-2.5 py-1.5">
                    <span className="truncate text-[11px] font-medium text-muted-foreground">
                      {isPrimary ? 'Main Cover' : `#${index + 1}`}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                      disabled={deletingId === image.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        void remove(image.id);
                      }}
                    >
                      <IconTrash className="size-3.5 mr-1" />
                      {deletingId === image.id ? '...' : 'Delete'}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
