'use client';

import { useState } from 'react';
import type { AdminProductFile } from '@/lib/api/admin';
import { uploadProductFile, deleteProductFile } from '@/lib/api/admin';
import { Button } from '@/components/ui';
import { Alert, AlertDescription } from '@/components/ui';
import { toast } from 'sonner';

function formatBytes(n: number | null): string {
  if (n == null || n < 0) return '—';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export interface ProductFilesSectionProps {
  productId: number;
  files: AdminProductFile[];
  setFiles: React.Dispatch<React.SetStateAction<AdminProductFile[]>>;
}

export function ProductFilesSection({ productId, files, setFiles }: ProductFilesSectionProps) {
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [downloadLimit, setDownloadLimit] = useState('');
  const [sortOrder, setSortOrder] = useState('');
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);

  const invalidId = !Number.isFinite(productId) || productId < 1;

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const list = input.files?.length ? Array.from(input.files) : [];
    if (list.length === 0) return;
    setError(null);
    setUploading(true);
    setUploadProgress(null);
    try {
      const limitRaw = downloadLimit.trim();
      const limit =
        limitRaw === '' ? undefined : Number(limitRaw);
      const sortRaw = sortOrder.trim();
      const sort = sortRaw === '' ? undefined : Number(sortRaw);
      const singleCustomName = list.length === 1 && displayName.trim() !== '' ? displayName.trim() : undefined;
      const limitOk =
        limit !== undefined && !Number.isNaN(limit) && limit >= 0 ? limit : undefined;
      const sortOk = sort !== undefined && !Number.isNaN(sort) && sort >= 0 ? sort : undefined;

      for (let i = 0; i < list.length; i++) {
        const file = list[i];
        if (list.length > 1) {
          setUploadProgress(`Uploading ${i + 1} of ${list.length}…`);
        }
        const uploaded = await uploadProductFile(productId, file, {
          file_name: singleCustomName,
          download_limit: limitOk,
          // Per-file auto order when uploading several; explicit sort only for a single file
          sort_order: list.length === 1 ? sortOk : undefined,
        });
        setFiles((prev) => [...prev, uploaded].sort((a, b) => a.sort_order - b.sort_order || a.id - b.id));
      }
      setDisplayName('');
      setDownloadLimit('');
      setSortOrder('');
      toast.success(list.length > 1 ? `${list.length} files uploaded` : 'File uploaded');
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
      setUploadProgress(null);
      input.value = '';
    }
  };

  const remove = async (fileId: number) => {
    setError(null);
    setDeletingId(fileId);
    try {
      await deleteProductFile(productId, fileId);
      setFiles((prev) => prev.filter((f) => f.id !== fileId));
      toast.success('File removed');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to remove file';
      setError(msg);
      toast.error(msg);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-4 rounded-lg border border-border bg-card/30 p-4">
      {invalidId && (
        <Alert variant="destructive">
          <AlertDescription>Invalid product ID; reload the page or open the product from the list again.</AlertDescription>
        </Alert>
      )}
      <p className="text-sm text-muted-foreground">
        Customers who buy this product get download access to these files (stored in <code className="text-xs">product_files</code>).
        Leave download limit empty for unlimited downloads per purchase.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor={`product-dl-file-${productId}`} className="text-sm font-medium">
            Add downloadable files
          </label>
          <input
            id={`product-dl-file-${productId}`}
            type="file"
            name="file"
            multiple
            disabled={uploading || invalidId}
            onChange={onFileChange}
            className="mt-2 flex w-full max-w-lg cursor-pointer rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground file:mr-4 file:cursor-pointer file:rounded-md file:border file:border-input file:bg-muted file:px-4 file:py-2 file:text-sm file:font-medium file:text-foreground"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            You can select several files at once (Ctrl/Cmd+click or Shift+click). Display name and sort order apply only when you upload a single file; download limit applies to every file in the batch.
          </p>
        </div>
        <div>
          <label className="text-sm font-medium">Display name (optional, single file only)</label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            disabled={uploading || invalidId}
            placeholder="Defaults to file name"
            className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Download limit (optional)</label>
          <input
            type="number"
            min={0}
            value={downloadLimit}
            onChange={(e) => setDownloadLimit(e.target.value)}
            disabled={uploading || invalidId}
            placeholder="Unlimited if empty"
            className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Sort order (optional)</label>
          <input
            type="number"
            min={0}
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            disabled={uploading || invalidId}
            placeholder="Auto if empty"
            className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </div>
      </div>
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {uploading && (
        <p className="text-sm text-muted-foreground">{uploadProgress ?? 'Uploading…'}</p>
      )}
      {files.length === 0 ? (
        <p className="text-sm text-muted-foreground">No files yet — add at least one for buyers to download.</p>
      ) : (
        <ul className="divide-y divide-border rounded-md border border-border">
          {files.map((f) => (
            <li key={f.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm">
              <div className="min-w-0 flex-1">
                <div className="font-medium text-foreground">{f.file_name}</div>
                <div className="text-xs text-muted-foreground">
                  {formatBytes(f.file_size)}
                  {f.download_limit != null ? ` · limit ${f.download_limit} / order` : ' · unlimited'}
                  {` · order ${f.sort_order}`}
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 shrink-0 text-destructive hover:text-destructive"
                disabled={deletingId === f.id}
                onClick={() => remove(f.id)}
              >
                {deletingId === f.id ? '…' : 'Remove'}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
