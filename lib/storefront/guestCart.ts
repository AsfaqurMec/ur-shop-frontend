import type { Cart, CartItem } from '@/types/cart';
import { addToCart } from '@/lib/api/cart';
import { secureLocalStorage } from '@/lib/utils/secureStorage';

const LEGACY_STORAGE_KEY = 'ur_shop_guest_cart_v1';
const SECURE_CART_STORAGE_KEY = '_usc_sec_cart_v2';

export interface GuestCartItemInput {
  productId: number;
  productName: string;
  productSlug: string;
  productType: string;
  productThumbnail?: string | null;
  unitPrice: number;
  quantity?: number;
  maxQuantity?: number;
  variationId?: number;
  selections?: Record<string, string>;
  selectionsSummary?: CartItem['selections_summary'];
}

type StoredGuestItem = CartItem;

function readItems(): StoredGuestItem[] {
  if (typeof window === 'undefined') return [];
  try {
    // 1. Try reading encrypted cart
    const secureItems = secureLocalStorage.getItem<StoredGuestItem[]>(SECURE_CART_STORAGE_KEY);
    if (Array.isArray(secureItems) && secureItems.length > 0) {
      // Purge any old plaintext if it lingered
      localStorage.removeItem(LEGACY_STORAGE_KEY);
      return secureItems.filter((item): item is StoredGuestItem =>
        !!item && typeof item === 'object' && typeof (item as StoredGuestItem).product_id === 'number'
      );
    }

    // 2. Legacy fallback & migration
    const rawLegacy = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (rawLegacy) {
      try {
        const parsed: unknown = JSON.parse(rawLegacy);
        localStorage.removeItem(LEGACY_STORAGE_KEY);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const valid = parsed.filter((item): item is StoredGuestItem =>
            !!item && typeof item === 'object' && typeof (item as StoredGuestItem).product_id === 'number'
          );
          secureLocalStorage.setItem(SECURE_CART_STORAGE_KEY, valid);
          return valid;
        }
      } catch {}
    }
    return [];
  } catch {
    return [];
  }
}

function writeItems(items: StoredGuestItem[]) {
  if (typeof window === 'undefined') return;
  // Always write encrypted and purge any plaintext
  secureLocalStorage.setItem(SECURE_CART_STORAGE_KEY, items);
  localStorage.removeItem(LEGACY_STORAGE_KEY);
}

function emitChange() {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event('cart:changed'));
}

function selectionKey(selections: Record<string, string>) {
  return Object.entries(selections).sort(([a], [b]) => a.localeCompare(b));
}

function asCart(items: StoredGuestItem[]): Cart {
  const normalized = items.map((item) => {
    const maxQty = item.max_quantity != null ? item.max_quantity : 99;
    return {
      ...item,
      quantity: maxQty <= 0 ? 0 : Math.max(1, Math.min(item.quantity, maxQty)),
      max_quantity: maxQty,
      unit_price: Number(item.unit_price) || 0,
    };
  });
  const cartItems = normalized.map((item) => ({
    ...item,
    line_total: Math.round(item.unit_price * item.quantity * 100) / 100,
  }));
  return {
    id: 0,
    items: cartItems,
    item_count: cartItems.reduce((total, item) => total + (item.max_quantity <= 0 ? 0 : item.quantity), 0),
    subtotal: Math.round(cartItems.reduce((total, item) => total + (item.max_quantity <= 0 ? 0 : item.line_total), 0) * 100) / 100,
  };
}

export function getGuestCart(): Cart {
  return asCart(readItems());
}

