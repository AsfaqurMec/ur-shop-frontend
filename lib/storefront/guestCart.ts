import type { Cart, CartItem } from '@/types/cart';
import { addToCart } from '@/lib/api/cart';

const GUEST_CART_STORAGE_KEY = 'ur_shop_guest_cart_v1';

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
    const raw = localStorage.getItem(GUEST_CART_STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((item): item is StoredGuestItem =>
      !!item && typeof item === 'object' && typeof (item as StoredGuestItem).product_id === 'number'
    ) : [];
  } catch {
    return [];
  }
}

function writeItems(items: StoredGuestItem[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(GUEST_CART_STORAGE_KEY, JSON.stringify(items));
}

function emitChange() {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event('cart:changed'));
}

function selectionKey(selections: Record<string, string>) {
  return Object.entries(selections).sort(([a], [b]) => a.localeCompare(b));
}

function asCart(items: StoredGuestItem[]): Cart {
  const normalized = items.map((item) => ({
    ...item,
    quantity: Math.max(1, Math.min(item.quantity, Math.max(1, item.max_quantity || 99))),
    unit_price: Number(item.unit_price) || 0,
  }));
  const cartItems = normalized.map((item) => ({ ...item, line_total: Math.round(item.unit_price * item.quantity * 100) / 100 }));
  return {
    id: 0,
    items: cartItems,
    item_count: cartItems.reduce((total, item) => total + item.quantity, 0),
    subtotal: Math.round(cartItems.reduce((total, item) => total + item.line_total, 0) * 100) / 100,
  };
}

export function getGuestCart(): Cart {
  return asCart(readItems());
}

export function addGuestCartItem(input: GuestCartItemInput): Cart {
  const selections = input.selections ?? {};
  const maxQuantity = Math.max(1, input.maxQuantity ?? 99);
  const quantity = Math.max(1, Math.min(input.quantity ?? 1, maxQuantity));
  const items = readItems();
  const existing = items.find((item) =>
    item.product_id === input.productId &&
    Number(item.product_variation_id ?? 0) === Number(input.variationId ?? 0) &&
    JSON.stringify(selectionKey(item.selections ?? {})) === JSON.stringify(selectionKey(selections))
  );
  if (existing) {
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
  item.quantity = Math.max(1, Math.min(Math.trunc(quantity), Math.max(1, item.max_quantity || 99)));
  item.line_total = Math.round(item.quantity * item.unit_price * 100) / 100;
  writeItems(items);
  emitChange();
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
  let latest: Cart | null = null;
  for (const item of items) {
    latest = await addToCart(
      item.product_id,
      item.quantity,
      item.selections,
      item.product_variation_id ?? undefined,
      { skip401Redirect: true }
    );
  }
  writeItems([]);
  emitChange();
  return latest ?? { id: 0, items: [], item_count: 0, subtotal: 0 };
}
