'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  createBanner,
  deleteBanner,
  getAdminBanners,
  updateBanner,
  type AdminBannerItem,
} from '@/lib/api/admin';
import type { BannerButton } from '@/lib/api/banners';
import { AdminPageHeader, DataTable, Modal } from '@/components/admin';
import { Alert, AlertDescription, Button } from '@/components/ui';
import { getBannerImageUrl } from '@/lib/imageUrl';
import { toast } from 'sonner';

type ButtonDraft = { title: string; route: string };

function cleanButtons(buttons: ButtonDraft[]): BannerButton[] {
  return buttons
    .map((button) => ({ title: button.title.trim(), route: button.route.trim() }))
    .filter((button) => button.title && button.route);
}

export default function AdminBannersPage() {
  const [banners, setBanners] = useState<AdminBannerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AdminBannerItem | null>(null);
  const [backgroundImage, setBackgroundImage] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [sortOrder, setSortOrder] = useState('0');
  const [isActive, setIsActive] = useState(true);
  const [buttons, setButtons] = useState<ButtonDraft[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminBannerItem | null>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const previewUrl = useMemo(() => {
    if (backgroundImage) return URL.createObjectURL(backgroundImage);
    return editing ? getBannerImageUrl(editing.background_image) : null;
  }, [backgroundImage, editing]);

  useEffect(() => {
    return () => {
      if (previewUrl?.startsWith('blob:')) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const load = () => {
    setLoading(true);
    getAdminBanners()
      .then((r) => {
        setBanners(r.banners);
        setError(null);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load banners'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const resetForm = () => {
    setEditing(null);
    setBackgroundImage(null);
    setTitle('');
    setSubtitle('');
    setSortOrder('0');
    setIsActive(true);
    setButtons([]);
    setFormError(null);
  };

  const openCreate = () => {
    resetForm();
    setModalOpen(true);
  };

  const openEdit = (banner: AdminBannerItem) => {
    setEditing(banner);
    setBackgroundImage(null);
    setTitle(banner.title ?? '');
    setSubtitle(banner.subtitle ?? '');
    setSortOrder(String(banner.sort_order ?? 0));
    setIsActive(banner.is_active);
    setButtons(banner.buttons.map((button) => ({ title: button.title, route: button.route })));
    setFormError(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    resetForm();
  };

  const updateButton = (index: number, field: keyof ButtonDraft, value: string) => {
    setButtons((current) => current.map((button, i) => (i === index ? { ...button, [field]: value } : button)));
  };

  const removeButton = (index: number) => {
    setButtons((current) => current.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!editing && !backgroundImage) {
      setFormError('Background image is required');
      return;
    }
    const incompleteButton = buttons.some((button) => {
      const hasTitle = Boolean(button.title.trim());
      const hasRoute = Boolean(button.route.trim());
      return hasTitle !== hasRoute;
    });
    if (incompleteButton) {
      setFormError('Each button needs both a title and a route');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        backgroundImage,
        title: title.trim() || null,
        subtitle: subtitle.trim() || null,
        buttons: cleanButtons(buttons),
        sort_order: Math.max(0, parseInt(sortOrder, 10) || 0),
        is_active: isActive,
      };
      if (editing) await updateBanner(editing.id, payload);
      else if (backgroundImage) await createBanner({ ...payload, backgroundImage });
      closeModal();
      load();
      toast.success(editing ? 'Banner updated' : 'Banner created');
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to save banner');
    } finally {
      setSubmitting(false);
    }
  };

  const closeDeleteModal = () => {
    setDeleteTarget(null);
    setDeleteError(null);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteSubmitting(true);
    setDeleteError(null);
    try {
      await deleteBanner(deleteTarget.id);
      closeDeleteModal();
      load();
      toast.success('Banner deleted');
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete banner');
    } finally {
      setDeleteSubmitting(false);
    }
  };

  if (loading && banners.length === 0) {
    return (
      <div className="flex justify-center py-12">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div>
      <AdminPageHeader title="Banners" description="Create and order homepage hero banners">
        <Button onClick={openCreate}>Add banner</Button>
      </AdminPageHeader>

      {error ? (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <DataTable<AdminBannerItem>
        columns={[
          {
            key: 'background_image',
            header: 'Image',
            render: (banner) => {
              const imageUrl = getBannerImageUrl(banner.background_image);
              return imageUrl ? (
                <img src={imageUrl} alt="" className="h-14 w-28 rounded-md object-cover" />
              ) : (
                <span className="text-muted-foreground">Image</span>
              );
            },
          },
          { key: 'title', header: 'Title', render: (banner) => banner.title || 'Optional' },
          { key: 'sort_order', header: 'Sort' },
          { key: 'is_active', header: 'Active', render: (banner) => (banner.is_active ? 'Yes' : 'No') },
          {
            key: 'buttons',
            header: 'Buttons',
            render: (banner) => banner.buttons.length || 'None',
          },
          {
            key: 'actions',
            header: '',
            className: 'min-w-[10rem]',
            render: (banner) => (
              <div className="flex flex-wrap items-center justify-end gap-3">
                <Button size="sm" variant="outline" type="button" onClick={() => openEdit(banner)}>
                  Edit
                </Button>
                <Button size="sm" variant="destructive" type="button" onClick={() => setDeleteTarget(banner)}>
                  Delete
                </Button>
              </div>
            ),
          },
        ]}
        data={banners}
        keyExtractor={(banner) => banner.id}
        emptyMessage="No banners"
      />

      <Modal open={modalOpen} onClose={closeModal} title={editing ? 'Edit banner' : 'Add banner'} wide>
        <form onSubmit={handleSubmit} className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <div className="space-y-4">
            {formError ? (
              <Alert variant="destructive">
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            ) : null}

            <div>
              <label className="text-sm font-medium">Background image{editing ? '' : ' *'}</label>
              <input
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
                onChange={(e) => setBackgroundImage(e.target.files?.[0] ?? null)}
                className="mt-1 flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                required={!editing}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Sort order</label>
                <input
                  type="number"
                  min="0"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Subtitle</label>
              <textarea
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                className="mt-1 flex min-h-[84px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>

            <label className="flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="h-4 w-4 rounded border-input"
              />
              Active
            </label>

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <label className="text-sm font-medium">Buttons</label>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setButtons((current) => [...current, { title: '', route: '' }])}
                >
                  Add button
                </Button>
              </div>
              {buttons.map((button, index) => (
                <div key={index} className="grid gap-3 rounded-lg border border-border/80 p-3 sm:grid-cols-[1fr_1fr_auto]">
                  <input
                    type="text"
                    value={button.title}
                    onChange={(e) => updateButton(index, 'title', e.target.value)}
                    placeholder="Button title"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                  <input
                    type="text"
                    value={button.route}
                    onChange={(e) => updateButton(index, 'route', e.target.value)}
                    placeholder="/shop"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                  <Button type="button" variant="ghost" size="sm" onClick={() => removeButton(index)}>
                    Remove
                  </Button>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <Button type="submit" isLoading={submitting}>
                {editing ? 'Save' : 'Create'}
              </Button>
              <Button type="button" variant="outline" onClick={closeModal} disabled={submitting}>
                Cancel
              </Button>
            </div>
          </div>

          <aside className="rounded-lg border border-border bg-muted/20 p-3">
            <div className="aspect-[4/3] overflow-hidden rounded-md bg-muted">
              {previewUrl ? (
                <img src={previewUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  Preview
                </div>
              )}
            </div>
          </aside>
        </form>
      </Modal>

      <Modal open={deleteTarget != null} onClose={closeDeleteModal} title="Delete banner">
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Delete this banner? It will be hidden from the homepage and admin lists.
          </p>
          {deleteError ? (
            <Alert variant="destructive">
              <AlertDescription>{deleteError}</AlertDescription>
            </Alert>
          ) : null}
          <div className="flex flex-wrap gap-3">
            <Button type="button" variant="outline" onClick={closeDeleteModal} disabled={deleteSubmitting}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={confirmDelete} isLoading={deleteSubmitting}>
              Delete banner
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
