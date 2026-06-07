export type OrderStatus =
  | 'pending'
  | 'paid'
  | 'unpaid'
  | 'processing'
  | 'completed'
  | 'refunded'
  | 'cancelled';

export type OrderItemProductType =
  | 'downloadable'
  | 'license_key'
  | 'subscription_manual'
  | 'digital_service';

export interface OrderItem {
  id: number;
  product_id: number;
  product_name: string;
  product_type: OrderItemProductType;
  quantity: number;
  unit_price: number;
  total_price: number;
  purchase_selections?: Record<string, string> | null;
  purchase_selections_summary?: Array<{ label: string; value: string }> | null;
}

export interface Order {
  id: number;
  order_number: string;
  status: OrderStatus;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  currency: string;
  items: OrderItem[];
  payment?: { id: number; gateway: string; status: string; amount: number };
  created_at: string;
  /** Set when checkout starts bKash redirect flow. */
  bkash_checkout_url?: string | null;
}
