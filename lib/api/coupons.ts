import { apiPost } from './client';
import type { CouponValidationResult, CouponPublic } from '@/types/coupon';
import type { CartItem } from '@/types/cart';

function unwrap<T>(res: { success: boolean; data?: T; error?: string }): T {
  if (!res.success || res.data === undefined) throw new Error(res.error ?? 'Request failed');
  return res.data as T;
}

export interface ValidateCouponBody {
  code: string;
  subtotal: number;
  items?: Array<{
    product_id: number;
    category_id: number | null;
    quantity: number;
    unit_price: number;
  }>;
}

/** Validate coupon for current cart/checkout (requires auth). */
export async function validateCoupon(
  code: string,
  subtotal: number,
  items?: CartItem[]
): Promise<CouponValidationResult> {
  const body: ValidateCouponBody = {
    code: code.trim(),
    subtotal,
    items: items?.map((i) => ({
      product_id: i.product_id,
      category_id: null,
      quantity: i.quantity,
      unit_price: i.unit_price,
    })),
  };
  const res = await apiPost<CouponValidationResult>('coupons/validate', body);
  return unwrap(res);
}