export function addGuestCartItem(input: GuestCartItemInput): Cart {
  const selections = input.selections ?? {};
  const maxQuantity = input.maxQuantity != null ? Math.max(0, input.maxQuantity) : 99;
  if (maxQuantity < 1) {
    return asCart(readItems());
  }
  const quantity = Math.max(1, Math.min(input.quantity ?? 1, maxQuantity));
  const items = readItems();
  const existing = items.find((item) =>
    item.product_id === input.productId &&
    Number(item.product_variation_id ?? 0) === Number(input.variationId ?? 0) &&
    JSON.stringify(selectionKey(item.selections ?? {})) === JSON.stringify(selectionKey(selections))
  );
  if (existing) {
    existing.max_quantity = maxQuantity;
    existing.quantity = Math.min(maxQuantity, existing.quantity + quantity);
    if (!existing.product_thumbnail && input.productThumbnail) existing.product_thumbnail = input.productThumbnail;
    existing.line_total = Math.round(existing.quantity * existing.unit_price * 100) / 100;
  } else {
    items.push({
      // Negative ids cannot collide with a server cart item and keep the shared Cart UI simple.
      id: -Date.now() - items.length,
      product_id: input.productId,
      product_variation_id: input.variationId ?? null,
      product_name: input.productName,
      product_slug: input.productSlug,
      product_type: input.productType,
      product_thumbnail: input.productThumbnail ?? null,
      quantity,
      max_quantity: maxQuantity,
      unit_price: Math.round((Number(input.unitPrice) || 0) * 100) / 100,
      line_total: Math.round((Number(input.unitPrice) || 0) * quantity * 100) / 100,
      selections,
      selections_summary: input.selectionsSummary ?? Object.entries(selections).map(([label, value]) => ({ label, value })),
    });
  }
  writeItems(items);
  emitChange();
  return asCart(items);
}

export function updateGuestCartItem(itemId: number, quantity: number): Cart {
  const items = readItems();
  const item = items.find((candidate) => candidate.id === itemId);
  if (!item) return asCart(items);
  const maxQty = item.max_quantity != null ? item.max_quantity : 99;
  if (maxQty <= 0) {
    item.quantity = 0;
  } else {
    item.quantity = Math.max(1, Math.min(Math.trunc(quantity), maxQty));
  }
  item.line_total = Math.round(item.quantity * item.unit_price * 100) / 100;
  writeItems(items);
  emitChange();
  return asCart(items);
}

export function syncGuestCartItemStock(productId: number, variationId: number | null | undefined, liveStock: number | null): Cart {
  if (liveStock == null) return asCart(readItems());
  const items = readItems();
  let changed = false;
  for (const item of items) {
    if (
      item.product_id === productId &&
      Number(item.product_variation_id ?? 0) === Number(variationId ?? 0)
    ) {
      if (item.max_quantity !== liveStock) {
        item.max_quantity = liveStock;
        if (liveStock <= 0) item.quantity = 0;
        else if (item.quantity > liveStock) item.quantity = liveStock;
        changed = true;
      }
    }
  }
  if (changed) {
    writeItems(items);
    emitChange();
  }
  return asCart(items);
}

/** Backfills image data for guest carts created before thumbnails were persisted. */
export function setGuestCartItemThumbnail(itemId: number, productThumbnail: string | null | undefined): Cart {
  if (!productThumbnail) return asCart(readItems());
  const items = readItems();
  const item = items.find((candidate) => candidate.id === itemId);
  if (item && !item.product_thumbnail) {
    item.product_thumbnail = productThumbnail;
    writeItems(items);
  }
  return asCart(items);
}

export function removeGuestCartItem(itemId: number): Cart {
  const items = readItems().filter((item) => item.id !== itemId);
  writeItems(items);
  emitChange();
  return asCart(items);
}

export function clearGuestCart(): Cart {
  writeItems([]);
  emitChange();
  return asCart([]);
}

/** Move locally held guest items into the newly authenticated server cart. */
export async function transferGuestCartToAccount(): Promise<Cart> {
  const items = readItems();
  if (!items.length) return asCart([]);
  let latest: Cart | null = null;
  const remaining: StoredGuestItem[] = [];
  for (const item of items) {
    try {
      latest = await addToCart(
        item.product_id,
        item.quantity,
        item.selections,
        item.product_variation_id ?? undefined,
        { skip401Redirect: true }
      );
    } catch {
      remaining.push(item);
    }
  }
  writeItems(remaining);
  emitChange();
  return latest ?? asCart(remaining);
}
