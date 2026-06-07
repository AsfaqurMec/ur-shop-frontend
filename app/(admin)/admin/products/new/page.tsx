'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createProduct, getCategories, uploadProductImage, uploadProductFile } from '@/lib/api/admin';
import { AdminPageHeader } from '@/components/admin';
import { AdminAccordionSection } from '@/components/admin/AdminAccordionSection';
import { IconClipboard, IconImage, IconFolderDown, IconKey } from '@/components/admin/admin-icons';
import { Button } from '@/components/ui';
import { Alert, AlertDescription } from '@/components/ui';
import { toast } from 'sonner';

const PRODUCT_TYPES = ['downloadable', 'license_key', 'subscription_manual', 'digital_service'];

const fileInputClass =
  'mt-1 block w-full text-sm text-muted-foreground file:mr-3 file:rounded-md file:border file:border-input file:bg-background file:px-3 file:py-2 file:text-sm file:font-medium';

export default function AdminAddProductPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [fullDescription, setFullDescription] = useState('');
  const [features, setFeatures] = useState<string[]>([]);
  const [featureInput, setFeatureInput] = useState('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [productType, setProductType] = useState('downloadable');
  const [price, setPrice] = useState('');
  const [compareAtPrice, setCompareAtPrice] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [manualFulfillmentRequired, setManualFulfillmentRequired] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [pendingDownloadFiles, setPendingDownloadFiles] = useState<{ key: string; file: File }[]>([]);

  useEffect(() => {
    getCategories().then((r) =>
      setCategories(r.categories.map((c) => ({ id: c.id, name: c.name })))
    );
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const priceNum = parseFloat(price);
    if (!name.trim() || isNaN(priceNum) || priceNum < 0) {
      setError('Name and a valid price are required');
      return;
    }
    setLoading(true);
    try {
      const product = await createProduct({
        name: name.trim(),
        slug: slug.trim() || undefined,
        description: description.trim() || null,
        full_description: fullDescription.trim() || null,
        fullDescription: fullDescription.trim() || null,
        features: features.map((f) => f.trim()).filter((f) => f.length > 0),
        category_id: categoryId ? Number(categoryId) : null,
        product_type: productType,
        manual_fulfillment_required: manualFulfillmentRequired,
        price: priceNum,
        compare_at_price: compareAtPrice ? parseFloat(compareAtPrice) : null,
        is_active: isActive,
        is_featured: isFeatured,
      });
      if (imageFile) {
        try {
          await uploadProductImage(product.id, imageFile);
        } catch (uploadErr) {
          const reason = uploadErr instanceof Error ? uploadErr.message : 'Upload failed';
          router.push(
            `/admin/products/${product.id}/edit?image=failed&reason=${encodeURIComponent(reason)}`
          );
          return;
        }
      }
      if (productType === 'downloadable' && pendingDownloadFiles.length > 0) {
        try {
          for (const { file } of pendingDownloadFiles) {
            await uploadProductFile(product.id, file);
          }
        } catch (uploadErr) {
          const reason = uploadErr instanceof Error ? uploadErr.message : 'Upload failed';
          router.push(
            `/admin/products/${product.id}/edit?files=failed&reason=${encodeURIComponent(reason)}`
          );
          return;
        }
      }
      toast.success('Product created');
      router.push(`/admin/products/${product.id}/edit`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to create product';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl pb-16">
      <AdminPageHeader title="Add product">
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/reviews">
            <Button variant="outline" type="button">
              Reviews
            </Button>
          </Link>
          <Link href="/admin/products">
            <Button variant="outline">Back to products</Button>
          </Link>
        </div>
      </AdminPageHeader>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <AdminAccordionSection
          title="General"
          description="Name, category, type, and base pricing. Add variations, inventory, and storefront defaults after you create the product."
          icon={<IconClipboard />}
          defaultOpen
        >
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium">Slug</label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1 flex min-h-[88px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Full description</label>
              <textarea
                value={fullDescription}
                onChange={(e) => setFullDescription(e.target.value)}
                className="mt-1 flex min-h-[200px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="Write the detailed product content..."
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Supports long-form content for the product details section.
              </p>
            </div>
            <div>
              <label className="text-sm font-medium">Features</label>
              <div className="mt-1 flex gap-2">
                <input
                  type="text"
                  value={featureInput}
                  onChange={(e) => setFeatureInput(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="Add a feature and click Add"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const next = featureInput.trim();
                    if (!next) return;
                    setFeatures((prev) => [...prev, next]);
                    setFeatureInput('');
                  }}
                >
                  Add
                </Button>
              </div>
              {features.length > 0 && (
                <ul className="mt-2 space-y-1 rounded-md border border-border bg-muted/30 px-3 py-2 text-sm">
                  {features.map((feature, index) => (
                    <li key={`${feature}-${index}`} className="flex items-center justify-between gap-2">
                      <span className="text-muted-foreground">{feature}</span>
                      <button
                        type="button"
                        className="shrink-0 text-destructive hover:underline"
                        onClick={() => setFeatures((prev) => prev.filter((_, i) => i !== index))}
                      >
                        Delete
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <label className="text-sm font-medium">Category</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">None</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Product type *</label>
              <select
                value={productType}
                onChange={(e) => {
                  const nextType = e.target.value;
                  setProductType(nextType);
                  if (nextType === 'subscription_manual' || nextType === 'digital_service') {
                    setManualFulfillmentRequired(true);
                    return;
                  }
                  setManualFulfillmentRequired(false);
                }}
                className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {PRODUCT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </div>
            {(productType === 'subscription_manual' || productType === 'digital_service') && (
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={manualFulfillmentRequired}
                  onChange={(e) => setManualFulfillmentRequired(e.target.checked)}
                />
                <span className="text-sm">Require manual fulfillment queue</span>
              </label>
            )}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium">Price *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm tabular-nums"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium">Compare at price</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={compareAtPrice}
                  onChange={(e) => setCompareAtPrice(e.target.value)}
                  className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm tabular-nums"
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
                <span className="text-sm">Active</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} />
                <span className="text-sm">Featured</span>
              </label>
            </div>
            <Button type="submit" isLoading={loading}>
              Create product
            </Button>
          </div>
        </AdminAccordionSection>

        <div className="mt-8 space-y-4">
          <div className="border-b border-border/60 pb-2">
            <h2 className="text-lg font-semibold tracking-tight">Optional uploads</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Image and files are sent right after the product is created. You can add or change them later on the edit
              page.
            </p>
          </div>

          <AdminAccordionSection
            title="Product image"
            description="Primary image used on listings and the product page."
            icon={<IconImage />}
            defaultOpen
          >
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">Image file</label>
                <input
                  type="file"
                  accept="image/*,.jpg,.jpeg,.png,.gif,.webp"
                  className={fileInputClass}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    setImageFile(f ?? null);
                  }}
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  One image per product; uploaded when you click Create product.
                </p>
              </div>
              {imageFile && (
                <p className="rounded-md border border-border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                  Selected: <span className="font-medium text-foreground">{imageFile.name}</span>
                </p>
              )}
            </div>
          </AdminAccordionSection>

          {productType === 'downloadable' && (
            <AdminAccordionSection
              title="Downloadable files"
              description="Files customers receive after purchase."
              icon={<IconFolderDown />}
              defaultOpen={false}
            >
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium">Files</label>
                  <input
                    type="file"
                    multiple
                    className={fileInputClass}
                    onChange={(e) => {
                      const list = e.target.files;
                      if (!list?.length) return;
                      setPendingDownloadFiles((prev) => [
                        ...prev,
                        ...Array.from(list).map((file) => ({
                          key: `${file.name}-${file.size}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
                          file,
                        })),
                      ]);
                      e.target.value = '';
                    }}
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    Uploaded after the product is created. Set display names and limits on the edit page if needed.
                  </p>
                </div>
                {pendingDownloadFiles.length > 0 && (
                  <ul className="space-y-1 rounded-md border border-border bg-muted/30 px-3 py-2 text-sm">
                    {pendingDownloadFiles.map(({ key, file }) => (
                      <li key={key} className="flex items-center justify-between gap-2">
                        <span className="truncate text-muted-foreground">{file.name}</span>
                        <button
                          type="button"
                          className="shrink-0 text-destructive hover:underline"
                          onClick={() =>
                            setPendingDownloadFiles((prev) => prev.filter((p) => p.key !== key))
                          }
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </AdminAccordionSection>
          )}

          {productType === 'license_key' && (
            <AdminAccordionSection
              title="License keys"
              description="Import and manage keys for this product."
              icon={<IconKey />}
              defaultOpen={false}
            >
              <p className="text-sm text-muted-foreground">
                Create the product first, then open the edit page to import license keys and manage stock.
              </p>
            </AdminAccordionSection>
          )}
        </div>
      </form>
    </div>
  );
}
