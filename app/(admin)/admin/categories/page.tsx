'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { getCategories, createCategory, updateCategory, deleteCategory, reorderCategories } from '@/lib/api/admin';
import type { CategoryItem } from '@/lib/api/admin';
import { AdminPageHeader, Modal } from '@/components/admin';
import { Button } from '@/components/ui';
import { Alert, AlertDescription } from '@/components/ui';
import { IconPencil, IconTrash, IconGripVertical } from '@/components/admin/admin-icons';
import { getCategoryBannerImageUrl, getCategoryImageUrl } from '@/lib/imageUrl';
import { toast } from 'sonner';

function AdminCategoriesContent() {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [savingOrder, setSavingOrder] = useState(false);
  const [search, setSearch] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CategoryItem | null>(null);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CategoryItem | null>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getCategories({ limit: 100 })
      .then((r) => {
        if (cancelled) return;
        const sorted = (r.categories ?? []).slice().sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
        setCategories(sorted);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load categories');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [refreshToken]);

  const bumpRefresh = () => setRefreshToken((t) => t + 1);

  const previewUrl = useMemo(() => {
    if (imageFile) return URL.createObjectURL(imageFile);
    return editing ? getCategoryImageUrl(editing.image) : null;
  }, [imageFile, editing]);

  const bannerPreviewUrl = useMemo(() => {
    if (bannerFile) return URL.createObjectURL(bannerFile);
    return editing ? getCategoryBannerImageUrl(editing.banner_image) : null;
  }, [bannerFile, editing]);

  useEffect(() => {
    return () => {
      if (previewUrl?.startsWith('blob:')) URL.revokeObjectURL(previewUrl);
      if (bannerPreviewUrl?.startsWith('blob:')) URL.revokeObjectURL(bannerPreviewUrl);
    };
  }, [previewUrl, bannerPreviewUrl]);

  const moveCategory = async (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= categories.length) return;
    const next = [...categories];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    setCategories(next);

    setSavingOrder(true);
    try {
      const orderedIds = next.map((c) => c.id);
      await reorderCategories(orderedIds);
      toast.success('Category sequence updated');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save category order');
    } finally {
      setSavingOrder(false);
    }
  };

  const handleDragStart = (index: number, e: React.DragEvent) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
  };

  const handleDragOver = (index: number, e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDrop = async (targetIndex: number) => {
    if (draggedIndex === null || draggedIndex === targetIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const next = [...categories];
    const [moved] = next.splice(draggedIndex, 1);
    next.splice(targetIndex, 0, moved);
    setCategories(next);
    setDraggedIndex(null);
    setDragOverIndex(null);

    setSavingOrder(true);
    try {
      const orderedIds = next.map((c) => c.id);
      await reorderCategories(orderedIds);
      toast.success('Category sequence updated');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save category order');
    } finally {
      setSavingOrder(false);
    }
  };

  const handleSaveAllSequence = async () => {
    setSavingOrder(true);
    try {
      const orderedIds = categories.map((c) => c.id);
      await reorderCategories(orderedIds);
      toast.success('Category sequence saved successfully');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save category order');
    } finally {
      setSavingOrder(false);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setName('');
    setSlug('');
    setDescription('');
    setImageFile(null);
    setBannerFile(null);
    setFormError(null);
    setModalOpen(true);
  };

  const openEdit = (c: CategoryItem) => {
    setEditing(c);
    setName(c.name);
    setSlug(c.slug);
    setDescription(c.description ?? '');
    setImageFile(null);
    setBannerFile(null);
    setFormError(null);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!name.trim()) {
      setFormError('Name is required');
      return;
    }
    setSubmitting(true);
    try {
      if (editing) {
        await updateCategory(editing.id, {
          name: name.trim(),
          slug: slug.trim() || undefined,
          description: description.trim() || null,
          image: imageFile,
          banner_image: bannerFile,
        });
      } else {
        await createCategory({
          name: name.trim(),
          slug: slug.trim() || undefined,
          description: description.trim() || null,
          image: imageFile,
          banner_image: bannerFile,
          sort_order: categories.length + 1,
        });
      }
      setModalOpen(false);
      bumpRefresh();
      toast.success(editing ? 'Category updated' : 'Category created');
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSubmitting(false);
    }
  };

  const closeDeleteModal = () => {
    setDeleteTarget(null);
    setDeleteError(null);
  };

  const confirmDeleteCategory = async () => {
    if (!deleteTarget) return;
    setDeleteError(null);
    setDeleteSubmitting(true);
    try {
      await deleteCategory(deleteTarget.id);
      closeDeleteModal();
      bumpRefresh();
      toast.success('Category deleted');
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete');
    } finally {
      setDeleteSubmitting(false);
    }
  };

  const filteredCategories = useMemo(() => {
    if (!search.trim()) return categories;
    const q = search.toLowerCase();
    return categories.filter(
      (c) => c.name.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q) || (c.description && c.description.toLowerCase().includes(q))
    );
  }, [categories, search]);

  if (loading && categories.length === 0) {
    return (
      <div className="flex justify-center py-12">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <AdminPageHeader
        title="Categories"
        description="Drag and drop rows or use arrow buttons to organize category serial sequence. The homepage category product sections and slider follow this exact order."
      >
        <div className="flex items-center gap-2.5">
          <Button onClick={openCreate}>Add category</Button>
          {categories.length > 1 && (
            <Button
              variant="outline"
              onClick={handleSaveAllSequence}
              isLoading={savingOrder}
              title="Save the current sequence"
            >
              Save Sequence
            </Button>
          )}
        </div>
      </AdminPageHeader>

      {/* Helper Banner */}
      <div className="flex items-start gap-3 rounded-xl border border-primary/25 bg-primary/5 p-4 text-xs sm:text-sm text-foreground shadow-sm">
        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <IconGripVertical className="h-4 w-4" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-foreground">Category Drag & Drop Sorting Enabled</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Click and drag anywhere on a category row using the grip icon <span className="font-medium text-foreground">⠿</span> to change its serial order. The homepage will display the category product sections and sliders in this exact sequence.
          </p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Filter / Search Bar */}
      {categories.length > 5 && (
        <div className="flex items-center justify-between gap-4">
          <div className="relative max-w-xs flex-1">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search category name or slug..."
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
            />
          </div>
          <span className="text-xs text-muted-foreground">
            Showing {filteredCategories.length} of {categories.length} categories
          </span>
        </div>
      )}

      {/* Draggable Categories Table */}
      <div className="overflow-hidden rounded-xl border border-border/70 bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border/70 bg-muted/40 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="w-12 px-3 py-3 text-center">Move</th>
                <th className="w-16 px-3 py-3 text-center">Serial</th>
                <th className="w-16 px-3 py-3">Image</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Slug</th>
                <th className="w-32 px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    No categories found
                  </td>
                </tr>
              ) : (
                filteredCategories.map((c) => {
                  const originalIndex = categories.findIndex((cat) => cat.id === c.id);
                  const isDragging = draggedIndex === originalIndex;
                  const isDragOver = dragOverIndex === originalIndex && draggedIndex !== originalIndex;
                  const cardUrl = getCategoryImageUrl(c.image);

                  return (
                    <tr
                      key={c.id}
                      draggable={!search.trim()}
                      onDragStart={(e) => handleDragStart(originalIndex, e)}
                      onDragOver={(e) => handleDragOver(originalIndex, e)}
                      onDragEnd={handleDragEnd}
                      onDrop={() => handleDrop(originalIndex)}
                      className={`group transition-all duration-150 ${
                        isDragging
                          ? 'opacity-40 bg-muted/60 border-dashed border-primary ring-1 ring-primary/40'
                          : isDragOver
                          ? 'bg-primary/10 border-t-2 border-primary shadow-sm'
                          : 'hover:bg-muted/35 bg-card'
                      }`}
                    >
                      {/* Drag Handle */}
                      <td className="px-3 py-3 text-center align-middle">
                        <div
                          className={`inline-flex h-8 w-8 items-center justify-center rounded-md border border-transparent text-muted-foreground/60 transition-colors group-hover:border-border/60 group-hover:text-foreground group-hover:bg-muted/60 ${
                            !search.trim() ? 'cursor-grab active:cursor-grabbing hover:text-primary hover:border-primary/40' : 'cursor-not-allowed opacity-40'
                          }`}
                          title={!search.trim() ? 'Click & drag to reorder serial' : 'Clear search filter to drag'}
                        >
                          <IconGripVertical className="h-4 w-4" />
                        </div>
                      </td>

                      {/* Serial Badge */}
                      <td className="px-3 py-3 text-center align-middle">
                        <span className="inline-flex min-w-[32px] items-center justify-center rounded-full border border-primary/25 bg-primary/10 px-2 py-0.5 font-mono text-xs font-bold text-primary">
                          #{originalIndex + 1}
                        </span>
                      </td>

                      {/* Thumbnail */}
                      <td className="px-3 py-3 align-middle">
                        {cardUrl ? (
                          <img
                            src={cardUrl}
                            alt={c.name}
                            className="h-10 w-10 rounded-lg border border-border/60 object-cover shadow-sm"
                          />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-dashed border-border/80 bg-muted/30 text-xs font-semibold text-muted-foreground uppercase">
                            {c.name.slice(0, 2)}
                          </div>
                        )}
                      </td>

                      {/* Category Name & Description */}
                      <td className="px-4 py-3 align-middle">
                        <p className="font-semibold text-foreground group-hover:text-primary transition-colors">
                          {c.name}
                        </p>
                        {c.description ? (
                          <p className="line-clamp-1 text-xs text-muted-foreground">{c.description}</p>
                        ) : null}
                      </td>

                      {/* Slug */}
                      <td className="px-4 py-3 align-middle">
                        <span className="rounded bg-muted/60 px-2 py-0.5 font-mono text-xs text-muted-foreground">
                          {c.slug}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right align-middle">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Up Reorder Button */}
                          <button
                            type="button"
                            disabled={originalIndex === 0 || savingOrder || Boolean(search.trim())}
                            onClick={() => moveCategory(originalIndex, originalIndex - 1)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-input bg-background text-muted-foreground shadow-sm transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
                            title="Move Up"
                            aria-label="Move Up"
                          >
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                            </svg>
                          </button>

                          {/* Down Reorder Button */}
                          <button
                            type="button"
                            disabled={originalIndex === categories.length - 1 || savingOrder || Boolean(search.trim())}
                            onClick={() => moveCategory(originalIndex, originalIndex + 1)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-input bg-background text-muted-foreground shadow-sm transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
                            title="Move Down"
                            aria-label="Move Down"
                          >
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>

                          {/* Edit Button */}
                          <button
                            type="button"
                            onClick={() => openEdit(c)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-input bg-background text-foreground shadow-sm transition-colors hover:bg-muted"
                            title="Edit Category"
                            aria-label="Edit Category"
                          >
                            <IconPencil className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                          </button>

                          {/* Delete Button */}
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(c)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-destructive/30 bg-destructive/10 text-destructive shadow-sm transition-colors hover:bg-destructive hover:text-destructive-foreground"
                            title="Delete Category"
                            aria-label="Delete Category"
                          >
                            <IconTrash className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit category' : 'Add category'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <Alert variant="destructive">
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          )}
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
              className="mt-1 flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Card image</label>
            <p className="text-xs text-muted-foreground">Shown in the homepage category slider.</p>
            {previewUrl && (
              <img src={previewUrl} alt="" className="mt-2 h-32 w-full rounded-md object-cover" />
            )}
            <input
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
              className="mt-2 block w-full text-sm text-muted-foreground file:mr-4 file:rounded-md file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary-foreground hover:file:bg-primary/90"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Section banner image</label>
            <p className="text-xs text-muted-foreground">Shown above the product grid for this category on the homepage.</p>
            {bannerPreviewUrl && (
              <img src={bannerPreviewUrl} alt="" className="mt-2 h-32 w-full rounded-md object-cover" />
            )}
            <input
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              onChange={(e) => setBannerFile(e.target.files?.[0] ?? null)}
              className="mt-2 block w-full text-sm text-muted-foreground file:mr-4 file:rounded-md file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary-foreground hover:file:bg-primary/90"
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <Button type="submit" isLoading={submitting}>
              {editing ? 'Save' : 'Create'}
            </Button>
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal open={deleteTarget != null} onClose={closeDeleteModal} title="Delete category">
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Delete <span className="font-semibold text-foreground">{deleteTarget?.name}</span>? The category will be
            soft-deleted and hidden from admin lists and the storefront.
          </p>
          {deleteError && (
            <Alert variant="destructive">
              <AlertDescription>{deleteError}</AlertDescription>
            </Alert>
          )}
          <div className="flex flex-wrap gap-3 pt-1">
            <Button type="button" variant="outline" onClick={closeDeleteModal} disabled={deleteSubmitting}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={confirmDeleteCategory}
              isLoading={deleteSubmitting}
            >
              Delete category
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default function AdminCategoriesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-12">
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      }
    >
      <AdminCategoriesContent />
    </Suspense>
  );
}

