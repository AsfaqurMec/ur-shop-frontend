import { apiGet, apiPost, apiPut, apiDelete } from './client';
import type { Cart } from '@/types/cart';

function unwrap<T>(res: { success: boolean; data?: T; error?: string }): T {
  if (!res.success || res.data === undefined) throw new Error(res.error ?? 'Request failed');
  return res.data as T;
}

export type GetCartOptions = {
  /** When true, a 401 does not hard-redirect to login (e.g. cart page shows a sign-in prompt). */
  skip401Redirect?: boolean;
};

export type AddToCartOptions = {
  /** When true, a 401 response does not auto-redirect to login. */
  skip401Redirect?: boolean;
};

/** Get current user cart (requires auth). */
export async function getCart(options?: GetCartOptions): Promise<Cart> {
  const res = await apiGet<{ cart: Cart }>('cart', {
    skip401Redirect: Boolean(options?.skip401Redirect),
  });
  const data = unwrap(res);
  return data.cart;
}

/** Add item to cart (requires auth). Returns updated cart. */
export async function addToCart(
  productId: number,
  quantity: number,
  selections?: Record<string, string>,
  variationId?: number,
  options?: AddToCartOptions
): Promise<Cart> {
  const body: Record<string, unknown> = {
    product_id: productId,
    quantity,
  };
  if (selections && Object.keys(selections).length > 0) {
    body.selections = selections;
  }
  if (variationId != null) {
    const n = Number(variationId);
    if (Number.isFinite(n) && n >= 1) {
      body.variation_id = Math.trunc(n);
    }
  }
  const res = await apiPost<{ cart: Cart }>('cart/items', body, {
    skip401Redirect: Boolean(options?.skip401Redirect),
  });
  const data = unwrap(res);
  return data.cart;
}

/** Update cart item quantity (requires auth). */
export async function updateCartItem(itemId: number, quantity: number): Promise<Cart> {
  const res = await apiPut<{ cart: Cart }>(`cart/items/${itemId}`, { quantity });
  const data = unwrap(res);
  return data.cart;
}

/** Remove item from cart (requires auth). */
export async function removeCartItem(itemId: number): Promise<Cart> {
  const res = await apiDelete<{ cart: Cart }>(`cart/items/${itemId}`);
  const data = unwrap(res);
  return data.cart;
}

/** Clear cart (requires auth). */
export async function clearCart(): Promise<Cart> {
  const res = await apiDelete<{ cart: Cart }>('cart');
  const data = unwrap(res);
  return data.cart;
}
