// 'use client';

// import { Suspense, useCallback, useEffect, useState } from 'react';
// import Link from 'next/link';
// import { usePathname, useRouter, useSearchParams } from 'next/navigation';
// import { getAdminReviewsList, getCategories, setReviewHidden } from '@/lib/api/admin';
// import type { CategoryItem } from '@/lib/api/admin';
// import { AdminPageHeader } from '@/components/admin/PageHeader';
// import { DataTable } from '@/components/admin/DataTable';
// import { Button, Pagination } from '@/components/ui';
// import type { ProductReviewAdminTableRow } from '@/types/review';
// import { toast } from 'sonner';

// const PAGE_SIZE = 10;

// function parseCategoryId(searchParams: URLSearchParams): number | undefined {
//   const raw = searchParams.get('category_id');
//   if (raw === null || raw === '') return undefined;
//   const n = Number(raw);
//   return Number.isInteger(n) && n >= 0 ? n : undefined;
// }

// function AdminReviewsContent() {
//   const router = useRouter();
//   const pathname = usePathname();
//   const searchParams = useSearchParams();
//   const pageFromUrl = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
//   const categoryId = parseCategoryId(searchParams);

//   const [categories, setCategories] = useState<CategoryItem[]>([]);
//   const [reviews, setReviews] = useState<ProductReviewAdminTableRow[]>([]);
//   const [total, setTotal] = useState(0);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//   const [busyId, setBusyId] = useState<number | null>(null);

//   useEffect(() => {
//     getCategories()
//       .then((r) => setCategories(r.categories))
//       .catch(() => setCategories([]));
//   }, []);

//   const fetchPage = useCallback(async () => {
//     const offset = (pageFromUrl - 1) * PAGE_SIZE;
//     return getAdminReviewsList({
//       limit: PAGE_SIZE,
//       offset,
//       ...(categoryId !== undefined ? { category_id: categoryId } : {}),
//     });
//   }, [pageFromUrl, categoryId]);

//   useEffect(() => {
//     let cancelled = false;
//     setLoading(true);
//     setError(null);
//     fetchPage()
//       .then((r) => {
//         if (cancelled) return;
//         setReviews(r.reviews);
//         setTotal(r.total);
//         const totalPages = Math.max(1, Math.ceil(r.total / PAGE_SIZE) || 1);
//         if (r.total > 0 && pageFromUrl > totalPages) {
//           const p = new URLSearchParams(searchParams.toString());
//           if (totalPages <= 1) p.delete('page');
//           else p.set('page', String(totalPages));
//           router.replace(p.toString() ? `${pathname}?${p}` : pathname);
//         }
//       })
//       .catch((err) => {
//         if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load');
//       })
//       .finally(() => {
//         if (!cancelled) setLoading(false);
//       });
//     return () => {
//       cancelled = true;
//     };
//   }, [fetchPage, pageFromUrl, pathname, router, searchParams]);

//   const setPage = (p: number) => {
//     const params = new URLSearchParams(searchParams.toString());
//     if (p <= 1) params.delete('page');
//     else params.set('page', String(p));
//     const q = params.toString();
//     router.push(q ? `${pathname}?${q}` : pathname);
//   };

//   const setCategoryFilter = (value: string) => {
//     const params = new URLSearchParams(searchParams.toString());
//     params.delete('page');
//     if (value === 'all') params.delete('category_id');
//     else params.set('category_id', value);
//     const q = params.toString();
//     router.push(q ? `${pathname}?${q}` : pathname);
//   };

//   const toggleHidden = async (row: ProductReviewAdminTableRow) => {
//     setBusyId(row.id);
//     setError(null);
//     try {
//       await setReviewHidden(row.id, !row.is_hidden);
//       const r = await fetchPage();
//       setReviews(r.reviews);
//       setTotal(r.total);
//       toast.success(row.is_hidden ? 'Review is visible again' : 'Review hidden');
//     } catch (err) {
//       const msg = err instanceof Error ? err.message : 'Update failed';
//       setError(msg);
//       toast.error(msg);
//     } finally {
//       setBusyId(null);
//     }
//   };

