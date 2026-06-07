'use client';

import { useRef, useState } from 'react';
import { Button } from './Button';

const IMAGE_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'] as const;
const DEFAULT_MAX_SIZE_MB = 2;

export interface ImageUploaderFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (nextValue: string) => void;
  onUploadFile?: (file: File) => Promise<string>;
  helpText?: string;
  maxSizeMb?: number;
  disabled?: boolean;
}

export function ImageUploaderField({
  id,
  label,
  value,
  onChange,
  onUploadFile,
  helpText,
  maxSizeMb = DEFAULT_MAX_SIZE_MB,
  disabled = false,
}: ImageUploaderFieldProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const maxBytes = maxSizeMb * 1024 * 1024;

  const onPickFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!IMAGE_MIME_TYPES.includes(file.type as (typeof IMAGE_MIME_TYPES)[number])) {
      setError('Only PNG, JPG, WEBP, or GIF images are allowed.');
      event.target.value = '';
      return;
    }
    if (file.size > maxBytes) {
      setError(`Image must be ${maxSizeMb}MB or smaller.`);
      event.target.value = '';
      return;
    }

    setError(null);
    setUploading(true);
    try {
      if (onUploadFile) {
        const uploadedUrl = await onUploadFile(file);
        if (!uploadedUrl) throw new Error('Could not upload selected file.');
        onChange(uploadedUrl);
      } else {
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
          reader.onerror = () => reject(new Error('Could not read selected file.'));
          reader.readAsDataURL(file);
        });
        if (!dataUrl) throw new Error('Could not read selected file.');
        onChange(dataUrl);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not upload image.');
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const clearImage = () => {
    setError(null);
    onChange('');
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
      </label>
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        disabled={disabled || uploading}
        onChange={onPickFile}
        className="flex w-full cursor-pointer rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground file:mr-4 file:cursor-pointer file:rounded-md file:border file:border-input file:bg-muted file:px-4 file:py-2 file:text-sm file:font-medium file:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
      />
      {uploading ? <p className="text-xs font-medium text-primary">Uploading...</p> : null}
      {helpText ? <p className="text-xs text-muted-foreground">{helpText}</p> : null}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
      {value ? (
        <div className="space-y-2 rounded-lg border border-border/80 bg-muted/15 p-3">
          <img src={value} alt={`${label} preview`} className="h-16 w-auto rounded border border-border object-contain bg-background" />
          <Button type="button" variant="outline" size="sm" onClick={clearImage} disabled={disabled || uploading}>
            Remove image
          </Button>
        </div>
      ) : null}
    </div>
  );
}
