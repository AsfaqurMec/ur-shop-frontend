import { apiPost } from './client';
import type { Order } from '@/types/order';

function unwrap<T>(res: { success: boolean; data?: T; error?: string }): T {
  if (!res.success || res.data === undefined) throw new Error(res.error ?? 'Request failed');
  return res.data as T;
}

/** Selected `payment_options.gateway_key` from GET /payments/methods */
export type CheckoutPaymentMethod = string;

export interface CreateOrderBody {
  coupon_code?: string | null;
  payment_method?: CheckoutPaymentMethod;
  /** `merchant` (bKash redirect) or `manual` (wallet + TrxID). */
  payment_type?: string | null;
  sender_number?: string | null;
  transaction_id?: string | null;
  /** @deprecated use transaction_id */
  bkash_transaction_id?: string | null;
}

/** Create order from cart (requires auth). Cart is cleared on success. */
export async function createOrder(body?: CreateOrderBody): Promise<Order> {
  const res = await apiPost<{ order: Order }>('checkout/orders', body ?? {});
  const data = unwrap(res);
  return data.order;
}