//   const categorySelectValue =
//     categoryId === undefined ? 'all' : String(categoryId);

//   const truncate = (text: string | null, max: number) => {
//     if (!text) return '—';
//     const t = text.trim();
//     if (t.length <= max) return t;
//     return `${t.slice(0, max)}…`;
//   };

//   return (
//     <div>
//       <AdminPageHeader
//         title="Reviews"
//         description="Customer reviews publish immediately. Hide inappropriate reviews here. Filter by product category."
//       />

//       <div className="mb-4 flex flex-wrap items-end gap-3">
//         <div>
//           <label htmlFor="reviews-category" className="mb-1 block text-sm font-medium">
//             Category
//           </label>
//           <select
//             id="reviews-category"
//             value={categorySelectValue}
//             onChange={(e) => setCategoryFilter(e.target.value)}
//             className="flex h-10 min-w-[200px] rounded-md border border-input bg-background px-3 py-2 text-sm"
//           >
//             <option value="all">All categories</option>
//             <option value="0">Uncategorized</option>
//             {categories.map((c) => (
//               <option key={c.id} value={String(c.id)}>
//                 {c.name}
//               </option>
//             ))}
//           </select>
//         </div>
//       </div>

//       {error && (
//         <div className="mb-4 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive text-sm">
//           {error}
//         </div>
//       )}

//       {loading ? (
//         <p className="text-sm text-muted-foreground">Loading…</p>
//       ) : (
//         <>
//           <DataTable<ProductReviewAdminTableRow>
//             striped
//             keyExtractor={(row) => row.id}
//             emptyMessage="No reviews match this filter."
//             data={reviews}
//             columns={[
//               {
//                 key: 'product',
//                 header: 'Product',
//                 render: (row) => (
//                   <Link
//                     href={`/products/${row.product_slug}`}
//                     className="font-medium text-primary underline-offset-4 hover:underline"
//                     target="_blank"
//                     rel="noreferrer"
//                   >
//                     {row.product_name}
//                   </Link>
//                 ),
//               },
//               {
//                 key: 'category',
//                 header: 'Category',
//                 render: (row) => row.category_name ?? <span className="text-muted-foreground">Uncategorized</span>,
//               },
//               {
//                 key: 'rating',
//                 header: 'Rating',
//                 className: 'whitespace-nowrap tabular-nums',
//                 render: (row) => `${row.rating}/5`,
//               },
//               {
//                 key: 'excerpt',
//                 header: 'Review',
//                 render: (row) => (
//                   <span title={row.body ?? row.title ?? ''}>
//                     {truncate(row.title ?? row.body, 80)}
//                   </span>
//                 ),
//               },
//               {
//                 key: 'flags',
//                 header: 'Flags',
//                 render: (row) => (
//                   <span className="flex flex-wrap gap-1">
//                     {row.is_hidden && (
//                       <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase">Hidden</span>
//                     )}
//                     {row.is_verified_purchase && (
//                       <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
//                         Verified
//                       </span>
//                     )}
//                   </span>
//                 ),
//               },
//               {
//                 key: 'date',
//                 header: 'Date',
//                 className: 'whitespace-nowrap text-muted-foreground',
//                 render: (row) =>
//                   new Date(row.created_at).toLocaleDateString(undefined, {
//                     year: 'numeric',
//                     month: 'short',
//                     day: 'numeric',
//                   }),
//               },
//               {
//                 key: 'actions',
//                 header: '',
//                 className: 'whitespace-nowrap',
//                 render: (row) => (
//                   <Button
//                     type="button"
//                     variant={row.is_hidden ? 'primary' : 'outline'}
//                     size="sm"
//                     disabled={busyId === row.id}
//                     isLoading={busyId === row.id}
//                     onClick={() => void toggleHidden(row)}
//                   >
//                     {row.is_hidden ? 'Show' : 'Hide'}
//                   </Button>
//                 ),
//               },
//             ]}
//           />
//           <Pagination
//             className="mt-6"
//             page={pageFromUrl}
//             pageSize={PAGE_SIZE}
//             totalItems={total}
//             onPageChange={setPage}
//             ariaLabel="Reviews pagination"
//           />
//         </>
//       )}
//     </div>
//   );
// }

