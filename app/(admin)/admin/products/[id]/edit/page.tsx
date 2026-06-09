'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { getProductById, updateProduct, getCategories, type AdminProductImage, type AdminProductFile } from '@/lib/api/admin';
import {
  AdminPageHeader,
  ProductImagesSection,
  ProductFilesSection,
  ProductLicenseKeysSection,
  ProductCatalogOptionsSection,
} from '@/components/admin';
import { AdminAccordionSection } from '@/components/admin/AdminAccordionSection';
import { IconClipboard, IconImage, IconFolderDown, IconKey } from '@/components/admin/admin-icons';
import { Button } from '@/components/ui';
import { Alert, AlertDescription } from '@/components/ui';
import type { Product } from '@/types/product';
import { productUsesVariations, getDefaultVariationPricing } from '@/lib/utils/product-catalog';
import { toast } from 'sonner';

const PRODUCT_TYPES = ['downloadable', 'license_key', 'subscription_manual', 'digital_service'];

function parseProductId(param: string | string[] | undefined): number {
  if (param == null) return NaN;
  const raw = Array.isArray(param) ? param[0] : param;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 1 ? n : NaN;
}

export default function AdminEditProductPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = parseProductId(params?.id as string | string[] | undefined);
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
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [images, setImages] = useState<AdminProductImage[]>([]);
  const [files, setFiles] = useState<AdminProductFile[]>([]);
  const [imageBanner, setImageBanner] = useState<string | null>(null);
  const [filesBanner, setFilesBanner] = useState<string | null>(null);
  const [catalogProduct, setCatalogProduct] = useState<Product | null>(null);
  const [formHasVariationDims, setFormHasVariationDims] = useState(false);

  useEffect(() => {
    setFormHasVariationDims(false);
  }, [id]);

  const usesVariations = useMemo(
    () => formHasVariationDims || (catalogProduct != null && productUsesVariations(catalogProduct)),
    [formHasVariationDims, catalogProduct]
  );

  useEffect(() => {
    if (searchParams.get('image') === 'failed' || searchParams.get('images') === 'failed') {
      const reason = searchParams.get('reason');
      setImageBanner(
        reason
          ? `Image could not be uploaded: ${reason}. Add one below.`
          : 'Product was saved, but the image failed to upload. Try again below.'
      );
    }
    if (searchParams.get('files') === 'failed') {
      const reason = searchParams.get('reason');
      setFilesBanner(
        reason
          ? `Some downloadable files could not be uploaded: ${reason}. Add them below.`
          : 'Product was created, but file upload failed. Add files below.'
      );
    }
  }, [searchParams]);

  useEffect(() => {
    if (Number.isNaN(id)) return;
    getProductById(id)
      .then((p) => {
        setName(p.name);
        setSlug(p.slug);
        setDescription(p.description ?? '');
        setFullDescription(p.full_description ?? p.fullDescription ?? '');
        setFeatures(Array.isArray(p.features) ? p.features.filter((f): f is string => typeof f === 'string') : []);
        setCategoryId(p.category_id != null ? String(p.category_id) : '');
        setProductType(p.product_type);
        setPrice(String(p.price));
        setCompareAtPrice(p.compare_at_price != null ? String(p.compare_at_price) : '');
        setIsActive(p.is_active);
        setIsFeatured(p.is_featured);
        setManualFulfillmentRequired(Boolean(p.manual_fulfillment_required));
        setImages((p.images ?? []).slice(0, 1));
        setFiles(
          (p.files ?? []).slice().sort((a, b) => a.sort_order - b.sort_order || a.id - b.id)
        );
        setCatalogProduct(p);
      })
      .catch((err) => setLoadError(err instanceof Error ? err.message : 'Failed to load'));
    getCategories().then((r) =>
      setCategories(r.categories.map((c) => ({ id: c.id, name: c.name })))
    );
  }, [id]);

  /** Only mirror catalog into the General price fields when variations are in play (fields are read-only then). */
  useEffect(() => {
    if (!catalogProduct || !usesVariations) return;
    const def = getDefaultVariationPricing(catalogProduct);
    if (def) {
      setPrice(String(def.price));
      setCompareAtPrice(def.compare_at_price != null ? String(def.compare_at_price) : '');
      return;
    }
    setPrice(String(catalogProduct.price));
    setCompareAtPrice(catalogProduct.compare_at_price != null ? String(catalogProduct.compare_at_price) : '');
  }, [catalogProduct, usesVariations]);

  const defaultVariationPricing = catalogProduct ? getDefaultVariationPricing(catalogProduct) : null;

  const priceLabel = usesVariations
    ? defaultVariationPricing != null
      ? 'Storefront (default row)'
      : 'Product base price'
    : 'Price';

  const compareLabel = usesVariations
    ? defaultVariationPricing != null
      ? 'Compare at (default row)'
      : 'Compare at (optional)'
    : 'Compare at price';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (Number.isNaN(id)) return;
    setSubmitError(null);
    const priceNum = parseFloat(price);
    if (!name.trim() || isNaN(priceNum) || priceNum < 0) {
      setSubmitError('Name and a valid price are required');
      return;
    }
    setLoading(true);
    try {
      await updateProduct(id, {
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
      const refreshed = await getProductById(id);
      setCatalogProduct(refreshed);
      if (!usesVariations) {
        setPrice(String(refreshed.price));
        setCompareAtPrice(refreshed.compare_at_price != null ? String(refreshed.compare_at_price) : '');
      }
      router.refresh();
      toast.success('Product saved');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update';
      setSubmitError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (loadError) {
    return (
      <div>
        <AdminPageHeader title="Edit product" />
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">{loadError}</div>
        <Link href="/admin/products" className="mt-4 inline-block">
          <Button variant="outline">Back to products</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl pb-16">
      <AdminPageHeader title="Edit product">
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
        {submitError && (
          <Alert variant="destructive">
            <AlertDescription>{submitError}</AlertDescription>
          </Alert>
        )}
        <AdminAccordionSection
          title="General"
          description="Name, category, type, and pricing shown to customers (when not overridden by variations)."
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
            {/* <div>
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
            </div> */}
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
            {usesVariations ? (
              <p className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-sm text-amber-950 dark:text-amber-100">
                Variations are enabled — list prices are set on each variation row. This field reflects{' '}
                {defaultVariationPricing != null
                  ? 'the default row (storefront).'
                  : 'the product base used for new rows until you pick a default.'}
              </p>
            ) : null}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium">{priceLabel} *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  disabled={usesVariations}
                  className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm tabular-nums disabled:cursor-not-allowed disabled:opacity-60"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium">{compareLabel}</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={compareAtPrice}
                  onChange={(e) => setCompareAtPrice(e.target.value)}
                  disabled={usesVariations}
                  className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm tabular-nums disabled:cursor-not-allowed disabled:opacity-60"
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
              Save changes
            </Button>
          </div>
        </AdminAccordionSection>
      </form>

      {!Number.isNaN(id) && catalogProduct && (
        <div className="mt-8 space-y-4">
          <div className="border-b border-border/60 pb-2">
            <h2 className="text-lg font-semibold tracking-tight">Purchase catalog</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Inventory, attributes, and variation rows — similar to WooCommerce variable products.
            </p>
          </div>
          <ProductCatalogOptionsSection
            productId={id}
            product={catalogProduct}
            onProductUpdated={setCatalogProduct}
            onVariationDimensionsChange={setFormHasVariationDims}
          />

          <AdminAccordionSection
            title="Product image"
            description="Primary image used on listings and the product page."
            icon={<IconImage />}
            defaultOpen
          >
            <div className="space-y-3">
              {imageBanner && (
                <Alert>
                  <AlertDescription>{imageBanner}</AlertDescription>
                </Alert>
              )}
              <ProductImagesSection productId={id} images={images} setImages={setImages} />
            </div>
          </AdminAccordionSection>

          {/* {productType === 'downloadable' && (
            <AdminAccordionSection
              title="Downloadable files"
              description="Files customers receive after purchase."
              icon={<IconFolderDown />}
              defaultOpen={false}
            >
              <div className="space-y-3">
                {filesBanner && (
                  <Alert>
                    <AlertDescription>{filesBanner}</AlertDescription>
                  </Alert>
                )}
                <ProductFilesSection productId={id} files={files} setFiles={setFiles} />
              </div>
            </AdminAccordionSection>
          )} */}

          {/* {productType === 'license_key' && (
            <AdminAccordionSection
              title="License keys"
              description="Import and manage keys for this product."
              icon={<IconKey />}
              defaultOpen={false}
            >
              <ProductLicenseKeysSection productId={id} product={catalogProduct} />
            </AdminAccordionSection>
          )} */}
        </div>
      )}
    </div>
  );
}
