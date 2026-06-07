/**
 * Admin API client. All routes require auth + admin role.
 * Base path: admin/dashboard for dashboard, products, categories, delivery, payments, tickets, coupons, reviews as per backend routes.
 */

import { apiGet, apiPost, apiPut, apiPatch, apiDelete, apiPostFormData } from './client';
import type { SocialLink } from './storeSettings';
import type { ProductReviewAdminTableRow } from '@/types/review';
import type { Product, ProductCatalogAttribute, ProductPurchaseVariable } from '@/types/product';
import type { PaymentMethod } from '@/types/payment';

function unwrap<T>(res: {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  errors?: Array<{ message?: string }>;
}): T {
  if (!res.success || res.data === undefined) {
    if (Array.isArray(res.errors) && res.errors.length > 0) {
      const msg = res.errors.map((e) => e.message).filter(Boolean).join(' ');
      if (msg) throw new Error(msg);
    }
    throw new Error(res.message || res.error || 'Request failed');
  }
  return res.data;
}

// ---- Dashboard ----
export interface AdminSummary {
  orders_total: number;
  orders_paid: number;
  revenue_total: number;
  customers_count: number;
  pending_fulfillment_count: number;
  pending_tickets_count: number;
}

export interface AdminStoreSettings {
  siteTitle: string;
  siteLogo: string;
  emailHeaderLogo: string;
  emailHeaderSlogan: string;
  emailHeaderSubtitle: string;
  emailFooterSupportEmail: string;
  emailFooterSupportNumber: string;
  storeName: string;
  contactEmail: string;
  address: string;
  currency: string;
  timezone: string;
  socialLinks: SocialLink[];
}

export async function getAdminStoreSettings(): Promise<AdminStoreSettings> {
  const res = await apiGet<{ settings: AdminStoreSettings }>('admin/store-settings');
  return unwrap(res).settings;
}

export async function updateAdminStoreSettings(
  body: Partial<AdminStoreSettings>
): Promise<AdminStoreSettings> {
  const res = await apiPut<{ settings: AdminStoreSettings }>('admin/store-settings', body);
  return unwrap(res).settings;
}

export async function uploadAdminStoreLogo(file: File): Promise<{ logo_url: string; logo_path: string }> {
  const formData = new FormData();
  formData.append('logo', file);
  const res = await apiPostFormData<{ logo_url: string; logo_path: string }>(
    'admin/store-settings/upload-logo',
    formData
  );
  return unwrap(res);
}

export interface AdminSalesSummary {
  total_revenue: number;
  total_orders_paid: number;
  currency: string;
}

export interface AdminOrdersByStatus {
  status: string;
  count: number;
}

export interface AdminRecentOrder {
  id: number;
  order_number: string;
  status: string;
  total: number;
  currency: string;
  user_id: number;
  created_at: string;
}

export interface AdminRecentPayment {
  id: number;
  order_id: number;
  order_number: string;
  amount: number;
  currency: string;
  gateway: string;
  status: string;
  created_at: string;
}

export interface AdminTopProduct {
  product_id: number;
  product_name: string;
  quantity_sold: number;
  revenue: number;
  currency: string;
}

export interface AdminLowStockLicense {
  product_id: number;
  product_name: string;
  available_keys: number;
}

export interface AdminCustomerListItem {
  user_id: number;
  email: string;
  name: string;
  order_count: number;
  last_order_at: string;
}

export async function getAdminSummary(): Promise<AdminSummary> {
  const res = await apiGet<{ summary: AdminSummary }>('admin/dashboard/summary');
  const d = unwrap(res);
  return d.summary;
}

export async function getAdminSalesSummary(): Promise<AdminSalesSummary> {
  const res = await apiGet<{ summary: AdminSalesSummary }>('admin/dashboard/sales');
  const d = unwrap(res);
  return d.summary;
}

export async function getAdminOrdersByStatus(): Promise<AdminOrdersByStatus[]> {
  const res = await apiGet<{ by_status: AdminOrdersByStatus[] }>('admin/dashboard/orders-by-status');
  const d = unwrap(res);
  return d.by_status;
}