// export default function AdminReviewsPage() {
//   return (
//     <Suspense fallback={<p className="text-sm text-muted-foreground">Loading…</p>}>
//       <AdminReviewsContent />
//     </Suspense>
//   );
// }

'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { createAdminReview, getAdminReviewsList, getCategories, getProducts, setReviewHidden } from '@/lib/api/admin';
import type { CategoryItem } from '@/lib/api/admin';
import { AdminPageHeader } from '@/components/admin/PageHeader';
import { DataTable } from '@/components/admin/DataTable';
import { Button, Pagination } from '@/components/ui';
import type { ProductReviewAdminTableRow } from '@/types/review';
import { toast } from 'sonner';
import { X, Plus, Star } from 'lucide-react';
import { getReviewImageUrl } from '@/lib/imageUrl';

const PAGE_SIZE = 10;

function parseCategoryId(searchParams: URLSearchParams): number | undefined {
  const raw = searchParams.get('category_id');
  if (raw === null || raw === '') return undefined;
  const n = Number(raw);
  return Number.isInteger(n) && n >= 0 ? n : undefined;
}

// Stars component for the modal
function Stars({ rating, size = 'md' }: { rating: number; size?: 'sm' | 'md' }) {
  const starClass = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5';
  return (
    <span className="inline-flex items-center gap-0.5 text-amber-500" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <svg key={n} className={starClass} fill={n <= rating ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={n <= rating ? 0 : 1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      ))}
    </span>
  );
}

// Review Creation Modal
interface CreateReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

