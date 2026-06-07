export interface CartItem {
  id: number;
  product_id: number;
  product_variation_id?: number | null;
  product_name: string;
  product_slug: string;
  product_type: string;
  quantity: number;
  max_quantity: number;
  unit_price: number;
  line_total: number;
  selections: Record<string, string>;
  selections_summary: Array<{ label: string; value: string }>;
}

export interface Cart {
  id: number;
  items: CartItem[];
  item_count: number;
  subtotal: number;
}
