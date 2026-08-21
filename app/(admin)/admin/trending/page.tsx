'use client';

import { useEffect, useState, useMemo } from 'react';
import Image from 'next/image';
import { getProducts, putTrendingProducts } from '@/lib/api/admin';
import { AdminPageHeader } from '@/components/admin/PageHeader';
import { Button } from '@/components/ui';
import { formatCurrency } from '@/lib/utils/format';
import { toast } from 'sonner';
import type { Product } from '@/types/product';

export default function AdminTrendingPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [orderedIds, setOrderedIds] = useState<number[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getProducts({ limit: 100 })
      .then((res) => {
        if (cancelled) return;
        const list = res.products ?? [];
        setProducts(list);
        // Sort existing trending products by trending_order if present
        const initialTrending = list
          .filter((p) => p.is_trending)
          .sort((a, b) => (a.trending_order ?? 999) - (b.trending_order ?? 999))
          .map((p) => p.id);
        setOrderedIds(initialTrending);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load products');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedSet = useMemo(() => new Set(orderedIds), [orderedIds]);

  const toggleProduct = (id: number) => {
    setOrderedIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      }
      return [...prev, id];
    });
  };

  const moveItem = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= orderedIds.length) return;
    setOrderedIds((prev) => {
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (targetIndex: number) => {
    if (draggedIndex === null || draggedIndex === targetIndex) return;
    moveItem(draggedIndex, targetIndex);
    setDraggedIndex(null);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await putTrendingProducts(orderedIds);
      toast.success('Trending products and sequence updated successfully');
      setProducts((prev) =>
        prev.map((p) => ({
          ...p,
          is_trending: selectedSet.has(p.id),
          trending_order: selectedSet.has(p.id) ? orderedIds.indexOf(p.id) + 1 : undefined,
        }))
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update trending products');
    } finally {
      setSaving(false);
    }
  };

  const filteredProducts = useMemo(() => {
    if (!search.trim()) return products;
    const q = search.toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q) ||
        (p.sku && p.sku.toLowerCase().includes(q)) ||
        (p.category_name && p.category_name.toLowerCase().includes(q))
    );
  }, [products, search]);

  const productMap = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);

  const orderedTrendingProducts = useMemo(() => {
    return orderedIds.map((id) => productMap.get(id)).filter((p): p is Product => p != null);
  }, [orderedIds, productMap]);

  return (
    <div className="space-y-6 pb-12">
      <AdminPageHeader
        title="Trending Products"
        description="Select and drag products to define the serial order shown in the Homepage Trending section."
      >
        <Button onClick={handleSave} isLoading={saving} className="gap-2 shadow-sm">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          Save Sequence ({orderedIds.length} items)
        </Button>
      </AdminPageHeader>

      {/* Overview Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border border-border/60 bg-card p-4 shadow-sm">
          <div className="text-xs font-medium text-muted-foreground">Total Catalog Products</div>
          <div className="mt-1 text-2xl font-bold text-foreground">{products.length}</div>
        </div>
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 shadow-sm">
          <div className="text-xs font-medium text-primary">Selected for Homepage Trending</div>
          <div className="mt-1 text-2xl font-bold text-primary">{orderedIds.length}</div>
        </div>
      </div>

      {/* Draggable Serial Reordering Section */}
      {orderedTrendingProducts.length > 0 && (
        <div className="rounded-xl border border-primary/30 bg-card p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                Homepage Trending Display Sequence ({orderedTrendingProducts.length})
              </h3>
              <p className="text-xs text-muted-foreground">
                Drag and drop or use arrow buttons to reorder the exact serial numbers displayed on the storefront.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOrderedIds([])}
              className="text-xs font-medium text-destructive hover:underline"
            >
              Clear all
            </button>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {orderedTrendingProducts.map((p, index) => (
              <div
                key={p.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(index)}
                className={`group flex items-center justify-between gap-3 rounded-lg border p-2.5 transition-all cursor-grab active:cursor-grabbing ${
                  draggedIndex === index
                    ? 'border-primary bg-primary/10 opacity-60 scale-[0.98]'
                    : 'border-border/80 bg-background hover:border-primary/50 hover:shadow-sm'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary text-[11px] font-bold text-primary-foreground">
                    #{index + 1}
                  </span>
                  <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md border border-border/60 bg-muted/20">
                    {p.thumbnail ? (
                      <Image src={p.thumbnail} alt={p.name} fill className="object-cover" unoptimized />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[9px] text-muted-foreground">
                        No img
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-foreground">{p.name}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {p.category_name || 'No category'} · {formatCurrency(p.price)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <div className="flex flex-col">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={(e) => {
                        e.stopPropagation();
                        moveItem(index, index - 1);
                      }}
                      className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30"
                      title="Move up"
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      disabled={index === orderedTrendingProducts.length - 1}
                      onClick={(e) => {
                        e.stopPropagation();
                        moveItem(index, index + 1);
                      }}
                      className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30"
                      title="Move down"
                    >
                      ▼
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleProduct(p.id);
                    }}
                    className="ml-1 flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    title="Remove from trending"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Products Table & Search */}
      <div className="space-y-4 rounded-xl border border-border/60 bg-card p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full max-w-sm">
            <input
              type="text"
              placeholder="Search products by name, SKU, or category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <svg
              className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <div className="text-xs text-muted-foreground">
            Showing {filteredProducts.length} of {products.length} products
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-sm text-muted-foreground">Loading products...</div>
        ) : error ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">No products match your search.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border/60 bg-muted/40 text-muted-foreground">
                <tr>
                  <th className="py-3 px-4 font-medium">Serial / Status</th>
                  <th className="py-3 px-4 font-medium">Product</th>
                  <th className="py-3 px-4 font-medium">Category</th>
                  <th className="py-3 px-4 font-medium">Price</th>
                  <th className="py-3 px-4 font-medium">Stock</th>
                  <th className="py-3 px-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filteredProducts.map((p) => {
                  const isSelected = selectedSet.has(p.id);
                  const serialNumber = isSelected ? orderedIds.indexOf(p.id) + 1 : null;
                  return (
                    <tr
                      key={p.id}
                      onClick={() => toggleProduct(p.id)}
                      className={`cursor-pointer transition-colors hover:bg-muted/30 ${
                        isSelected ? 'bg-primary/[0.03]' : ''
                      }`}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="h-4 w-4 rounded border-input text-primary focus:ring-primary"
                          />
                          {serialNumber && (
                            <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary">
                              #{serialNumber}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-border/60 bg-muted/20">
                            {p.thumbnail ? (
                              <Image src={p.thumbnail} alt={p.name} fill className="object-cover" unoptimized />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-[10px] text-muted-foreground">
                                No img
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="font-medium text-foreground">{p.name}</div>
                            <div className="text-[11px] text-muted-foreground">
                              {p.sku ? `SKU: ${p.sku}` : `/${p.slug}`}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {p.category_name || 'Uncategorized'}
                      </td>
                      <td className="py-3 px-4 font-medium text-foreground">
                        {formatCurrency(p.price)}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {p.quantity == null ? (
                          'Unlimited'
                        ) : p.quantity === 0 ? (
                          <span className="text-destructive font-medium">Out of stock</span>
                        ) : (
                          p.quantity
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${
                            p.is_active
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {p.is_active ? 'Active' : 'Draft'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