function CreateReviewModal({ isOpen, onClose, onSuccess }: CreateReviewModalProps) {
  const [products, setProducts] = useState<Array<{ id: number; name: string }>>([]);
  const [productId, setProductId] = useState('');
  const [reviewerName, setReviewerName] = useState('');
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setRating(5);
      setProductId('');
      setReviewerName('');
      setTitle('');
      setBody('');
      setImage(null);
      setFormError(null);
      setFormSuccess(null);
      getProducts({ page: 1, limit: 100 })
        .then((result) => setProducts(result.products.map((product) => ({ id: product.id, name: product.name }))))
        .catch(() => setProducts([]));
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);
    setSubmitting(true);

    try {
      if (!productId) throw new Error('Please select a product');
      if (!reviewerName.trim()) throw new Error('Reviewer name is required');
      await createAdminReview({
        product_id: Number(productId),
        reviewer_name: reviewerName,
        rating,
        title: title.trim() || undefined,
        body: body.trim() || undefined,
        image,
      });
      setFormSuccess('Review created successfully!');
      onClose();
      onSuccess();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not create review';
      setFormError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative z-50 mx-4 max-h-[calc(100vh-2rem)] w-full max-w-3xl overflow-y-auto rounded-xl border border-border/80 bg-background shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border/80">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Create Review</h2>
            <p className="text-sm text-muted-foreground mt-1">Add a new review to the system</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-muted-foreground hover:bg-muted transition-colors"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div>
            <label htmlFor="modal-review-product" className="text-sm font-medium text-foreground block mb-2">
              Product <span className="text-destructive">*</span>
            </label>
            <select
              id="modal-review-product"
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              required
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">Select a product</option>
              {products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}
            </select>
          </div>

          <div>
            <label htmlFor="modal-reviewer-name" className="text-sm font-medium text-foreground block mb-2">
              Reviewer name <span className="text-destructive">*</span>
            </label>
            <input
              id="modal-reviewer-name"
              type="text"
              maxLength={120}
              value={reviewerName}
              onChange={(e) => setReviewerName(e.target.value)}
              required
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="Name to show beside this review"
            />
          </div>
          </div>
 
          {/* Rating */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div>
            <label className="text-sm font-medium text-foreground block mb-3">
              Rating <span className="text-destructive">*</span>
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRating(n)}
                  className={`rounded-lg border px-2 py-2 text-xs font-medium transition-all ${
                    rating === n
                      ? 'border-primary bg-primary/10 text-primary shadow-sm scale-105'
                      : 'border-border bg-muted/40 text-muted-foreground hover:bg-muted hover:scale-105'
                  }`}
                  aria-pressed={rating === n}
                >
                  {n} Star{n > 1 ? 's' : ''}
                </button>
              ))}
            </div>
            <div className="mt-2">
              <Stars rating={rating} />
            </div>
          </div>

          <div>
            <label htmlFor="modal-review-image" className="text-sm font-medium text-foreground block mb-2">
              Review photo <span className="font-normal text-muted-foreground">(optional)</span>
            </label>
            <input
              id="modal-review-image"
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              onChange={(e) => setImage(e.target.files?.[0] ?? null)}
              className="block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-primary/10 file:px-3 file:py-2 file:font-medium file:text-primary hover:file:bg-primary/20"
            />
            {image && <p className="mt-1 text-xs text-muted-foreground">Selected: {image.name}</p>}
          </div>
          </div>

          {/* Title */}
          <div className="lg:col-span-2">
            <label htmlFor="modal-review-title" className="text-sm font-medium text-foreground block mb-2">
              Title <span className="font-normal text-muted-foreground">(optional)</span>
            </label>
            <input
              id="modal-review-title"
              type="text"
              maxLength={255}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="Brief summary of the review"
            />
          </div>

          {/* Body */}
          <div className="lg:col-span-2">
            <label htmlFor="modal-review-body" className="text-sm font-medium text-foreground block mb-2">
              Review <span className="font-normal text-muted-foreground">(optional)</span>
            </label>
            <textarea
              id="modal-review-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={5}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
              placeholder="Write your review content..."
            />
          </div>

          {/* Messages */}
          {formError && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive lg:col-span-2">
              {formError}
            </div>
          )}
          {formSuccess && (
            <div className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-sm text-foreground lg:col-span-2">
              {formSuccess}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2 lg:col-span-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              isLoading={submitting}
              className="flex-1"
            >
              {submitting ? 'Creating...' : 'Create Review'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AdminReviewsContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const pageFromUrl = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
  const categoryId = parseCategoryId(searchParams);

  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [reviews, setReviews] = useState<ProductReviewAdminTableRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    getCategories()
      .then((r) => setCategories(r.categories))
      .catch(() => setCategories([]));
  }, []);

  const fetchPage = useCallback(async () => {
    const offset = (pageFromUrl - 1) * PAGE_SIZE;
    return getAdminReviewsList({
      limit: PAGE_SIZE,
      offset,
      ...(categoryId !== undefined ? { category_id: categoryId } : {}),
    });
  }, [pageFromUrl, categoryId]);

  const loadReviews = useCallback(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchPage()
      .then((r) => {
        if (cancelled) return;
        setReviews(r.reviews);
        setTotal(r.total);
        const totalPages = Math.max(1, Math.ceil(r.total / PAGE_SIZE) || 1);
        if (r.total > 0 && pageFromUrl > totalPages) {
          const p = new URLSearchParams(searchParams.toString());
          if (totalPages <= 1) p.delete('page');
          else p.set('page', String(totalPages));
          router.replace(p.toString() ? `${pathname}?${p}` : pathname);
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [fetchPage, pageFromUrl, pathname, router, searchParams]);

  useEffect(() => {
    const cleanup = loadReviews();
    return cleanup;
  }, [loadReviews]);

  const setPage = (p: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (p <= 1) params.delete('page');
    else params.set('page', String(p));
    const q = params.toString();
    router.push(q ? `${pathname}?${q}` : pathname);
  };

  const setCategoryFilter = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('page');
    if (value === 'all') params.delete('category_id');
    else params.set('category_id', value);
    const q = params.toString();
    router.push(q ? `${pathname}?${q}` : pathname);
  };

  const toggleHidden = async (row: ProductReviewAdminTableRow) => {
    setBusyId(row.id);
    setError(null);
    try {
      await setReviewHidden(row.id, !row.is_hidden);
      await loadReviews();
      toast.success(row.is_hidden ? 'Review is visible again' : 'Review hidden');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Update failed';
      setError(msg);
      toast.error(msg);
    } finally {
      setBusyId(null);
    }
  };

  const handleCreateSuccess = () => {
    setIsCreateModalOpen(false);
    loadReviews();
    toast.success('Review created successfully');
  };

  const categorySelectValue =
    categoryId === undefined ? 'all' : String(categoryId);

  const truncate = (text: string | null, max: number) => {
    if (!text) return '—';
    const t = text.trim();
    if (t.length <= max) return t;
    return `${t.slice(0, max)}…`;
  };

  return (
    <div>
      <AdminPageHeader
        title="Reviews"
        description="Customer reviews publish immediately. Hide inappropriate reviews here. Filter by product category."
      />

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor="reviews-category" className="mb-1 block text-sm font-medium">
            Category
          </label>
          <select
            id="reviews-category"
            value={categorySelectValue}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="flex h-10 min-w-[200px] rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="all">All categories</option>
            <option value="0">Uncategorized</option>
            {categories.map((c) => (
              <option key={c.id} value={String(c.id)}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <Button
          onClick={() => setIsCreateModalOpen(true)}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Create Review
        </Button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <>
          <DataTable<ProductReviewAdminTableRow>
            striped
            keyExtractor={(row) => row.id}
            emptyMessage="No reviews match this filter."
            data={reviews}
            columns={[
              {
                key: 'product',
                header: 'Product',
                render: (row) => (
                  <Link
                    href={`/products/${row.product_slug}`}
                    className="font-medium text-primary underline-offset-4 hover:underline"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {row.product_name}
                  </Link>
                ),
              },
              {
                key: 'category',
                header: 'Category',
                render: (row) => row.category_name ?? <span className="text-muted-foreground">Uncategorized</span>,
              },
              {
                key: 'rating',
                header: 'Rating',
                className: 'whitespace-nowrap tabular-nums',
                render: (row) => `${row.rating}/5`,
              },
              {
                key: 'reviewer',
                header: 'Reviewer',
                render: (row) => row.reviewer_name ?? <span className="text-muted-foreground">Customer</span>,
              },
              {
                key: 'excerpt',
                header: 'Review',
                render: (row) => (
                  <span title={row.body ?? row.title ?? ''}>
                    {truncate(row.title ?? row.body, 80)}
                  </span>
                ),
              },
              {
                key: 'image',
                header: 'Photo',
                render: (row) => {
                  const imageUrl = getReviewImageUrl(row.image_path);
                  return imageUrl ? <img src={imageUrl} alt="Review" className="h-10 w-10 rounded-md border border-border object-cover" /> : <span className="text-muted-foreground">—</span>;
                },
              },
              {
                key: 'flags',
                header: 'Flags',
                render: (row) => (
                  <span className="flex flex-wrap gap-1">
                    {row.is_hidden && (
                      <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase">Hidden</span>
                    )}
                    {row.is_verified_purchase && (
                      <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                        Verified
                      </span>
                    )}
                  </span>
                ),
              },
              {
                key: 'date',
                header: 'Date',
                className: 'whitespace-nowrap text-muted-foreground',
                render: (row) =>
                  new Date(row.created_at).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  }),
              },
              {
                key: 'actions',
                header: '',
                className: 'whitespace-nowrap',
                render: (row) => (
                  <Button
                    type="button"
                    variant={row.is_hidden ? 'primary' : 'outline'}
                    size="sm"
                    disabled={busyId === row.id}
                    isLoading={busyId === row.id}
                    onClick={() => void toggleHidden(row)}
                  >
                    {row.is_hidden ? 'Show' : 'Hide'}
                  </Button>
                ),
              },
            ]}
          />
          <Pagination
            className="mt-6"
            page={pageFromUrl}
            pageSize={PAGE_SIZE}
            totalItems={total}
            onPageChange={setPage}
            ariaLabel="Reviews pagination"
          />
        </>
      )}

      {/* Create Review Modal */}
      <CreateReviewModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
      />
    </div>
  );
}

export default function AdminReviewsPage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Loading…</p>}>
      <AdminReviewsContent />
    </Suspense>
  );
}
