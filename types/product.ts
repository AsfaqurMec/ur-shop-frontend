export const PRODUCT_TYPES = ['downloadable', 'license_key', 'subscription_manual', 'digital_service'] as const;
export type ProductType = (typeof PRODUCT_TYPES)[number];

export interface ProductImage {
  id: number;
  path: string;
  alt_text: string | null;
  sort_order: number;
}

export interface ProductFile {
  id: number;
  file_name: string;
  file_size: number | null;
  download_limit: number | null;
  sort_order: number;
}

export interface ProductPurchaseVariable {
  var_key: string;
  label: string;
  kind: 'select' | 'email';
  required: boolean;
  sort_order: number;
  /** Present on admin API; omitted or true for enabled storefront variables. */
  enabled?: boolean;
  options?: Array<{
    option_key: string;
    label: string;
    price_adjustment: number;
    sort_order: number;
  }>;
}

export type ProductCatalogAttributeKind = 'select' | 'text' | 'email';

export interface ProductCatalogAttribute {
  attr_key: string;
  name: string;
  kind: ProductCatalogAttributeKind;
  visible_on_page: boolean;
  used_for_variations: boolean;
  sort_order: number;
  values: Array<{ value_key: string; label: string; sort_order: number }>;
}

export interface ProductCatalogVariation {
  id: number;
  sku: string | null;
  quantity: number | null;
  price: number;
  compare_at_price: number | null;
  enabled: boolean;
  sort_order: number;
  combination: Record<string, string>;
}

export interface Product {
  id: number;
  category_id: number | null;
  name: string;
  slug: string;
  description: string | null;
  full_description?: string | null;
  fullDescription?: string | null;
  features?: string[] | null;
  product_type: ProductType;
  manual_fulfillment_required?: boolean;
  price: number;
  compare_at_price: number | null;
  is_active: boolean;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
  thumbnail?: string | null;
  images?: ProductImage[];
  files?: ProductFile[];
  license_available_count?: number;
  /** Base product SKU (inventory). Variation SKUs override per option set. */
  sku?: string | null;
  /** Base product quantity (inventory). Variation quantity overrides per option set. */
  quantity?: number | null;
  default_variation_id?: number | null;
  /** When true, grid "Add to cart" should send shoppers to the product page. */
  needs_pdp_config?: boolean;
  catalog_attributes?: ProductCatalogAttribute[];
  catalog_variations?: ProductCatalogVariation[];
  purchase_variables?: ProductPurchaseVariable[];
}

export interface ProductListResult {
  products: Product[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ProductListParams {
  page?: number;
  limit?: number;
  category_id?: number;
  product_type?: ProductType;
  min_price?: number;
  max_price?: number;
  search?: string;
  featured?: boolean;
  is_active?: boolean;
}