export async function getAdminRecentOrders(params?: {
  limit?: number;
  offset?: number;
  status?: string;
}): Promise<{ orders: AdminRecentOrder[]; total: number }> {
  const res = await apiGet<{ orders: AdminRecentOrder[]; total: number }>('admin/dashboard/recent-orders', {
    params: {
      ...(params?.limit != null ? { limit: params.limit } : {}),
      ...(params?.offset != null && params.offset > 0 ? { offset: params.offset } : {}),
      ...(params?.status ? { status: params.status } : {}),
    },
  });
  return unwrap(res);
}

export interface AdminEmailLog {
  id: number;
  to_email: string;
  subject: string | null;
  template: string | null;
  status: 'sent' | 'failed';
  error_message: string | null;
  sent_at: string;
}

export async function getAdminEmailLogs(params?: {
  limit?: number;
  offset?: number;
  template?: string;
}): Promise<{ logs: AdminEmailLog[]; total: number; templates: string[] }> {
  const res = await apiGet<{
    logs: AdminEmailLog[];
    total: number;
    templates: string[];
  }>('admin/dashboard/email-logs', {
    params: {
      ...(params?.limit != null ? { limit: params.limit } : {}),
      ...(params?.offset != null && params.offset > 0 ? { offset: params.offset } : {}),
      ...(params?.template ? { template: params.template } : {}),
    },
  });
  return unwrap(res);
}

export async function getAdminRecentPayments(limit?: number): Promise<{ payments: AdminRecentPayment[] }> {
  const res = await apiGet<{ payments: AdminRecentPayment[] }>('admin/dashboard/recent-payments', {
    params: limit != null ? { limit } : undefined,
  });
  return unwrap(res);
}

export async function getAdminOrderDetails(orderId: number) {
  const res = await apiGet<import('./dashboard').DashboardOrderDetail>(`admin/dashboard/orders/${orderId}`);
  return unwrap(res);
}

export async function updateAdminOrderStatus(
  orderId: number,
  status: 'pending' | 'paid' | 'unpaid'
): Promise<AdminRecentOrder> {
  const res = await apiPatch<{ order: AdminRecentOrder }>(`admin/dashboard/orders/${orderId}/status`, { status });
  return unwrap(res).order;
}

export async function getAdminCustomers(params?: {
  limit?: number;
  offset?: number;
}): Promise<{ customers: AdminCustomerListItem[]; total: number }> {
  const res = await apiGet<{ customers: AdminCustomerListItem[]; total: number }>('admin/dashboard/customers', {
    params: {
      ...(params?.limit != null ? { limit: params.limit } : {}),
      ...(params?.offset != null && params.offset > 0 ? { offset: params.offset } : {}),
    },
  });
  return unwrap(res);
}

export async function updateAdminCustomer(
  userId: number,
  body: { email: string; name: string }
): Promise<{ customer: AdminCustomerListItem }> {
  const res = await apiPatch<{ customer: AdminCustomerListItem }>(`admin/dashboard/customers/${userId}`, body);
  return unwrap(res);
}

export async function deleteAdminCustomer(userId: number): Promise<void> {
  const res = await apiDelete<Record<string, never>>(`admin/dashboard/customers/${userId}`);
  unwrap(res);
}

