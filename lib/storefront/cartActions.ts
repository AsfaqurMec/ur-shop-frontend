import { addToCart } from '@/lib/api/cart';
import type { Product } from '@/types/product';
import { addGuestCartItem } from './guestCart';

/** Add a configuration-free catalog product for either a signed-in shopper or a guest. */
export async function addSimpleProductToCart(product: Product) {
  try {
    await addToCart(product.id, 1, undefined, undefined, { skip401Redirect: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : '';
    const is401 =
      msg.includes('401') ||
      msg.includes('Unauthorized') ||
      msg.includes('No token') ||
      msg.includes('Invalid or expired token') ||
      msg.includes('sign in');

    if (is401) {
      addGuestCartItem({
        productId: product.id,
        productName: product.name,
        productSlug: product.slug,
        productType: product.product_type,
        productThumbnail: product.thumbnail,
        unitPrice: product.price,
        maxQuantity: product.quantity ?? product.license_available_count ?? 99,
      });
    } else {
      throw err;
    }
  }
  if (typeof window !== 'undefined') window.dispatchEvent(new Event('cart:changed'));
}
