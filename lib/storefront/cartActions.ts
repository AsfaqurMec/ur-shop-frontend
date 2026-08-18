import { getAuthToken } from '@/lib/api/client';
import { addToCart } from '@/lib/api/cart';
import type { Product } from '@/types/product';
import { addGuestCartItem } from './guestCart';

/** Add a configuration-free catalog product for either a signed-in shopper or a guest. */
export async function addSimpleProductToCart(product: Product) {
  if (getAuthToken()) {
    await addToCart(product.id, 1);
  } else {
    addGuestCartItem({
      productId: product.id,
      productName: product.name,
      productSlug: product.slug,
      productType: product.product_type,
      productThumbnail: product.thumbnail,
      unitPrice: product.price,
      maxQuantity: product.quantity ?? product.license_available_count ?? 99,
    });
  }
  if (typeof window !== 'undefined') window.dispatchEvent(new Event('cart:changed'));
}