// ---- Products (admin uses same products API with auth) ----
export interface ProductListResult {
  products: Array<{
    id: number;
    name: string;
    slug: string;
    description: string | null;
    full_description?: string | null;
    fullDescription?: string | null;
    features?: string[] | null;
    product_type: string;
    price: number;
    compare_at_price: number | null;
    is_active: boolean;
    is_featured: boolean;
    category_id: number | null;
    created_at: string;
    updated_at: string;
    thumbnail?: string | null;
    images?: Array<{ id: number; path: string; alt_text: string | null; sort_order: number }>;
    files?: Array<{ id: number; file_name: string; file_size: number | null; download_limit: number | null; sort_order: number }>;
    license_available_count?: number;
    purchase_variables?: ProductPurchaseVariable[];
  }>;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export async function getProducts(params?: {
  page?: number;
  limit?: number;
  category_id?: number;
  product_type?: string;
  search?: string;
  is_active?: boolean;
}): Promise<ProductListResult> {
  const res = await apiGet<ProductListResult>('products', {
    params: params as Record<string, string | number | boolean | undefined>,
  });
  return unwrap(res);
}

export async function getProductById(id: number): Promise<Product> {
  const res = await apiGet<{ product: Product }>(`products/${id}`);
  const d = unwrap(res);
  return d.product;
}

export async function createProduct(body: {
  name: string;
  slug?: string;
  description?: string | null;
  full_description?: string | null;
  fullDescription?: string | null;
  features?: string[] | null;
  category_id?: number | null;
  product_type: string;
  manual_fulfillment_required?: boolean;
  price: number;
  compare_at_price?: number | null;
  is_active?: boolean;
  is_featured?: boolean;
}) {
  const res = await apiPost<{ product: ProductListResult['products'][0] }>('products', body);
  const d = unwrap(res);
  return d.product;
}

export async function updateProduct(
  id: number,
  body: Partial<{
    name: string;
    slug: string;
    description: string | null;
    full_description: string | null;
    fullDescription: string | null;
    features: string[] | null;
    category_id: number | null;
    product_type: string;
    manual_fulfillment_required: boolean;
    price: number;
    compare_at_price: number | null;
    sku: string | null;
    quantity: number | null;
    default_variation_id: number | null;
    is_active: boolean;
    is_featured: boolean;
  }>
) {
  const res = await apiPut<{ product: Product }>(`products/${id}`, body);
  const d = unwrap(res);
  return d.product;
}

export async function deleteProduct(id: number) {
  const res = await apiDelete<{ message: string }>(`products/${id}`);
  return unwrap(res);
}

export interface AdminPurchaseVariableInput {
  var_key: string;
  label: string;
  kind: 'select' | 'email';
  enabled: boolean;
  required: boolean;
  sort_order: number;
  options: Array<{ option_key: string; label: string; price_adjustment: number; sort_order: number }>;
}

/** Replace all purchase variables for a product (admin). */
export async function putProductPurchaseVariables(
  productId: number,
  variables: AdminPurchaseVariableInput[]
): Promise<Product> {
  const res = await apiPut<{ product: Product }>(
    `products/${productId}/purchase-variables`,
    { variables }
  );
  return unwrap(res).product;
}

export type AdminCatalogAttributeInput = {
  attr_key: string;
  name: string;
  kind: ProductCatalogAttribute['kind'];
  visible_on_page: boolean;
  used_for_variations: boolean;
  sort_order: number;
  values: Array<{ value_key: string; label: string; sort_order: number }>;
};

export async function putProductCatalogAttributes(
  productId: number,
  attributes: AdminCatalogAttributeInput[]
): Promise<Product> {
  const res = await apiPut<{ product: Product }>(`products/${productId}/catalog-attributes`, {
    attributes,
  });
  return unwrap(res).product;
}

export async function putProductCatalogVariations(
  productId: number,
  variations: Array<{
    combination: Record<string, string>;
    sku: string | null;
    quantity: number | null;
    price: number;
    compare_at_price: number | null;
    enabled: boolean;
    sort_order: number;
  }>
): Promise<Product> {
  const res = await apiPut<{ product: Product }>(`products/${productId}/catalog-variations`, {
    variations,
  });
  return unwrap(res).product;
}

export async function postGenerateProductVariations(productId: number): Promise<Product & { added: number }> {
  const res = await apiPost<{ product: Product; added: number }>(
    `products/${productId}/catalog-variations/generate`,
    {}
  );
  const d = unwrap(res);
  return { ...d.product, added: d.added };
}

export type AdminProductImage = NonNullable<ProductListResult['products'][0]['images']>[number];
export type AdminProductFile = NonNullable<ProductListResult['products'][0]['files']>[number];

export async function uploadProductFile(
  productId: number,
  file: File,
  fields?: { file_name?: string; download_limit?: number | null; sort_order?: number }
): Promise<AdminProductFile> {
  const formData = new FormData();
  formData.append('file', file);
  if (fields?.file_name != null && fields.file_name.trim() !== '') {
    formData.append('file_name', fields.file_name.trim());
  }
  if (fields?.download_limit != null && fields.download_limit >= 0) {
    formData.append('download_limit', String(fields.download_limit));
  }
  if (fields?.sort_order != null && fields.sort_order >= 0) {
    formData.append('sort_order', String(fields.sort_order));
  }
  const res = await apiPostFormData<{ file: AdminProductFile }>(`products/${productId}/files`, formData);
  return unwrap(res).file;
}

export async function deleteProductFile(productId: number, fileId: number): Promise<void> {
  const res = await apiDelete<{ message: string }>(`products/${productId}/files/${fileId}`);
  unwrap(res);
}

export async function uploadProductImage(
  productId: number,
  file: File,
  fields?: { alt_text?: string; sort_order?: number }
): Promise<AdminProductImage> {
  const formData = new FormData();
  formData.append('image', file);
  if (fields?.alt_text != null && fields.alt_text !== '') formData.append('alt_text', fields.alt_text);
  if (fields?.sort_order != null) formData.append('sort_order', String(fields.sort_order));
  const res = await apiPostFormData<{ image: AdminProductImage }>(`products/${productId}/images`, formData);
  return unwrap(res).image;
}

export async function uploadProductImages(
  productId: number,
  files: File[]
): Promise<AdminProductImage[]> {
  const formData = new FormData();
  files.forEach((file) => formData.append('images', file));
  const res = await apiPostFormData<{ images: AdminProductImage[] }>(`products/${productId}/images/bulk`, formData);
  return unwrap(res).images;
}

export async function deleteProductImage(productId: number, imageId: number): Promise<void> {
  const res = await apiDelete<{ message: string }>(`products/${productId}/images/${imageId}`);
  unwrap(res);
}

export async function getProductLicenseInventory(
  productId: number
): Promise<{ total: number; available: number }> {
  const res = await apiGet<{ total: number; available: number }>(`products/${productId}/licenses`);
  return unwrap(res);
}

export async function addProductLicenseKeys(
  productId: number,
  keys: string[],
  productVariationId?: number
): Promise<{ added: number }> {
  const res = await apiPost<{ added: number }>(`products/${productId}/licenses`, {
    keys,
    ...(productVariationId != null && productVariationId >= 1 ? { product_variation_id: productVariationId } : {}),
  });
  return unwrap(res);
}

export interface AdminProductLicenseKey {
  id: number;
  /** Present when this product uses catalog variations; keys are sold only for that option. */
  product_variation_id: number | null;
  license_key: string;
  used_at: string | null;
  order_item_id: number | null;
  created_at: string;
  is_available: boolean;
}

export async function getProductLicenseKeys(
  productId: number,
  params?: {
    limit?: number;
    offset?: number;
    status?: 'all' | 'available' | 'used';
    product_variation_id?: number;
  }
): Promise<{ keys: AdminProductLicenseKey[]; total: number }> {
  const res = await apiGet<{ keys: AdminProductLicenseKey[]; total: number }>(
    `products/${productId}/licenses/keys`,
    {
      params: {
        ...(params?.limit != null ? { limit: params.limit } : {}),
        ...(params?.offset != null && params.offset >= 0 ? { offset: params.offset } : {}),
        ...(params?.status ? { status: params.status } : {}),
        ...(params?.product_variation_id != null && params.product_variation_id >= 1
          ? { product_variation_id: params.product_variation_id }
          : {}),
      },
    }
  );
  return unwrap(res);
}

export async function updateProductLicenseKey(
  productId: number,
  licenseId: number,
  body: { license_key: string; product_variation_id?: number | null }
): Promise<AdminProductLicenseKey> {
  const res = await apiPatch<{ key: AdminProductLicenseKey }>(
    `products/${productId}/licenses/${licenseId}`,
    body
  );
  return unwrap(res).key;
}

export async function deleteProductLicenseKey(productId: number, licenseId: number): Promise<void> {
  const res = await apiDelete<Record<string, never>>(`products/${productId}/licenses/${licenseId}`);
  unwrap(res);
}

// ---- Categories ----
export interface CategoryItem {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  parent_id: number | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

/** Full list when called with no args (dropdowns, storefront). Paginated when `page` or `limit` is set. */
export type CategoriesListResponse =
  | { categories: CategoryItem[] }
  | {
      categories: CategoryItem[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };

export async function getCategories(params?: { page?: number; limit?: number }): Promise<CategoriesListResponse> {
  const queryParams: Record<string, number> = {};
  if (params?.page != null) queryParams.page = params.page;
  if (params?.limit != null) queryParams.limit = params.limit;
  const res = await apiGet<CategoriesListResponse>('categories', {
    params: Object.keys(queryParams).length ? queryParams : undefined,
  });
  return unwrap(res);
}

export async function createCategory(body: {
  name: string;
  slug?: string;
  description?: string | null;
  parent_id?: number | null;
  sort_order?: number;
}) {
  const res = await apiPost<{ category: CategoryItem }>('categories', body);
  const d = unwrap(res);
  return d.category;
}

export async function updateCategory(
  id: number,
  body: Partial<{ name: string; slug: string; description: string | null; parent_id: number | null; sort_order: number }>
) {
  const res = await apiPut<{ category: CategoryItem }>(`categories/${id}`, body);
  const d = unwrap(res);
  return d.category;
}

export async function deleteCategory(id: number) {
  const res = await apiDelete<{ message: string }>(`categories/${id}`);
  return unwrap(res);
}

// ---- Delivery / Fulfillment ----
export interface FulfillmentItem {
  id: number;
  order_id: number;
  order_item_id: number;
  product_id: number;
  product_type: string;
  user_id: number;
  status: string;
  notes: string | null;
  due_at: string | null;
  fulfilled_at: string | null;
  fulfilled_by_admin_id: number | null;
  is_sla_breached: boolean;
  created_at: string;
}

export async function getFulfillmentQueue(): Promise<{ items: FulfillmentItem[] }> {
  const res = await apiGet<{ items: FulfillmentItem[] }>('delivery/fulfillment-queue');
  return unwrap(res);
}

export async function markFulfillmentFulfilled(id: number, notes?: string | null) {
  const res = await apiPost<{ item: FulfillmentItem }>(`delivery/fulfillment-queue/${id}/fulfilled`, { notes });
  const d = unwrap(res);
  return d.item;
}

export async function markFulfillmentFailed(id: number, notes?: string | null) {
  const res = await apiPost<{ item: FulfillmentItem }>(`delivery/fulfillment-queue/${id}/failed`, { notes });
  const d = unwrap(res);
  return d.item;
}

export async function processDelivery(orderId: number) {
  const res = await apiPost('delivery/orders/' + orderId + '/process', {});
  return unwrap(res);
}

// ---- Payment proofs ----
export interface PendingProof {
  id: number;
  order_id: number;
  user_id: number;
  user_email: string;
  sender_number: string | null;
  transaction_id: string | null;
  paid_amount: number | null;
  file_path: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  /** From linked order when proof omits paid_amount (common). Present when API includes order join. */
  order_number?: string;
  order_total?: number;
  order_currency?: string;
}

export async function getPendingProofs(): Promise<{ proofs: PendingProof[] }> {
  const res = await apiGet<{ proofs: PendingProof[] }>('payments/proofs/pending');
  return unwrap(res);
}

export async function getRecentPaymentProofs(params?: {
  limit?: number;
  offset?: number;
  status?: 'pending' | 'verified' | 'rejected' | 'all';
  /** When true, omits pending proofs (verified + rejected only). */
  exclude_pending?: boolean;
}): Promise<{ proofs: PendingProof[]; total: number }> {
  const res = await apiGet<{ proofs: PendingProof[]; total: number }>('payments/proofs/admin/recent', {
    params: params as Record<string, string | number | boolean | undefined>,
  });
  return unwrap(res);
}

export async function approveProof(id: number) {
  const res = await apiPost(`payments/proofs/${id}/approve`, {});
  return unwrap(res);
}

export async function rejectProof(id: number) {
  const res = await apiPost(`payments/proofs/${id}/reject`, {});
  return unwrap(res);
}

// ---- Payment options (admin) ----

export interface AdminMerchantCredentialsMasked {
  username: string;
  app_key: string;
  agreement_id: string;
  base_url: string;
  callback_base_url: string;
  password_set: boolean;
  app_secret_set: boolean;
}

export interface AdminPaymentOption extends PaymentMethod {
  payment_option_id: number;
  is_enabled: boolean;
  sort_order: number;
  merchant_credentials_masked?: AdminMerchantCredentialsMasked | null;
}

export async function getAdminPaymentOptions(): Promise<{ payment_options: AdminPaymentOption[] }> {
  const res = await apiGet<{ payment_options: AdminPaymentOption[] }>('admin/payment-options');
  return unwrap(res);
}

export async function createAdminPaymentOption(body: {
  kind: 'manual' | 'merchant';
  gateway_key: string;
  name: string;
  description?: string | null;
  is_enabled?: boolean;
  sort_order?: number;
  manual_flow?: 'mfs_reference' | 'bank_proof' | null;
  bank_details?: Record<string, unknown> | null;
  merchant_credentials?: Record<string, unknown> | null;
  ui_brand?: string | null;
}): Promise<AdminPaymentOption> {
  const res = await apiPost<{ payment_option: AdminPaymentOption }>('admin/payment-options', body);
  return unwrap(res).payment_option;
}

export async function updateAdminPaymentOption(
  id: number,
  body: Partial<{
    name: string;
    description: string | null;
    is_enabled: boolean;
    sort_order: number;
    manual_flow: 'mfs_reference' | 'bank_proof' | null;
    bank_details: Record<string, unknown> | null;
    merchant_credentials: Record<string, unknown> | null;
    ui_brand: string | null;
  }>
): Promise<AdminPaymentOption> {
  const res = await apiPatch<{ payment_option: AdminPaymentOption }>(`admin/payment-options/${id}`, body);
  return unwrap(res).payment_option;
}

export async function deleteAdminPaymentOption(id: number): Promise<void> {
  const res = await apiDelete<Record<string, never>>(`admin/payment-options/${id}`);
  unwrap(res);
}

// ---- Tickets (admin) ----
export async function getAdminTickets(params?: { status?: string; limit?: number; offset?: number }) {
  const res = await apiGet<{ tickets: import('./tickets').TicketListItem[] }>('tickets/admin/all', {
    params: params as Record<string, string | number | boolean | undefined>,
  });
  return unwrap(res);
}

/**
 * Open tickets for the admin Tickets nav badge.
 * Loads the admin list without a status filter (same as “All statuses”) and counts `open` client-side,
 * so we never send an invalid `status` query (must be lowercase: open, answered, … per API validators).
 */
export async function getAdminOpenTicketsCount(): Promise<number> {
  const { tickets } = await getAdminTickets({ limit: 200 });
  return tickets.filter((t) => t.status === 'open').length;
}

export async function getAdminTicketDetails(ticketId: number) {
  const res = await apiGet<import('./tickets').TicketDetail>(`tickets/admin/${ticketId}`);
  return unwrap(res);
}

export async function updateTicketStatus(ticketId: number, status: string) {
  const res = await apiPatch<{ ticket: import('./tickets').TicketDetail }>(`tickets/admin/${ticketId}/status`, {
    status,
  });
  const d = unwrap(res);
  return d.ticket;
}

export async function adminReplyToTicket(
  ticketId: number,
  data: { message: string; attachment?: File }
) {
  const formData = new FormData();
  formData.append('message', data.message.trim());
  if (data.attachment) formData.append('attachment', data.attachment);
  const res = await apiPostFormData<{ ticket: import('./tickets').TicketDetail }>(
    `tickets/admin/${ticketId}/reply`,
    formData
  );
  const d = unwrap(res);
  return d.ticket;
}

// ---- Coupons ----
export interface CouponItem {
  id: number;
  code: string;
  type: string;
  value: number;
  min_order_amount: number | null;
  max_uses: number | null;
  max_uses_per_user: number | null;
  used_count: number;
  valid_from: string | null;
  valid_until: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export async function getCoupons(): Promise<{ coupons: CouponItem[] }> {
  const res = await apiGet<{ coupons: CouponItem[] }>('coupons');
  return unwrap(res);
}

export async function getCouponById(id: number) {
  const res = await apiGet<{ coupon: CouponItem }>(`coupons/${id}`);
  const d = unwrap(res);
  return d.coupon;
}

export async function createCoupon(body: {
  code: string;
  type: 'percentage' | 'fixed_amount';
  value: number;
  min_order_amount?: number | null;
  max_uses?: number | null;
  max_uses_per_user?: number | null;
  valid_from?: string | null;
  valid_until?: string | null;
  is_active?: boolean;
}) {
  const res = await apiPost<{ coupon: CouponItem }>('coupons', body);
  const d = unwrap(res);
  return d.coupon;
}

export async function updateCoupon(
  id: number,
  body: Partial<{
    code: string;
    type: 'percentage' | 'fixed_amount';
    value: number;
    min_order_amount: number | null;
    max_uses: number | null;
    max_uses_per_user: number | null;
    valid_from: string | null;
    valid_until: string | null;
    is_active: boolean;
  }>
) {
  const res = await apiPut<{ coupon: CouponItem }>(`coupons/${id}`, body);
  const d = unwrap(res);
  return d.coupon;
}

export async function deleteCoupon(id: number): Promise<void> {
  const res = await apiDelete<Record<string, never>>(`coupons/${id}`);
  unwrap(res);
}

export async function setCouponActive(id: number, isActive: boolean) {
  const res = await apiPatch<{ coupon: CouponItem }>(`coupons/${id}/active`, { is_active: isActive });
  const d = unwrap(res);
  return d.coupon;
}

// ---- Reviews (admin) ----
export async function getReviewAdmin(reviewId: number) {
  const res = await apiGet<unknown>(`reviews/admin/${reviewId}`);
  return unwrap(res);
}

export async function setReviewHidden(reviewId: number, hidden: boolean) {
  const res = await apiPatch(`reviews/${reviewId}/hidden`, { hidden });
  return unwrap(res);
}

/** Paginated reviews across products; optional category_id (omit = all, 0 = uncategorized). */
export async function getAdminReviewsList(params: {
  limit?: number;
  offset?: number;
  category_id?: number;
}) {
  const q: Record<string, string | number> = {};
  if (params.limit != null) q.limit = params.limit;
  if (params.offset != null && params.offset > 0) q.offset = params.offset;
  if (params.category_id !== undefined) q.category_id = params.category_id;
  const res = await apiGet<{ reviews: ProductReviewAdminTableRow[]; total: number }>('reviews/admin', {
    params: q,
  });
  return unwrap(res);
}

// ---- Admin accounts (auth + admin) ----

export async function changeAdminPassword(
  currentPassword: string,
  newPassword: string
): Promise<{ message: string }> {
  const res = await apiPost<{ message: string }>('admin/admins/me/password', {
    currentPassword,
    newPassword,
  });
  return unwrap(res);
}

export async function createAdminAccount(body: {
  email: string;
  password: string;
  name?: string;
}): Promise<{ admin: import('@/types/auth').SafeUser }> {
  const res = await apiPost<{ admin: import('@/types/auth').SafeUser }>('admin/admins', body);
  return unwrap(res);
}
